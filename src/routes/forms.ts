import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const formsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/forms – return user form entries
  fastify.get('/users/:userId/forms', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get user forms params');

      const userForms = await prisma.userForm.findMany({
        where: { authorID: params.userId },
        include: {
          sport: {
            select: { id: true, name: true },
          },
          team: {
            select: { id: true, name: true, sportID: true, schoolID: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formattedForms = userForms.map((form) => ({
        id: form.id,
        title: form.title,
        name: form.name,
        age: form.age,
        email: form.email,
        phone: form.phone,
        sleepHours: form.sleepHours,
        studyHours: form.studyHours,
        activeHours: form.activeHours,
        stress: form.stress,
        sport: form.sport,
        wearable: form.wearable,
        screenTime: form.screenTime,
        athleticGoals: form.athleticGoals,
        academicGoals: form.academicGoals,
        podcast: form.podcast,
        response: form.response,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        team: form.team,
        teamID: form.teamID,
        grade: form.grade,
      }));

      log.info(`Fetched ${formattedForms.length} forms for user: ${params.userId}`);
      reply.send(formattedForms);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch user forms', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch user forms' });
    }
  });
};

export default formsRoutes;
