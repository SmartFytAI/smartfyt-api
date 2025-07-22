import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema, terraConnectionUpdateBodySchema } from '../plugins/validation.js';
import log from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const terraRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/terra/connection – get Terra connection status
  fastify.get('/users/:userId/terra/connection', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get Terra connection params');

      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { terraConnected: true, terraProvider: true },
      });

      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }

      log.info(`Fetched Terra connection status for user: ${params.userId}`, {
        isConnected: user.terraConnected,
        provider: user.terraProvider
      });

      reply.send({
        isConnected: user.terraConnected,
        provider: user.terraProvider,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch Terra connection status', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch Terra connection status' });
    }
  });

  // PUT /users/:userId/terra/connection – update Terra connection status
  fastify.put('/users/:userId/terra/connection', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Update Terra connection params');
      const body = validateRequest(terraConnectionUpdateBodySchema, request.body, 'Update Terra connection body');

      const updatedUser = await prisma.user.update({
        where: { id: params.userId },
        data: {
          terraConnected: body.isConnected,
          terraProvider: body.provider || null,
        },
        select: { terraConnected: true, terraProvider: true },
      });

      log.info(`Updated Terra connection status for user: ${params.userId}`, {
        isConnected: updatedUser.terraConnected,
        provider: updatedUser.terraProvider
      });

      reply.send({
        isConnected: updatedUser.terraConnected,
        provider: updatedUser.terraProvider,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to update Terra connection status', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to update Terra connection status' });
    }
  });
};

export default terraRoutes;
