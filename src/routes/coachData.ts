import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, athleteIdParamSchema, coachFeedbackBodySchema, playerIdWithCoachIdSchema, coachIdParamSchema, teamIdParamSchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';

const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const coachDataRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /coaches/:coachId/dashboard – get coach dashboard data
  fastify.get('/coaches/:coachId/dashboard', async (request, reply) => {
    try {
      const params = validateRequest(coachIdParamSchema, request.params, 'Get coach dashboard params');

      log.info(`Fetching coach dashboard data for coachId: ${params.coachId}`);

      // Get teams coached by this user
      const coachedTeams = await prisma.teamMembership.findMany({
        where: { userId: params.coachId, role: 'coach' },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              sportID: true,
              schoolID: true,
              sport: { select: { id: true, name: true } },
              school: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (coachedTeams.length === 0) {
        reply.send({
          teams: [],
          questStats: {},
          journalStats: {},
          recentActivities: [],
          totalAthletes: 0,
        });
        return;
      }

      const teams = coachedTeams.map((ct) => ({
        id: ct.team.id,
        name: ct.team.name,
        sportID: ct.team.sportID,
        schoolID: ct.team.schoolID,
        sport: ct.team.sport,
        school: ct.team.school,
      }));

      const teamIds = teams.map((team) => team.id);

      // Get athlete memberships for total count
      const athleteMemberships = await prisma.teamMembership.findMany({
        where: {
          teamId: { in: teamIds },
          role: 'member',
        },
        select: {
          userId: true,
          teamId: true,
        },
      });

      // Calculate total distinct athletes
      const distinctAthleteIds = new Set(athleteMemberships.map((m) => m.userId));
      const totalAthletes = distinctAthleteIds.size;

      // Count athletes per team
      const teamAthleteCounts: { [teamId: string]: number } = {};
      athleteMemberships.forEach((m) => {
        teamAthleteCounts[m.teamId] = (teamAthleteCounts[m.teamId] || 0) + 1;
      });

      const enhancedTeams = teams.map((team) => ({
        ...team,
        athleteCount: teamAthleteCounts[team.id] || 0,
      }));

      // For now, return basic data - quest/journal stats can be calculated separately
      const dashboardData = {
        teams: enhancedTeams,
        questStats: {},
        journalStats: {},
        recentActivities: [],
        totalAthletes,
      };

      reply.send(dashboardData);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in getCoachDashboard:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch coach dashboard data' });
    }
  });

  // GET /teams/:teamId/athletes – get team athletes
  fastify.get('/teams/:teamId/athletes', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Get team athletes params');

      const athletes = await prisma.teamMembership.findMany({
        where: {
          teamId: params.teamId,
          role: 'member',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
        },
      });

      const athleteData = athletes.map((membership: any) => ({
        id: membership.user.id,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        email: membership.user.email,
        profileImage: membership.user.profileImage,
        joinedAt: membership.joinedAt,
      }));

      reply.send({ success: true, athletes: athleteData });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in getTeamAthletes:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch team athletes' });
    }
  });

  // PUT /users/:athleteId/status – update player status
  fastify.put('/users/:athleteId/status', async (request, reply) => {
    try {
      const params = validateRequest(athleteIdParamSchema, request.params, 'Update player status params');
      const body = validateRequest(coachFeedbackBodySchema, request.body, 'Update player status body');

      // Find the most recent insight for this athlete and team
      const latestInsight = await prisma.journalInsight.findFirst({
        where: {
          athleteId: params.athleteId,
          teamId: body.teamId,
        },
        orderBy: {
          weekEnd: 'desc',
        },
      });

      if (latestInsight) {
        // Update the existing insight with the new status
        await prisma.journalInsight.update({
          where: {
            id: latestInsight.id,
          },
          data: {
            playerStatus: body.status,
          },
        });

        reply.send({
          success: true,
          message: 'Player status updated successfully',
        });
      } else {
        reply.code(404).send({
          success: false,
          error: 'No journal insight found for this athlete',
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in updatePlayerStatus:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      fastify.log.error(err);
      reply.code(500).send({
        success: false,
        error: 'Failed to update player status',
      });
    }
  });

  // GET /coaches/:coachId/players/:playerId/access – check coach access to player
  fastify.get('/coaches/:coachId/players/:playerId/access', async (request, reply) => {
    try {
      const params = validateRequest(playerIdWithCoachIdSchema, request.params, 'Check coach access params');

      const user = await prisma.user.findUnique({
        where: { id: params.playerId },
        include: {
          teamMemberships: {
            include: { team: true },
          },
        },
      });

      if (!user) {
        reply.code(404).send({ error: 'Player not found' });
        return;
      }

      const isCoach = await prisma.teamMembership.findFirst({
        where: {
          userId: params.coachId,
          role: 'coach',
          team: {
            memberships: {
              some: {
                userId: params.playerId,
              },
            },
          },
        },
      });

      if (isCoach) {
        reply.send({ hasAccess: true });
      } else {
        reply.send({ hasAccess: false });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        log.warn('[API] Validation error in checkCoachAccess:', { error: err.message });
        reply.code(400).send({ error: err.message });
        return;
      }
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to check coach access' });
    }
  });
};

export default coachDataRoutes;
