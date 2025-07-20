import { FastifyPluginAsync } from 'fastify';
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const journalsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/journals – list journals
  fastify.get('/users/:userId/journals', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = '10', offset = '0' } = request.query as { limit?: string; offset?: string };
    
    try {
      const limitNumber = parseInt(limit, 10) || 10;
      const offsetNumber = parseInt(offset, 10) || 0;

      // Get total count for pagination metadata
      const totalCount = await prisma.journal.count({
        where: { authorID: userId },
      });

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
        take: limitNumber,
        skip: offsetNumber,
      });

      reply.send({
        journals,
        pagination: {
          total: totalCount,
          limit: limitNumber,
          offset: offsetNumber,
          hasMore: offsetNumber + limitNumber < totalCount,
        },
      });
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
      
      // Convert to consistent YYYY-MM-DD format
      const dates = entries.map((e) => {
        const date = new Date(e.createdAt);
        return date.toISOString().split('T')[0];
      });
      
      fastify.log.info('📅 Journal dates returned:', {
        userId,
        count: dates.length,
        sampleDates: dates.slice(0, 3), // Log first 3 dates for debugging
        rawSampleDates: entries.slice(0, 3).map(e => e.createdAt), // Log raw dates too
      });
      
      reply.send(dates);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch journal dates' });
    }
  });

  // GET /users/:userId/journals/date/:date – get journal for specific date
  fastify.get('/users/:userId/journals/date/:date', async (request, reply) => {
    const { userId, date } = request.params as { userId: string; date: string };
    
    try {
      // Flexible date parsing - handle multiple formats
      let targetDate: Date;
      
      // Try different date formats
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        targetDate = new Date(date + 'T00:00:00.000Z');
      } else if (date.match(/^\d{4}-\d{2}-\d{2}T/)) {
        // ISO format with time
        targetDate = new Date(date);
      } else {
        // Try parsing as any valid date format
        targetDate = new Date(date);
      }
      
      // Validate the parsed date
      if (isNaN(targetDate.getTime())) {
        fastify.log.warn('❌ Invalid date format received:', { date, userId });
        reply.code(400).send({ error: 'Invalid date format. Expected YYYY-MM-DD' });
        return;
      }

      // Create date range for the entire day
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      fastify.log.info('🔍 Searching for journal:', {
        userId,
        originalDate: date,
        parsedDate: targetDate.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
      });

      const journal = await prisma.journal.findFirst({
        where: {
          authorID: userId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
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

      if (!journal) {
        fastify.log.warn('❌ Journal not found for date:', { 
          userId, 
          originalDate: date,
          parsedDate: targetDate.toISOString(),
          startOfDay: startOfDay.toISOString(),
          endOfDay: endOfDay.toISOString()
        });
        reply.code(404).send({ error: 'Journal not found for this date' });
        return;
      }

      fastify.log.info('✅ Journal found for date:', {
        userId,
        originalDate: date,
        parsedDate: targetDate.toISOString(),
        journalId: journal.id,
        journalCreatedAt: journal.createdAt,
      });

      reply.send(journal);
    } catch (err) {
      fastify.log.error('❌ Error in date endpoint:', { err, userId, date });
      reply.code(500).send({ error: 'Failed to fetch journal for date' });
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