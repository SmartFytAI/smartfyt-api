import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema, teamIdParamSchema } from '../plugins/validation.js';
import log from '../utils/logger.js';
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
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get user teams leaderboard params');

      const memberships = await prisma.teamMembership.findMany({
        where: { userId: params.userId },
        select: { team: { select: { id: true, name: true } } },
        orderBy: { team: { name: 'asc' } },
      });

      const teamOptions = memberships.map((m) => ({
        id: m.team.id,
        name: m.team.name,
      }));

      log.info(`Fetched team options for leaderboard for user: ${params.userId}`, { teamCount: teamOptions.length });
      reply.send(teamOptions);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Could not load user teams for leaderboard', err, { userId: request.params });
      reply.code(500).send({ error: 'Could not load your teams.' });
    }
  });

  // GET /teams/:teamId/leaderboard – get team leaderboard
  fastify.get('/teams/:teamId/leaderboard', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Get team leaderboard params');

      const members = await prisma.teamMembership.findMany({
        where: {
          teamId: params.teamId,
          role: { in: ['member', 'player', 'student'] },
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

      log.info(`Fetched team leaderboard for team: ${params.teamId}`, { userCount: leaderboardUsers.length });
      reply.send(leaderboardUsers);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Could not load team leaderboard', err, { teamId: request.params });
      reply.code(500).send({ error: 'Could not load team leaderboard.' });
    }
  });

  // GET /users/:userId/school/leaderboard – get school leaderboard for user
  fastify.get('/users/:userId/school/leaderboard', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get school leaderboard params');

      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { schoolId: true },
      });

      if (!user?.schoolId) {
        reply.send([]);
        return;
      }

      const schoolUsers = await prisma.user.findMany({
        where: {
          schoolId: user.schoolId,
          performanceMetrics: { some: {} },
        },
        include: {
          performanceMetrics: {
            orderBy: { metricDate: 'desc' },
            take: 2,
            select: { performanceScore: true, metricDate: true },
          },
        },
      });

      const schoolLeaderboard = schoolUsers
        .map((u) => {
          const metrics = u.performanceMetrics || [];
          const score = metrics[0]?.performanceScore ?? 0;
          let trend: 'up' | 'down' | 'none' = 'none';
          if (metrics.length > 1) {
            if (metrics[0].performanceScore > metrics[1].performanceScore)
              trend = 'up';
            else if (metrics[0].performanceScore < metrics[1].performanceScore)
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
        })
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 20);

      log.info(`Fetched school leaderboard for user: ${params.userId}`, {
        schoolId: user.schoolId,
        userCount: schoolLeaderboard.length
      });
      reply.send(schoolLeaderboard);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Could not load school leaderboard', err, { userId: request.params });
      reply.code(500).send({ error: 'Could not load school leaderboard.' });
    }
  });
};

export default leaderboardRoutes;
