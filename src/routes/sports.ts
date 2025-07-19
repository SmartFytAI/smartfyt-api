import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error -- CJS->ESM interop
import prismaModule from '../../lib/prisma.js';
import log from '../utils/logger.js';

const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

/**
 * GET /sports
 * Returns the list of sports sorted alphabetically.
 */
const sportsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/sports', async (request, reply) => {
    const startTime = Date.now();
    
    try {
      log.database.query('findMany', 'sport');
      
      const sports = await prisma.sport.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      
      const duration = Date.now() - startTime;
      log.request.complete('GET', '/sports', 200, duration, { 
        sportsCount: sports.length,
        userId: request.user?.id 
      });
      
      reply.send(sports);
    } catch (error) {
      const duration = Date.now() - startTime;
      log.database.error('findMany', 'sport', error as Error, { 
        userId: request.user?.id 
      });
      log.request.error('GET', '/sports', error as Error, { 
        duration,
        userId: request.user?.id 
      });
      
      reply.code(500).send({ error: 'Failed to fetch sports' });
    }
  });
};

export default sportsRoutes; 