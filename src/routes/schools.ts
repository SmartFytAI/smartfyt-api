import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error ESM↔CJS interop for prisma singleton
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

/**
 * GET /schools  – Returns id + name for every school, alphabetically.
 */
const schoolsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/schools', async (_req, reply) => {
    try {
      const schools = await prisma.school.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      reply.send(schools);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch schools' });
    }
  });
};

export default schoolsRoutes; 