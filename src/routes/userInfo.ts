import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import log from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const userInfoRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/info', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const [dbUser, userForm] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            username: true,
          },
        }),
        prisma.userForm.findFirst({
          where: { authorID: userId },
          include: { team: true },
        }),
      ]);
      if (!dbUser) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      const payload = {
        ...dbUser,
        name: `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim(),
        age: userForm?.age ?? '',
        phoneNumber: userForm?.phone ?? '',
        school: userForm?.team?.schoolID ?? '',
        grade: userForm?.grade ?? '',
        sleepHours: userForm?.sleepHours ?? 0,
        studyHours: userForm?.studyHours ?? 0,
        activeHours: userForm?.activeHours ?? 0,
        stressLevel: userForm?.stress ?? 0,
        sport: userForm?.sportID ?? '',
        wearable: userForm?.wearable ?? '',
        screenTime: userForm?.screenTime ?? 0,
        athleticGoals: userForm?.athleticGoals ?? '',
        academicGoals: userForm?.academicGoals ?? '',
        coachName: userForm?.coachName ?? '',
        coachEmail: userForm?.coachEmail ?? '',
      };
      log.info(`Fetched user info for user: ${userId}`);
      reply.send(payload);
    } catch (err) {
      log.error('Failed to fetch user info', err, { userId });
      reply.code(500).send({ error: 'Failed to fetch user info' });
    }
  });
};

export default userInfoRoutes;
