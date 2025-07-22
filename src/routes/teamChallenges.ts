import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../lib/prisma.js';

/**
 * Team Challenges Gamification Routes
 */
const teamChallengesRoutes: FastifyPluginAsync = async (fastify) => {
  // ===== TEAM CHALLENGES =====

  // GET /teams/:teamId/challenges – Get team challenges
  fastify.get('/teams/:teamId/challenges', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    
    try {
      const challenges = await prisma.teamChallenge.findMany({
        where: { teamId, isActive: true },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      reply.send({ success: true, data: challenges });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch team challenges' });
    }
  });

  // POST /teams/:teamId/challenges – Create team challenge
  fastify.post('/teams/:teamId/challenges', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    const body = request.body as {
      title: string;
      description: string;
      type: 'step_competition' | 'workout' | 'habit' | 'skill' | 'team_building';
      duration: number;
      userIds: string[];
    };

    try {
      if (!body.title || !body.description || !body.type) {
        reply.code(400).send({ error: 'Title, description, and type are required' });
        return;
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + body.duration);

      // Create the challenge
      const challenge = await prisma.teamChallenge.create({
        data: {
          title: body.title,
          description: body.description,
          type: body.type,
          duration: body.duration,
          teamId,
          createdBy: body.userIds[0] || 'system',
          endDate,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      // Add participants
      if (body.userIds.length > 0) {
        const participants = body.userIds.map(userId => ({
          challengeId: challenge.id,
          userId,
          status: 'invited',
        }));

        await prisma.teamChallengeParticipant.createMany({
          data: participants,
        });
      }

      // Create notifications for team members (skip creator)
      const notificationPromises = body.userIds
        .filter(userId => userId !== challenge.createdBy) // Don't notify the creator
        .map(userId =>
          prisma.notification.create({
            data: {
              userId,
              message: `New team challenge: ${challenge.title}`,
              type: 'team_challenge',
              link: `/team-challenges?tab=challenges`,
              actorId: challenge.createdBy,
            },
          })
        );

      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }

      reply.code(201).send({ success: true, data: challenge });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to create team challenge' });
    }
  });

  // POST /teams/:teamId/challenges/:challengeId/join – Join team challenge
  fastify.post('/teams/:teamId/challenges/:challengeId/join', async (request, reply) => {
    const { teamId: _teamId, challengeId } = request.params as { teamId: string; challengeId: string };
    const body = request.body as {
      userId: string;
    };

    try {
      if (!body.userId) {
        reply.code(400).send({ error: 'userId is required' });
        return;
      }

      // Check if user is already a participant
      const existingParticipant = await prisma.teamChallengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId: body.userId,
          },
        },
      });

      if (existingParticipant) {
        reply.code(400).send({ error: 'User is already a participant in this challenge' });
        return;
      }

      // Add user as participant
      const participant = await prisma.teamChallengeParticipant.create({
        data: {
          challengeId,
          userId: body.userId,
          status: 'accepted',
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      reply.code(201).send({ success: true, data: participant });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to join team challenge' });
    }
  });

  // ===== TEAM RECOGNITION =====

  // GET /teams/:teamId/recognitions – Get team recognitions
  fastify.get('/teams/:teamId/recognitions', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    
    try {
      const recognitions = await prisma.teamRecognition.findMany({
        where: { teamId },
        include: {
          fromUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          toUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          interactions: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      reply.send({ success: true, data: recognitions });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch team recognitions' });
    }
  });

  // POST /teams/:teamId/recognitions – Give recognition
  fastify.post('/teams/:teamId/recognitions', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };
    const body = request.body as {
      fromUserId: string;
      toUserId: string;
      type: 'clap' | 'fire' | 'heart' | 'flex' | 'zap' | 'trophy';
      message?: string;
    };

    try {
      if (!body.fromUserId || !body.toUserId || !body.type) {
        reply.code(400).send({ error: 'fromUserId, toUserId, and type are required' });
        return;
      }

      // Check if user has reached their daily limit for this type
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userLimit = await prisma.userRecognitionLimit.findUnique({
        where: {
          userId_date: {
            userId: body.fromUserId,
            date: today,
          },
        },
      });

      const limitField = `${body.type}sUsed` as keyof typeof userLimit;
      const currentCount = userLimit ? (userLimit[limitField] as number) : 0;
      const maxLimit = 5; // Daily limit per type

      if (currentCount >= maxLimit) {
        reply.code(400).send({ error: `Daily limit for ${body.type} recognitions reached` });
        return;
      }

      // Create the recognition
      const recognition = await prisma.teamRecognition.create({
        data: {
          fromUserId: body.fromUserId,
          toUserId: body.toUserId,
          teamId,
          type: body.type,
          message: body.message,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          toUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      // Update or create user limit
      await prisma.userRecognitionLimit.upsert({
        where: {
          userId_date: {
            userId: body.fromUserId,
            date: today,
          },
        },
        update: {
          [limitField]: currentCount + 1,
        },
        create: {
          userId: body.fromUserId,
          date: today,
          [limitField]: 1,
        },
      });

      // Create notification for recipient
      await prisma.notification.create({
        data: {
          userId: body.toUserId,
          message: `${recognition.fromUser.firstName} gave you a ${body.type}!`,
          type: 'recognition',
          link: `/team-challenges?tab=recognition`,
          actorId: body.fromUserId,
        },
      });

      reply.code(201).send({ success: true, data: recognition });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to give recognition' });
    }
  });

  // GET /users/:userId/recognition-limits – Get user's recognition limits
  fastify.get('/users/:userId/recognition-limits', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const limits = await prisma.userRecognitionLimit.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      // Return default limits if none exist
      const defaultLimits = {
        clapsUsed: 0,
        firesUsed: 0,
        heartsUsed: 0,
        flexesUsed: 0,
        zapsUsed: 0,
        trophiesUsed: 0,
      };

      reply.send({ success: true, data: limits || defaultLimits });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch recognition limits' });
    }
  });

  // ===== MOCK DATA ENDPOINTS FOR DEVELOPMENT =====

  // POST /mock/team-challenges/seed – Seed mock data
  fastify.post('/mock/team-challenges/seed', async (request, reply) => {
    try {
      // Create mock challenges
      const _mockChallenges = [
        {
          title: 'Step Competition',
          description: 'Who can get the most steps this week?',
          type: 'step_competition',
          duration: 7,
        },
        {
          title: 'Workout Warriors',
          description: 'Complete 3 workouts this week',
          type: 'workout',
          duration: 7,
        },
      ];

      // Create mock recognitions
      const _mockRecognitions = [
        {
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'clap',
          message: 'Great job on the workout today!',
        },
        {
          fromUserId: 'user2',
          toUserId: 'user3',
          type: 'fire',
          message: 'You crushed that challenge!',
        },
        {
          fromUserId: 'user3',
          toUserId: 'user1',
          type: 'heart',
          message: 'Thanks for being such a great teammate!',
        },
      ];

      reply.send({ 
        success: true, 
        message: 'Mock data structure defined. Use actual team IDs and user IDs for real data.' 
      });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to seed mock data' });
    }
  });
};

export default teamChallengesRoutes; 