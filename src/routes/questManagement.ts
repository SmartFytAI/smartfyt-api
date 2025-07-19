import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const questManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /users/:userId/quests/complete – complete a quest
  fastify.post('/users/:userId/quests/complete', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = request.body as {
      questId: string;
      notes?: string;
    };

    try {
      if (!body.questId) {
        reply.code(400).send({ error: 'questId is required' });
        return;
      }

      const notes = body.notes || '';
      if (notes.length > 280) {
        reply.code(400).send({ error: 'Notes must be 280 characters or less' });
        return;
      }

      // First check if the quest exists
      const questExists = await prisma.quest.findUnique({
        where: { id: body.questId },
      });

      if (!questExists) {
        reply.code(404).send({ error: 'Quest not found in database' });
        return;
      }

      // Find the user quest with assigned status
      const userQuest = await prisma.userQuest.findFirst({
        where: {
          userId: userId,
          questId: body.questId,
          status: 'assigned',
        },
        include: {
          quest: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!userQuest) {
        reply.code(404).send({ error: 'Quest not found or already completed' });
        return;
      }

      // Mark the quest as completed
      await prisma.userQuest.update({
        where: { id: userQuest.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          notes: notes,
        },
      });

      // Update or create user stats
      let userStat = await prisma.userStat.findFirst({
        where: {
          userId: userId,
          categoryId: userQuest.quest.categoryId,
        },
      });

      if (userStat) {
        // Update existing stat
        const newPoints = userStat.points + userQuest.quest.pointValue;
        const newLevel = Math.floor(newPoints / 100) + 1;

        userStat = await prisma.userStat.update({
          where: { id: userStat.id },
          data: {
            points: newPoints,
            level: newLevel,
          },
        });
      } else {
        // Create new stat
        userStat = await prisma.userStat.create({
          data: {
            userId: userId,
            categoryId: userQuest.quest.categoryId,
            points: userQuest.quest.pointValue,
            level: 1,
          },
        });
      }

      reply.send({
        success: true,
        message: 'Quest completed successfully',
        points: userQuest.quest.pointValue,
        newLevel: userStat.level,
        totalPoints: userStat.points,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to complete quest' });
    }
  });

  // POST /users/:userId/quests/assign – assign random quests
  fastify.post('/users/:userId/quests/assign', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      // 1. Clear existing assigned quests
      await prisma.userQuest.updateMany({
        where: {
          userId,
          status: 'assigned',
        },
        data: {
          status: 'expired',
        },
      });

      // 2. Get all categories from the database
      const categories = await prisma.questCategory.findMany();

      if (categories.length === 0) {
        reply.code(404).send({ error: 'No quest categories found in the database' });
        return;
      }

      // 3. Randomly select 3 categories
      const shuffledCategories = [...categories].sort(() => 0.5 - Math.random());
      const selectedCategories = shuffledCategories.slice(0, 3);

      // 4. For each selected category, find a random quest and assign it to the user
      const assignedQuestPromises = selectedCategories.map(async (category) => {
        // Find quests for this category that aren't already assigned to this user
        const availableQuests = await prisma.quest.findMany({
          where: {
            categoryId: category.id,
            userQuests: {
              none: {
                userId: userId,
                status: { in: ['assigned', 'completed'] },
              },
            },
          },
          take: 10, // Limit to 10 quests for performance
        });

        // If there are available quests, randomly select one
        if (availableQuests.length > 0) {
          const randomQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];

          // Assign the quest to the user
          await prisma.userQuest.create({
            data: {
              userId,
              questId: randomQuest.id,
              status: 'assigned',
            },
          });

          return true;
        } else {
          // If no available quests, try to find any quest from this category
          const anyQuest = await prisma.quest.findFirst({
            where: {
              categoryId: category.id,
            },
          });

          if (anyQuest) {
            // Assign the quest to the user
            await prisma.userQuest.create({
              data: {
                userId,
                questId: anyQuest.id,
                status: 'assigned',
              },
            });

            return true;
          }
          return false;
        }
      });

      // Wait for all assignments to complete
      await Promise.all(assignedQuestPromises);

      // 5. Return the newly assigned quests
      const userQuests = await prisma.userQuest.findMany({
        where: {
          userId: userId,
          status: 'assigned',
        },
        include: {
          quest: {
            include: {
              category: true,
            },
          },
        },
      });

      const quests = userQuests.map((userQuest) => ({
        id: userQuest.quest.id,
        title: userQuest.quest.title,
        description: userQuest.quest.description,
        pointValue: userQuest.quest.pointValue,
        categoryName: userQuest.quest.category.name,
      }));

      reply.send(quests);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to assign quests' });
    }
  });

  // GET /users/:userId/quests/completed – get completed quests
  fastify.get('/users/:userId/quests/completed', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    
    try {
      const completedQuests = await prisma.userQuest.findMany({
        where: {
          userId: userId,
          status: 'completed',
        },
        include: {
          quest: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      const quests = completedQuests.map((userQuest) => ({
        id: userQuest.quest.id,
        title: userQuest.quest.title,
        description: userQuest.quest.description,
        pointValue: userQuest.quest.pointValue,
        categoryName: userQuest.quest.category.name,
        completedAt: userQuest.completedAt,
        notes: userQuest.notes,
      }));

      reply.send(quests);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch completed quests' });
    }
  });

  // PUT /users/:userId/quests/:questId/notes – update completed quest notes
  fastify.put('/users/:userId/quests/:questId/notes', async (request, reply) => {
    const { userId, questId } = request.params as { userId: string; questId: string };
    const body = request.body as { notes: string };

    try {
      if (!body.notes) {
        reply.code(400).send({ error: 'Notes are required' });
        return;
      }

      if (body.notes.length > 280) {
        reply.code(400).send({ error: 'Notes must be 280 characters or less' });
        return;
      }

      const updatedQuest = await prisma.userQuest.updateMany({
        where: {
          userId: userId,
          questId: questId,
          status: 'completed',
        },
        data: {
          notes: body.notes,
        },
      });

      if (updatedQuest.count === 0) {
        reply.code(404).send({ error: 'Quest not found or not completed' });
        return;
      }

      reply.send({
        success: true,
        message: 'Quest notes updated successfully',
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to update quest notes' });
    }
  });

  // DELETE /users/:userId/quests/:questId – delete completed quest
  fastify.delete('/users/:userId/quests/:questId', async (request, reply) => {
    const { userId, questId } = request.params as { userId: string; questId: string };

    try {
      const deletedQuest = await prisma.userQuest.deleteMany({
        where: {
          userId: userId,
          questId: questId,
          status: 'completed',
        },
      });

      if (deletedQuest.count === 0) {
        reply.code(404).send({ error: 'Quest not found or not completed' });
        return;
      }

      reply.send({
        success: true,
        message: 'Completed quest deleted successfully',
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to delete completed quest' });
    }
  });

  // POST /users/:userId/performance-metrics – calculate and store performance metrics
  fastify.post('/users/:userId/performance-metrics', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // Look back 7 days

      const recentJournals = await prisma.journal.findMany({
        where: {
          authorID: userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          sleepHours: true,
          studyHours: true,
          activeHours: true,
          stress: true,
          screenTime: true,
        },
      });

      if (recentJournals.length === 0) {
        reply.code(400).send({ error: 'No recent journal entries found for the user within the last 7 days' });
        return;
      }

      const sumMetrics = recentJournals.reduce(
        (acc, journal) => {
          acc.studyHours += journal.studyHours ?? 0;
          acc.screenTime += journal.screenTime ?? 0;
          acc.activeHours += journal.activeHours ?? 0;
          acc.sleepHours += journal.sleepHours ?? 0;
          acc.stress += journal.stress ?? 0;
          return acc;
        },
        {
          studyHours: 0,
          screenTime: 0,
          activeHours: 0,
          sleepHours: 0,
          stress: 0,
        }
      );

      const numJournals = recentJournals.length;
      const metrics = {
        studyHours: sumMetrics.studyHours / numJournals,
        screenTime: sumMetrics.screenTime / numJournals,
        activeHours: sumMetrics.activeHours / numJournals,
        sleepHours: sumMetrics.sleepHours / numJournals,
        stress: sumMetrics.stress / numJournals,
      };

      // Simple score calculations (can be moved to utils later)
      const ensureValidScore = (score: number): number => {
        if (isNaN(score) || !isFinite(score)) {
          return 0;
        }
        return Math.round(Math.max(0, Math.min(score, 100)));
      };

      // Basic scoring formulas (simplified)
      const focusScore = ensureValidScore((metrics.studyHours / 8) * 100 - (metrics.screenTime / 10) * 20);
      const effortScore = ensureValidScore((metrics.activeHours / 2) * 100 + (metrics.studyHours / 8) * 50);
      const readinessScore = ensureValidScore((metrics.sleepHours / 8) * 100 - (metrics.stress / 10) * 30);
      const motivationScore = ensureValidScore(((10 - metrics.stress) / 10) * 100);
      const performanceScore = ensureValidScore((focusScore + effortScore + readinessScore + motivationScore) / 4);

      // Use today's date (ignoring time) for the upsert key
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Upsert the calculated metrics for the current day
      const storedMetrics = await prisma.userPerformanceMetrics.upsert({
        where: {
          userId_metricDate: {
            userId: userId,
            metricDate: today,
          },
        },
        update: {
          focusScore,
          effortScore,
          readinessScore,
          motivationScore,
          performanceScore,
          avgStudyHours: metrics.studyHours,
          avgScreenTime: metrics.screenTime,
          avgActiveHours: metrics.activeHours,
          avgSleepHours: metrics.sleepHours,
          avgStress: metrics.stress,
        },
        create: {
          userId: userId,
          metricDate: today,
          focusScore,
          effortScore,
          readinessScore,
          motivationScore,
          performanceScore,
          avgStudyHours: metrics.studyHours,
          avgScreenTime: metrics.screenTime,
          avgActiveHours: metrics.activeHours,
          avgSleepHours: metrics.sleepHours,
          avgStress: metrics.stress,
        },
      });

      reply.send(storedMetrics);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to calculate performance metrics' });
    }
  });
};

export default questManagementRoutes; 