import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
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
        console.warn(`Unsupported chat role encountered: ${role}. Saving as system.`);
        return 'system';
    }
  }

  // POST /users/:userId/chat-sessions – save a chat session
  fastify.post('/users/:userId/chat-sessions', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = request.body as {
      messages: Array<{
        role: string;
        content: string | object;
      }>;
    };

    try {
      if (!body.messages || !Array.isArray(body.messages)) {
        reply.code(400).send({ error: 'messages array is required' });
        return;
      }

      console.log(`Attempting to save chat session for userId: ${userId}`);
      console.log(`Messages received: ${body.messages.length}`);

      // Filter out tool/function messages if you don't want to save them
      const messagesToSave = body.messages.filter(
        (m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system'
      );

      // Don't save empty chats or chats with only system prompts
      if (messagesToSave.filter((m) => m.role === 'user' || m.role === 'assistant').length === 0) {
        console.log('No user/assistant messages found, skipping save.');
        reply.send({ success: true });
        return;
      }

      // Create the chat session
      const chatSession = await prisma.chatSession.create({
        data: {
          userId,
        },
      });

      console.log(`Created ChatSession with ID: ${chatSession.id}`);

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

      console.log(`Saved ${chatMessagesData.length} messages for session ${chatSession.id}`);
      reply.send({ success: true, sessionId: chatSession.id });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to save chat session' });
    }
  });

  // GET /users/:userId/chat-sessions – get previous chat sessions
  fastify.get('/users/:userId/chat-sessions', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = '3' } = request.query as { limit?: string };

    try {
      if (!userId) {
        reply.code(400).send({ error: 'User ID is required' });
        return;
      }

      const limitNumber = parseInt(limit, 10) || 3;

      const sessions = await prisma.chatSession.findMany({
        where: {
          userId,
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

      console.log(`Fetched ${sessions.length} previous chat sessions for userId: ${userId}`);
      reply.send({ sessions });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch chat sessions' });
    }
  });
};

export default chatSessionsRoutes; 