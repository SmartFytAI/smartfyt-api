import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/health', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const [dailySummaries, sleepDetails, activityDetails] = await Promise.all([
        prisma.dailyHealthSummary.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 7,
        }),
        prisma.sleepDetail.findMany({
          where: { userId },
          orderBy: { startTime: 'desc' },
          take: 7,
        }),
        prisma.activityDetail.findMany({
          where: { userId },
          orderBy: { startTime: 'desc' },
          take: 7,
          include: { heartRateZones: true },
        }),
      ]);
      reply.send({ dailySummaries, sleepDetails, activityDetails });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch health data' });
    }
  });

  // GET /users/:userId/health/range – get health data for date range
  fastify.get('/users/:userId/health/range', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const query = request.query as { startDate?: string; endDate?: string };

    try {
      if (!query.startDate || !query.endDate) {
        reply.code(400).send({ error: 'startDate and endDate are required' });
        return;
      }

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        reply.code(400).send({ error: 'Invalid date format' });
        return;
      }

      const [dailySummaries, sleepDetails, activityDetails] = await Promise.all([
        prisma.dailyHealthSummary.findMany({
          where: {
            userId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { date: 'desc' },
        }),
        prisma.sleepDetail.findMany({
          where: {
            userId,
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { startTime: 'desc' },
        }),
        prisma.activityDetail.findMany({
          where: {
            userId,
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { startTime: 'desc' },
          include: { heartRateZones: true },
        }),
      ]);

      reply.send({ dailySummaries, sleepDetails, activityDetails });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch health data for date range' });
    }
  });

  // GET /users/:userId/health/stats – get all-time health stats
  fastify.get('/users/:userId/health/stats', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const [allDailySummaries, allSleepDetails, allActivityDetails] = await Promise.all([
        prisma.dailyHealthSummary.findMany({
          where: { userId },
          select: {
            date: true,
            steps: true,
            activeCalories: true,
            distanceMeters: true,
            sleepDurationSeconds: true,
            sleepScore: true,
          },
        }),
        prisma.sleepDetail.findMany({
          where: { userId },
          select: {
            startTime: true,
            durationTotalSeconds: true,
            score: true,
          },
        }),
        prisma.activityDetail.findMany({
          where: { userId },
          select: {
            startTime: true,
            type: true,
            durationSeconds: true,
            activeCalories: true,
            steps: true,
            distanceMeters: true,
          },
        }),
      ]);

      // Calculate totals
      const totalDays = allDailySummaries.length;
      const totalSteps = allDailySummaries.reduce((sum, day) => sum + (day.steps || 0), 0);
      const totalDistance = allDailySummaries.reduce((sum, day) => sum + (day.distanceMeters || 0), 0);
      const totalCalories = allDailySummaries.reduce((sum, day) => sum + (day.activeCalories || 0), 0);
      const totalSleepHours = allSleepDetails.reduce((sum, sleep) => sum + (sleep.durationTotalSeconds || 0), 0) / 3600;
      const totalWorkouts = allActivityDetails.filter(activity => activity.type !== 'WALKING' && activity.type !== 'STEPS_ONLY').length;

      // Calculate averages
      const avgStepsPerDay = totalDays > 0 ? Math.round(totalSteps / totalDays) : 0;
      const avgSleepHours = allSleepDetails.length > 0 ? Math.round((totalSleepHours / allSleepDetails.length) * 10) / 10 : 0;
      const avgCaloriesPerDay = totalDays > 0 ? Math.round(totalCalories / totalDays) : 0;

      reply.send({
        totalDays,
        totalSteps,
        totalDistance: Math.round(totalDistance),
        totalCalories,
        totalSleepHours: Math.round(totalSleepHours * 10) / 10,
        totalWorkouts,
        avgStepsPerDay,
        avgSleepHours,
        avgCaloriesPerDay,
        dailySummaries: allDailySummaries,
        sleepDetails: allSleepDetails,
        activityDetails: allActivityDetails,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch health stats' });
    }
  });
};

export default healthRoutes; 