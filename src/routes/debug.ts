import { FastifyPluginAsync } from 'fastify';

// ESM↔CJS interop
import prismaModule from '../../lib/prisma.js';
import log from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

/**
 * Debug and testing routes
 */
const debugRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /debug/s3-test – Test S3 connectivity
  fastify.get('/debug/s3-test', async (request, reply) => {
    try {
      // Test database connectivity
      const userCount = await prisma.user.count();
      const teamCount = await prisma.team.count();
      const journalCount = await prisma.journal.count();

      log.info('Debug test successful', { userCount, teamCount, journalCount });
      reply.send({
        success: true,
        message: 'Debug test successful',
        data: {
          userCount,
          teamCount,
          journalCount,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
      });
    } catch (err) {
      log.error('Debug test failed', err);
      reply.code(500).send({
        success: false,
        error: 'Debug test failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  });

  // GET /debug/stats – Get system statistics
  fastify.get('/debug/stats', async (request, reply) => {
    try {
      const stats = await Promise.all([
        prisma.user.count(),
        prisma.team.count(),
        prisma.journal.count(),
        prisma.quest.count(),
        prisma.teamMembership.count(),
        prisma.contactInquiry.count(),
      ]);

      log.info('Debug stats retrieved', {
        users: stats[0],
        teams: stats[1],
        journals: stats[2],
        quests: stats[3],
        teamMemberships: stats[4],
        contactInquiries: stats[5],
      });

      reply.send({
        success: true,
        stats: {
          users: stats[0],
          teams: stats[1],
          journals: stats[2],
          quests: stats[3],
          teamMemberships: stats[4],
          contactInquiries: stats[5],
        },
      });
    } catch (err) {
      log.error('Failed to get debug stats', err);
      reply.code(500).send({ error: 'Failed to get stats' });
    }
  });
};

export default debugRoutes;
