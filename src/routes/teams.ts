import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error ESM↔CJS interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

/**
 * GET /users/:userId/teams – Returns teams a user belongs to.
 */
const teamsRoutes: FastifyPluginAsync = async (fastify) => {
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
};

export default teamsRoutes; 