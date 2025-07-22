import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema, metricsQuerySchema } from '../plugins/validation.js';
import log from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const metricsLatestRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/metrics/latest?days=N – return recent performance metrics
  fastify.get('/users/:userId/metrics/latest', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get metrics latest params');
      const query = validateRequest(metricsQuerySchema, request.query, 'Get metrics latest query');

      const daysNumber = parseInt(query.days || '1', 10) || 1;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNumber);

      const metrics = await prisma.userPerformanceMetrics.findMany({
        where: {
          userId: params.userId,
          metricDate: {
            gte: cutoffDate,
          },
        },
        orderBy: { metricDate: 'desc' },
      });

      log.info(`Fetched latest metrics for user: ${params.userId}`, {
        days: daysNumber,
        metricsCount: metrics.length
      });

      reply.send(metrics);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch performance metrics', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch performance metrics' });
    }
  });
};

export default metricsLatestRoutes;
