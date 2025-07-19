import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const questsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/quests', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const userQuests = await prisma.userQuest.findMany({
        where: { userId, status: 'assigned' },
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
      reply.send(quests);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch quests' });
    }
  });
};

export default questsRoutes; 