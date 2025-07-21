import { FastifyPluginAsync } from 'fastify';
// ESM↔CJS interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

/**
 * Team management routes
 */
const teamsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/teams – Returns teams a user belongs to
  fastify.get('/users/:userId/teams', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const memberships = await prisma.teamMembership.findMany({
        where: { userId },
        select: {
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

      const teams = memberships.map((m) => ({
        id: m.team.id,
        name: m.team.name,
        sportID: m.team.sportID,
        schoolID: m.team.schoolID,
        sport: m.team.sport,
        school: m.team.school,
      }));

      reply.send(teams);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch teams' });
    }
  });

  // GET /teams – Get all teams (for admin/coach view)
  fastify.get('/teams', async (request, reply) => {
    try {
      const teams = await prisma.team.findMany({
        select: {
          id: true,
          name: true,
          sportID: true,
          schoolID: true,
          sport: { select: { id: true, name: true } },
          school: { select: { id: true, name: true } },
          _count: {
            select: { memberships: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      const teamsWithMemberCount = teams.map(team => ({
        id: team.id,
        name: team.name,
        sportID: team.sportID,
        schoolID: team.schoolID,
        sport: team.sport,
        school: team.school,
        memberCount: team._count.memberships
      }));

      reply.send(teamsWithMemberCount);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch all teams' });
    }
  });

  // GET /teams/:teamId/members – Get team members
  fastify.get('/teams/:teamId/members', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    try {
      const memberships = await prisma.teamMembership.findMany({
        where: { teamId },
        select: {
          userId: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
              activeRole: true
            }
          }
        },
        orderBy: { joinedAt: 'asc' }
      });

      const members = memberships.map(membership => ({
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: membership.user
      }));

      reply.send(members);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch team members' });
    }
  });

  // POST /teams – Create a new team
  fastify.post('/teams', async (request, reply) => {
    const body = request.body as {
      name: string;
      sportID: string;
      schoolID?: string;
      creatorId: string;
    };

    try {
      if (!body.name || !body.sportID || !body.creatorId) {
        reply.code(400).send({ error: 'Missing required fields: name, sportID, creatorId' });
        return;
      }

      // Check if sport exists
      const sport = await prisma.sport.findUnique({
        where: { id: body.sportID }
      });

      if (!sport) {
        reply.code(400).send({ error: 'Sport not found' });
        return;
      }

      // Check if school exists (if provided)
      if (body.schoolID) {
        const school = await prisma.school.findUnique({
          where: { id: body.schoolID }
        });

        if (!school) {
          reply.code(400).send({ error: 'School not found' });
          return;
        }
      }

      // Create team
      const newTeam = await prisma.team.create({
        data: {
          name: body.name,
          sportID: body.sportID,
          schoolID: body.schoolID
        }
      });

      // Add creator as coach
      await prisma.teamMembership.create({
        data: {
          userId: body.creatorId,
          teamId: newTeam.id,
          sportId: body.sportID,
          role: 'coach'
        }
      });

      reply.code(201).send({ success: true, team: newTeam });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to create team' });
    }
  });

  // POST /teams/:teamId/members – Add user to team
  fastify.post('/teams/:teamId/members', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    const body = request.body as {
      userId: string;
      role?: string;
    };

    try {
      if (!body.userId) {
        reply.code(400).send({ error: 'Missing required field: userId' });
        return;
      }

      // Check if team exists
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        reply.code(404).send({ error: 'Team not found' });
        return;
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: body.userId }
      });

      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }

      // Check if user is already a member
      const existingMembership = await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: body.userId,
            teamId
          }
        }
      });

      if (existingMembership) {
        reply.code(409).send({ error: 'User is already a member of this team' });
        return;
      }

      // Add user to team
      const membership = await prisma.teamMembership.create({
        data: {
          userId: body.userId,
          teamId,
          sportId: team.sportID,
          role: body.role || 'member'
        }
      });

      reply.code(201).send({ success: true, membership });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to add user to team' });
    }
  });

  // DELETE /teams/:teamId/members/:userId – Remove user from team
  fastify.delete('/teams/:teamId/members/:userId', async (request, reply) => {
    const { teamId, userId } = request.params as { teamId: string; userId: string };

    try {
      // Check if membership exists
      const membership = await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId
          }
        }
      });

      if (!membership) {
        reply.code(404).send({ error: 'Team membership not found' });
        return;
      }

      // Delete membership
      await prisma.teamMembership.delete({
        where: {
          userId_teamId: {
            userId,
            teamId
          }
        }
      });

      reply.send({ success: true, message: 'User removed from team' });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to remove user from team' });
    }
  });

  // PUT /teams/:teamId/members/:userId – Update user role in team
  fastify.put('/teams/:teamId/members/:userId', async (request, reply) => {
    const { teamId, userId } = request.params as { teamId: string; userId: string };
    const body = request.body as {
      role: string;
    };

    try {
      if (!body.role) {
        reply.code(400).send({ error: 'Missing required field: role' });
        return;
      }

      // Update membership role
      const updatedMembership = await prisma.teamMembership.update({
        where: {
          userId_teamId: {
            userId,
            teamId
          }
        },
        data: {
          role: body.role
        }
      });

      reply.send({ success: true, membership: updatedMembership });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to update user role' });
    }
  });
};

export default teamsRoutes; 