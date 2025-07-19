import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const formsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/forms – return user form entries
  fastify.get('/users/:userId/forms', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const userForms = await prisma.userForm.findMany({
        where: { authorID: userId },
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

      reply.send(formattedForms);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch user forms' });
    }
  });
};

export default formsRoutes; 