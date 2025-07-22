import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema, healthRangeQuerySchema } from '../plugins/validation.js';
import log from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/health', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get health params');

      const [dailySummaries, sleepDetails, activityDetails] = await Promise.all([
        prisma.dailyHealthSummary.findMany({
          where: { userId: params.userId },
          orderBy: { date: 'desc' },
          take: 7,
        }),
        prisma.sleepDetail.findMany({
          where: { userId: params.userId },
          orderBy: { startTime: 'desc' },
          take: 7,
        }),
        prisma.activityDetail.findMany({
          where: { userId: params.userId },
          orderBy: { startTime: 'desc' },
          take: 7,
          include: { heartRateZones: true },
        }),
      ]);

      log.info(`Fetched health data for user: ${params.userId}`, {
        dailySummariesCount: dailySummaries.length,
        sleepDetailsCount: sleepDetails.length,
        activityDetailsCount: activityDetails.length,
      });

      reply.send({ dailySummaries, sleepDetails, activityDetails });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch health data', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch health data' });
    }
  });

  // GET /users/:userId/health/range – get health data for date range
  fastify.get('/users/:userId/health/range', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get health range params');
      const query = validateRequest(healthRangeQuerySchema, request.query, 'Get health range query');

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        reply.code(400).send({ error: 'Invalid date format' });
        return;
      }

      const [dailySummaries, sleepDetails, activityDetails] = await Promise.all([
        prisma.dailyHealthSummary.findMany({
          where: {
            userId: params.userId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { date: 'desc' },
        }),
        prisma.sleepDetail.findMany({
          where: {
            userId: params.userId,
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { startTime: 'desc' },
        }),
        prisma.activityDetail.findMany({
          where: {
            userId: params.userId,
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { startTime: 'desc' },
          include: { heartRateZones: true },
        }),
      ]);

      log.info(`Fetched health data for date range for user: ${params.userId}`, {
        startDate: query.startDate,
        endDate: query.endDate,
        dailySummariesCount: dailySummaries.length,
        sleepDetailsCount: sleepDetails.length,
        activityDetailsCount: activityDetails.length,
      });

      reply.send({ dailySummaries, sleepDetails, activityDetails });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch health data for date range', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch health data for date range' });
    }
  });

  // GET /users/:userId/health/stats – get all-time health stats
  fastify.get('/users/:userId/health/stats', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get health stats params');

      const [allDailySummaries, allSleepDetails, allActivityDetails] = await Promise.all([
        prisma.dailyHealthSummary.findMany({
          where: { userId: params.userId },
          orderBy: { date: 'desc' },
        }),
        prisma.sleepDetail.findMany({
          where: { userId: params.userId },
          orderBy: { startTime: 'desc' },
        }),
        prisma.activityDetail.findMany({
          where: { userId: params.userId },
          orderBy: { startTime: 'desc' },
          include: { heartRateZones: true },
        }),
      ]);

      // Calculate stats
      const totalDays = allDailySummaries.length;
      const totalSleepSessions = allSleepDetails.length;
      const totalActivitySessions = allActivityDetails.length;

      const avgSleepHours = totalSleepSessions > 0
        ? allSleepDetails.reduce((sum, sleep) => sum + (sleep.durationTotalSeconds || 0), 0) / totalSleepSessions / 3600 // Convert seconds to hours
        : 0;

      const avgActivityDuration = totalActivitySessions > 0
        ? allActivityDetails.reduce((sum, activity) => sum + (activity.durationSeconds || 0), 0) / totalActivitySessions / 60 // Convert seconds to minutes
        : 0;

      const stats = {
        totalDays,
        totalSleepSessions,
        totalActivitySessions,
        avgSleepHours: Math.round(avgSleepHours * 100) / 100,
        avgActivityDuration: Math.round(avgActivityDuration * 100) / 100,
      };

      log.info(`Fetched health stats for user: ${params.userId}`, stats);

      reply.send(stats);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch health stats', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch health stats' });
    }
  });
};

export default healthRoutes;
