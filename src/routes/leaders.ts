import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma CJS interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const leadersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/leaders', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMemberships: {
            include: { team: true },
          },
          school: true,
        },
      });
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }

      // Team leaderboard
      const teamMemberPromises = user.teamMemberships.map((membership) =>
        prisma.teamMembership.findMany({
          where: { teamId: membership.teamId },
          include: {
            user: {
              include: {
                performanceMetrics: {
                  orderBy: { calculatedAt: 'desc' },
                  take: 2,
                },
              },
            },
          },
        })
      );
      const teamMembersNested = await Promise.all(teamMemberPromises);
      const teamLeaderboard = teamMembersNested
        .flat()
        .map((m) => {
          const metrics = m.user.performanceMetrics;
          const score = metrics[0]?.performanceScore ?? 0;
          let trend: 'up' | 'down' | 'none' = 'none';
          if (metrics.length > 1) {
            if (metrics[0].performanceScore > metrics[1].performanceScore) trend = 'up';
            else if (metrics[0].performanceScore < metrics[1].performanceScore) trend = 'down';
          }
          return {
            id: m.user.id,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            profileImage: m.user.profileImage,
            performanceScore: score,
            trend,
          };
        })
        .sort((a, b) => b.performanceScore - a.performanceScore);

      // School leaderboard
      let schoolLeaderboard: typeof teamLeaderboard = [];
      if (user.schoolId) {
        const schoolUsers = await prisma.user.findMany({
          where: {
            schoolId: user.schoolId,
            performanceMetrics: { some: {} },
          },
          include: {
            performanceMetrics: {
              orderBy: { calculatedAt: 'desc' },
              take: 2,
            },
          },
        });
        schoolLeaderboard = schoolUsers.map((u) => {
          const score = u.performanceMetrics[0]?.performanceScore ?? 0;
          let trend: 'up' | 'down' | 'none' = 'none';
          if (u.performanceMetrics.length > 1) {
            if (u.performanceMetrics[0].performanceScore > u.performanceMetrics[1].performanceScore)
              trend = 'up';
            else if (u.performanceMetrics[0].performanceScore < u.performanceMetrics[1].performanceScore)
              trend = 'down';
          }
          return {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            profileImage: u.profileImage,
            performanceScore: score,
            trend,
          };
        }).sort((a, b) => b.performanceScore - a.performanceScore);
      }

      reply.send({ teamLeaderboard, schoolLeaderboard });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });
};

export default leadersRoutes; 