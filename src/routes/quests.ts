import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const questsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/quests', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get user quests params');

      const userQuests = await prisma.userQuest.findMany({
        where: { userId: params.userId, status: 'assigned' },
        include: {
          quest: { include: { category: true } },
        },
      });
      const quests = userQuests.map((uq) => ({
        id: uq.quest.id,
        title: uq.quest.title,
        description: uq.quest.description,
        pointValue: uq.quest.pointValue,
        categoryName: uq.quest.category.name,
        completedAt: uq.completedAt,
        status: uq.status,
      }));

      log.info(`Fetched ${quests.length} quests for user: ${params.userId}`);
      reply.send(quests);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch quests', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch quests' });
    }
  });

  fastify.get('/users/:userId/quests/available', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get available quests params');

      // Get all quests that are not assigned to this user
      const availableQuests = await prisma.quest.findMany({
        where: {
          userQuests: {
            none: {
              userId: params.userId,
            },
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const quests = availableQuests.map((quest) => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        pointValue: quest.pointValue,
        categoryName: quest.category.name,
        isNew: true, // All available quests are considered "new"
      }));

      log.info(`Fetched ${quests.length} available quests for user: ${params.userId}`);
      reply.send(quests);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch available quests', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch available quests' });
    }
  });
};

export default questsRoutes;
