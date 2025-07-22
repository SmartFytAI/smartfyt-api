import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import log from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/stats', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const [categories, userStats] = await Promise.all([
        prisma.questCategory.findMany(),
        prisma.userStat.findMany({
          where: { userId },
          include: { category: true },
        }),
      ]);
      const map = new Map(userStats.map((s) => [s.categoryId, s]));
      const completeStats = categories.map((c) => {
        const s = map.get(c.id);
        return s
          ? {
              id: s.id,
              categoryId: s.categoryId,
              categoryName: s.category.name,
              points: s.points,
              level: s.level,
            }
          : {
              id: `temp-${c.id}`,
              categoryId: c.id,
              categoryName: c.name,
              points: 0,
              level: 1,
            };
      });
      log.info(`Fetched stats for user: ${userId}`, { statsCount: completeStats.length });
      reply.send(completeStats);
    } catch (err) {
      log.error('Failed to fetch stats', err, { userId });
      reply.code(500).send({ error: 'Failed to fetch stats' });
    }
  });
};

export default statsRoutes;
