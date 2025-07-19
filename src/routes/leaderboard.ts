import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

// Helper function to calculate trend
function calculateTrend(metrics: { performanceScore: number }[]): 'up' | 'down' | 'none' {
  if (metrics.length < 2) return 'none';
  const latest = metrics[0].performanceScore;
  const previous = metrics[1].performanceScore;
  if (latest > previous) return 'up';
  if (latest < previous) return 'down';
  return 'none';
}

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/teams/leaderboard – get user's teams for leaderboard dropdown
  fastify.get('/users/:userId/teams/leaderboard', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const memberships = await prisma.teamMembership.findMany({
        where: { userId },
        select: { team: { select: { id: true, name: true } } },
        orderBy: { team: { name: 'asc' } },
      });

      const teamOptions = memberships.map((m) => ({
        id: m.team.id,
        name: m.team.name,
      }));

      reply.send(teamOptions);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Could not load your teams.' });
    }
  });

  // GET /teams/:teamId/leaderboard – get team leaderboard
  fastify.get('/teams/:teamId/leaderboard', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };

    try {
      if (!teamId) {
        reply.code(400).send({ error: 'Team ID is required' });
        return;
      }

      const members = await prisma.teamMembership.findMany({
        where: {
          teamId,
          role: 'member',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              performanceMetrics: {
                orderBy: { metricDate: 'desc' },
                take: 2,
                select: { performanceScore: true, metricDate: true },
              },
            },
          },
        },
      });

      const leaderboardUsers = members
        .map((m) => {
          const metrics = m.user?.performanceMetrics ?? [];
          const latestScore = metrics[0]?.performanceScore ?? 0;
          if (!m.user) {
            return null;
          }
          return {
            id: m.user.id,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            profileImage: m.user.profileImage,
            performanceScore: latestScore,
            trend: calculateTrend(metrics),
          };
        })
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 20);

      reply.send(leaderboardUsers);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Could not load team leaderboard.' });
    }
  });

  // GET /users/:userId/school/leaderboard – get school leaderboard for user
  fastify.get('/users/:userId/school/leaderboard', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const userInfo = await prisma.user.findUnique({
        where: { id: userId },
        select: { schoolId: true },
      });

      if (!userInfo?.schoolId) {
        reply.send([]); // Return empty array if no school
        return;
      }

      const schoolMembers = await prisma.user.findMany({
        where: {
          schoolId: userInfo.schoolId,
          roles: { has: 'member' },
          performanceMetrics: { some: {} },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          performanceMetrics: {
            orderBy: { metricDate: 'desc' },
            take: 2,
            select: { performanceScore: true, metricDate: true },
          },
        },
        take: 50,
      });

      const leaderboardUsers = schoolMembers
        .map((member) => {
          const metrics = member.performanceMetrics ?? [];
          const latestScore = metrics[0]?.performanceScore ?? 0;
          return {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            profileImage: member.profileImage,
            performanceScore: latestScore,
            trend: calculateTrend(metrics),
          };
        })
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 20);

      reply.send(leaderboardUsers);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Could not load school leaderboard.' });
    }
  });
};

export default leaderboardRoutes; 