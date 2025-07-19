import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const terraRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/terra/connection – get Terra connection status
  fastify.get('/users/:userId/terra/connection', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { terraConnected: true, terraProvider: true },
      });

      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }

      reply.send({
        isConnected: user.terraConnected,
        provider: user.terraProvider,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch Terra connection status' });
    }
  });

  // PUT /users/:userId/terra/connection – update Terra connection status
  fastify.put('/users/:userId/terra/connection', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = request.body as { isConnected: boolean; provider?: string };

    try {
      if (typeof body.isConnected !== 'boolean') {
        reply.code(400).send({ error: 'isConnected must be a boolean' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          terraConnected: body.isConnected,
          terraProvider: body.provider || null,
        },
        select: { terraConnected: true, terraProvider: true },
      });

      reply.send({
        isConnected: updatedUser.terraConnected,
        provider: updatedUser.terraProvider,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to update Terra connection status' });
    }
  });
};

export default terraRoutes; 