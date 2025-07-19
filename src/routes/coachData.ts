import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const coachDataRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper function to get start of week UTC
  function getStartOfWeekUTC(): Date {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = now.getUTCDate() - dayOfWeek;
    const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
    startOfWeek.setUTCHours(0, 0, 0, 0);
    return startOfWeek;
  }

  // Helper function to get days passed in week
  function getDaysPassedInWeekUTC(): number {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, ..., 6 = Saturday
    return dayOfWeek + 1; // +1 because day index is 0-based
  }

  // GET /coaches/:coachId/dashboard – get coach dashboard data
  fastify.get('/coaches/:coachId/dashboard', async (request, reply) => {
    const { coachId } = request.params as { coachId: string };

    try {
      console.log(`Fetching coach dashboard data for coachId: ${coachId}`);

      // Get teams coached by this user
      const coachedTeams = await prisma.teamMembership.findMany({
        where: { userId: coachId, role: 'coach' },
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
        recentActivities: [], // TODO: Implement recent activities
        totalAthletes,
      };

      console.log(`Dashboard data fetched: ${teams.length} teams, ${totalAthletes} athletes`);
      reply.send(dashboardData);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch coach dashboard data' });
    }
  });

  // GET /teams/:teamId/athletes – get team athletes with stats
  fastify.get('/teams/:teamId/athletes', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };

    try {
      console.log(`Fetching athletes and stats for teamId: ${teamId}`);
      const startOfWeek = getStartOfWeekUTC();
      const now = new Date();
      const daysPassed = getDaysPassedInWeekUTC();

      const teamMemberships = await prisma.teamMembership.findMany({
        where: {
          teamId: teamId,
          role: 'member', // Only get athletes
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

      if (!teamMemberships || teamMemberships.length === 0) {
        reply.send({ athletes: [], error: null });
        return;
      }

      const athleteIds = teamMemberships.map((membership) => membership.userId);

      // Fetch data needed for calculations concurrently
      const [journalCounts, questCounts, latestInsightsData] = await Promise.all([
        // Count journals submitted this week per athlete
        prisma.journal.groupBy({
          by: ['authorID'],
          where: {
            authorID: { in: athleteIds },
            createdAt: { gte: startOfWeek, lte: now },
          },
          _count: {
            id: true,
          },
        }),
        // Count total and completed quests assigned this week per athlete
        prisma.userQuest.groupBy({
          by: ['userId', 'status'],
          where: {
            userId: { in: athleteIds },
            assignedAt: { gte: startOfWeek, lte: now },
          },
          _count: {
            id: true,
          },
        }),
        // Get latest insights for player status
        prisma.journalInsight.findMany({
          where: {
            athleteId: { in: athleteIds },
            teamId: teamId,
          },
          distinct: ['athleteId'],
          orderBy: { weekEnd: 'desc' },
          select: {
            id: true,
            athleteId: true,
            summary: true,
            weekStart: true,
            weekEnd: true,
            playerStatus: true,
          },
        }),
      ]);

      // Process data into maps for easy lookup
      const journalMap = new Map(journalCounts.map((item) => [item.authorID, item._count.id]));

      const questStatsMap = new Map<string, { total: number; completed: number }>();
      questCounts.forEach((item) => {
        const stats = questStatsMap.get(item.userId) || { total: 0, completed: 0 };
        stats.total += item._count.id;
        if (item.status === 'completed') {
          stats.completed += item._count.id;
        }
        questStatsMap.set(item.userId, stats);
      });

      const insightMap = new Map(latestInsightsData.map((item) => [item.athleteId, item]));

      // Map memberships to the final Athlete structure with calculated stats
      const athletes = teamMemberships.map((membership) => {
        const athleteId = membership.userId;
        const user = membership.user;

        // Calculate Journal Rate
        const submittedJournals = journalMap.get(athleteId) || 0;
        const expectedJournals = daysPassed;
        const weeklyJournalRate =
          expectedJournals > 0
            ? Math.min(100, (submittedJournals / expectedJournals) * 100)
            : 0;

        // Calculate Quest Rate
        const questStats = questStatsMap.get(athleteId) || { total: 0, completed: 0 };
        const questCompletionPercentage =
          questStats.total > 0 ? (questStats.completed / questStats.total) * 100 : 0;

        // Get latest insight details
        const latestInsight = insightMap.get(athleteId);
        const playerStatus = latestInsight?.playerStatus ?? 'On Track ✅';

        return {
          id: athleteId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profileImage: user.profileImage,
          weeklyJournalRate: parseFloat(weeklyJournalRate.toFixed(1)),
          questCompletionPercentage: parseFloat(questCompletionPercentage.toFixed(1)),
          journalsThisWeek: submittedJournals,
          completedQuests: questStats.completed,
          totalQuests: questStats.total,
          pointsEarned: 0,
          playerStatus: playerStatus,
          latestInsight: latestInsight
            ? {
                id: latestInsight.id,
                summary: latestInsight.summary,
                weekStart: latestInsight.weekStart.toISOString(),
                weekEnd: latestInsight.weekEnd.toISOString(),
                playerStatus: latestInsight.playerStatus ?? undefined,
              }
            : undefined,
        };
      });

      console.log(`Processed ${athletes.length} athletes for team ${teamId}`);
      reply.send({ athletes, error: null });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch athlete data' });
    }
  });

  // PUT /users/:athleteId/status – update player status
  fastify.put('/users/:athleteId/status', async (request, reply) => {
    const { athleteId } = request.params as { athleteId: string };
    const body = request.body as { teamId: string; status: string };

    try {
      if (!body.teamId || !body.status) {
        reply.code(400).send({ error: 'teamId and status are required' });
        return;
      }

      // Find the most recent insight for this athlete and team
      const latestInsight = await prisma.journalInsight.findFirst({
        where: {
          athleteId,
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
      fastify.log.error(err);
      reply.code(500).send({
        success: false,
        error: 'Failed to update player status',
      });
    }
  });

  // GET /coaches/:coachId/players/:playerId/access – check coach access to player
  fastify.get('/coaches/:coachId/players/:playerId/access', async (request, reply) => {
    const { coachId, playerId } = request.params as { coachId: string; playerId: string };

    try {
      if (!playerId) {
        reply.code(400).send({ error: 'Player ID is required' });
        return;
      }
      if (!coachId) {
        reply.code(400).send({ error: 'Coach ID is required' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: playerId },
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
          userId: coachId,
          role: 'coach',
          team: {
            memberships: {
              some: { userId: playerId },
            },
          },
        },
      });

      reply.send({ user, isCoach: !!isCoach });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to check coach access' });
    }
  });
};

export default coachDataRoutes; 