import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/dashboard – aggregate dashboard data
  fastify.get('/users/:userId/dashboard', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get dashboard params');

      const [user, userQuests, categories, userStats, dailySummaries, sleepDetails, activityDetails, userForm] = await Promise.all([
        // User info
        prisma.user.findUnique({
          where: { id: params.userId },
          select: {
            activeRole: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            schoolId: true,
          },
        }),

        // User quests
        prisma.userQuest.findMany({
          where: { userId: params.userId, status: 'assigned' },
          include: {
            quest: { include: { category: true } },
          },
        }),

        // All quest categories
        prisma.questCategory.findMany(),

        // User stats
        prisma.userStat.findMany({
          where: { userId: params.userId },
          include: { category: true },
        }),

        // Health data: daily summaries
        prisma.dailyHealthSummary.findMany({
          where: { userId: params.userId },
          orderBy: { date: 'desc' },
          take: 7,
        }),

        // Health data: sleep details
        prisma.sleepDetail.findMany({
          where: { userId: params.userId },
          orderBy: { startTime: 'desc' },
          take: 7,
        }),

        // Health data: activity details
        prisma.activityDetail.findMany({
          where: { userId: params.userId },
          orderBy: { startTime: 'desc' },
          take: 7,
          include: { heartRateZones: true },
        }),

        // Check if user has form submission
        prisma.userForm.findFirst({
          where: { authorID: params.userId },
          select: { id: true },
        }),
      ]);

      // Format quests
      const quests = userQuests.map((uq) => ({
        id: uq.quest.id,
        title: uq.quest.title,
        description: uq.quest.description,
        pointValue: uq.quest.pointValue,
        categoryName: uq.quest.category.name,
        completedAt: uq.completedAt,
        status: uq.status,
      }));

      // Format stats (fill in missing categories with defaults)
      const userStatsMap = new Map(userStats.map((s) => [s.categoryId, s]));
      const stats = categories.map((c) => {
        const s = userStatsMap.get(c.id);
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

      // Health data
      const healthData = {
        dailySummaries,
        sleepDetails,
        activityDetails,
      };

      const dashboardData = {
        user,
        quests,
        stats,
        healthData,
        hasUserForm: !!userForm,
      };

      log.info(`Fetched dashboard data for user: ${params.userId}`);
      reply.send(dashboardData);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch dashboard data', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch dashboard data' });
    }
  });
};

export default dashboardRoutes;
