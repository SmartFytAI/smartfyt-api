import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const metricsLatestRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/metrics/latest?days=N – return recent performance metrics
  fastify.get('/users/:userId/metrics/latest', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { days = '1' } = request.query as { days?: string };
    
    try {
      const daysNumber = parseInt(days, 10) || 1;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNumber);

      const metrics = await prisma.userPerformanceMetrics.findMany({
        where: {
          userId,
          metricDate: {
            gte: cutoffDate,
          },
        },
        orderBy: { metricDate: 'desc' },
      });

      reply.send(metrics);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch performance metrics' });
    }
  });
};

export default metricsLatestRoutes; 