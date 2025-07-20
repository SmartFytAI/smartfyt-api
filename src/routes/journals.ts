import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const journalsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/journals – list journals
  fastify.get('/users/:userId/journals', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const journals = await prisma.journal.findMany({
        where: { authorID: userId },
        select: {
          id: true,
          title: true,
          sleepHours: true,
          studyHours: true,
          activeHours: true,
          stress: true,
          wentWell: true,
          notWell: true,
          goals: true,
          screenTime: true,
          createdAt: true,
          updatedAt: true,
          response: true,
          authorID: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      reply.send(journals);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch journals' });
    }
  });

  // GET /users/:userId/journals/dates – return array of createdAt dates asc
  fastify.get('/users/:userId/journals/dates', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const entries = await prisma.journal.findMany({
        where: { authorID: userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      reply.send(entries.map((e) => e.createdAt));
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch journal dates' });
    }
  });

  // POST /journals – create a new journal entry
  fastify.post('/journals', async (request, reply) => {
    try {
      const body = request.body as {
        userId: string;
        title: string;
        wentWell?: string;
        notWell?: string;
        goals?: string;
        sleepHours?: number;
        activeHours?: number;
        stress?: number;
        screenTime?: number;
        studyHours?: number;
        createdAt?: string; // Optional ISO date string for custom date
      };

      if (!body?.userId || !body?.title) {
        reply.code(400).send({ error: 'userId and title are required' });
        return;
      }

      // Parse custom date if provided, otherwise use current time
      const journalDate = body.createdAt ? new Date(body.createdAt) : new Date();
      
      const newJournal = await prisma.journal.create({
        data: {
          title: body.title,
          wentWell: body.wentWell ?? '',
          notWell: body.notWell ?? '',
          goals: body.goals ?? '',
          authorID: body.userId,
          sleepHours: body.sleepHours ?? 0,
          activeHours: body.activeHours ?? 0,
          stress: body.stress ?? 0,
          screenTime: body.screenTime ?? 0,
          studyHours: body.studyHours ?? 0,
          createdAt: journalDate,
        },
      });

      reply.code(201).send(newJournal);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to create journal' });
    }
  });
};

export default journalsRoutes; 