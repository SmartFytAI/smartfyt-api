import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/dashboard – aggregate dashboard data
  fastify.get('/users/:userId/dashboard', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    
    try {
      const [user, userQuests, categories, userStats, dailySummaries, sleepDetails, activityDetails, userForm] = await Promise.all([
        // User info
        prisma.user.findUnique({
          where: { id: userId },
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
          where: { userId, status: 'assigned' },
          include: {
            quest: { include: { category: true } },
          },
        }),
        
        // All quest categories
        prisma.questCategory.findMany(),
        
        // User stats
        prisma.userStat.findMany({
          where: { userId },
          include: { category: true },
        }),
        
        // Health data: daily summaries
        prisma.dailyHealthSummary.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 7,
        }),
        
        // Health data: sleep details
        prisma.sleepDetail.findMany({
          where: { userId },
          orderBy: { startTime: 'desc' },
          take: 7,
        }),
        
        // Health data: activity details
        prisma.activityDetail.findMany({
          where: { userId },
          orderBy: { startTime: 'desc' },
          take: 7,
          include: { heartRateZones: true },
        }),
        
        // Check if user has form submission
        prisma.userForm.findFirst({
          where: { authorID: userId },
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

      reply.send(dashboardData);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch dashboard data' });
    }
  });
};

export default dashboardRoutes; 