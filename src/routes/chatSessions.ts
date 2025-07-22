import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema, chatMessagesBodySchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const chatSessionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Map message role to Prisma enum
  function mapRoleToPrisma(role: string): 'user' | 'assistant' | 'system' {
    switch (role) {
      case 'user':
        return 'user';
      case 'assistant':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        log.warn(`Unsupported chat role encountered: ${role}. Saving as system.`);
        return 'system';
    }
  }

  // POST /users/:userId/chat-sessions – save a chat session
  fastify.post('/users/:userId/chat-sessions', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Create chat session params');
      const body = validateRequest(chatMessagesBodySchema, request.body, 'Create chat session body');

      log.info(`Attempting to save chat session for userId: ${params.userId}`);
      log.info(`Messages received: ${body.messages.length}`);

      // Filter out tool/function messages if you don't want to save them
      const messagesToSave = body.messages.filter(
        (m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system'
      );

      // Don't save empty chats or chats with only system prompts
      if (messagesToSave.filter((m) => m.role === 'user' || m.role === 'assistant').length === 0) {
        log.info('No user/assistant messages found, skipping save.');
        reply.send({ success: true });
        return;
      }

      // Create the chat session
      const chatSession = await prisma.chatSession.create({
        data: {
          userId: params.userId,
        },
      });

      log.info(`Created ChatSession with ID: ${chatSession.id}`);

      // Prepare messages for bulk insertion
      const chatMessagesData = messagesToSave.map((message) => ({
        sessionId: chatSession.id,
        role: mapRoleToPrisma(message.role),
        content:
          typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      }));

      // Create all chat messages linked to the session
      await prisma.chatMessage.createMany({
        data: chatMessagesData,
      });

      log.info(`Saved ${chatMessagesData.length} messages for session ${chatSession.id}`);
      reply.send({ success: true, sessionId: chatSession.id });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to save chat session', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to save chat session' });
    }
  });

  // GET /users/:userId/chat-sessions – get previous chat sessions
  fastify.get('/users/:userId/chat-sessions', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get chat sessions params');
    const { limit = '3' } = request.query as { limit?: string };

      const limitNumber = parseInt(limit, 10) || 3;

      const sessions = await prisma.chatSession.findMany({
        where: {
          userId: params.userId,
        },
        orderBy: {
          createdAt: 'desc', // Get the most recent sessions first
        },
        take: limitNumber,
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc', // Order messages within each session chronologically
            },
          },
        },
      });

      log.info(`Fetched ${sessions.length} previous chat sessions for userId: ${params.userId}`);
      reply.send({ sessions });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch chat sessions', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch chat sessions' });
    }
  });
};

export default chatSessionsRoutes;
