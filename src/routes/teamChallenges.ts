import { FastifyPluginAsync } from 'fastify';

import { prisma } from '../../lib/prisma.js';
import { validateRequest, teamIdParamSchema, createTeamChallengeBodySchema, joinChallengeBodySchema, teamRecognitionBodySchema, recognitionInteractionBodySchema, challengeIdWithTeamIdSchema, userIdParamSchema } from '../plugins/validation.js';
import { log } from '../utils/logger.js';

/**
 * Team Challenges Gamification Routes
 */
const teamChallengesRoutes: FastifyPluginAsync = async (fastify) => {
  // ===== TEAM CHALLENGES =====

  // GET /teams/:teamId/challenges – Get team challenges
  fastify.get('/teams/:teamId/challenges', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Get team challenges params');
      const challenges = await prisma.teamChallenge.findMany({
        where: { teamId: params.teamId, isActive: true },
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
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch team challenges', err, { teamId: request.params });
      reply.code(500).send({ error: 'Failed to fetch team challenges' });
    }
  });

  // POST /teams/:teamId/challenges – Create team challenge
  fastify.post('/teams/:teamId/challenges', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Create team challenge params');
      const body = validateRequest(createTeamChallengeBodySchema, request.body, 'Create team challenge body');

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + body.duration);

      // Create the challenge
      const challenge = await prisma.teamChallenge.create({
        data: {
          title: body.title,
          description: body.description,
          type: body.type,
          duration: body.duration,
          teamId: params.teamId,
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
      log.error('Failed to create team challenge', err, { teamId: request.params, body: request.body });
      reply.code(500).send({ error: 'Failed to create team challenge' });
    }
  });

  // POST /teams/:teamId/challenges/:challengeId/join – Join team challenge
  fastify.post('/teams/:teamId/challenges/:challengeId/join', async (request, reply) => {
    try {
      const params = validateRequest(challengeIdWithTeamIdSchema, request.params, 'Join team challenge params');
      const body = validateRequest(joinChallengeBodySchema, request.body, 'Join team challenge body');

      // Check if user is already a participant
      const existingParticipant = await prisma.teamChallengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId: params.challengeId,
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
          challengeId: params.challengeId,
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
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to join team challenge', err, { teamId: request.params, body: request.body });
      reply.code(500).send({ error: 'Failed to join team challenge' });
    }
  });

  // ===== TEAM RECOGNITION =====

  // GET /teams/:teamId/recognitions – Get team recognitions
  fastify.get('/teams/:teamId/recognitions', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Get team recognitions params');
      const recognitions = await prisma.teamRecognition.findMany({
        where: { teamId: params.teamId },
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
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      reply.send({ success: true, data: recognitions });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch team recognitions' });
    }
  });

  // POST /teams/:teamId/recognitions – Give recognition
  fastify.post('/teams/:teamId/recognitions', async (request, reply) => {
    try {
      const params = validateRequest(teamIdParamSchema, request.params, 'Create team recognition params');
      const body = validateRequest(teamRecognitionBodySchema, request.body, 'Create team recognition body');

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
          teamId: params.teamId,
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
          type: 'team_recognition',
          link: `/team-challenges?tab=recognition`,
          actorId: body.fromUserId,
        },
      });

      reply.code(201).send({ success: true, data: recognition });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to give recognition', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to give recognition' });
    }
  });

  // GET /users/:userId/recognition-limits – Get user's recognition limits
  fastify.get('/users/:userId/recognition-limits', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get recognition limits params');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const limits = await prisma.userRecognitionLimit.findUnique({
        where: {
          userId_date: {
            userId: params.userId,
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
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch recognition limits' });
    }
  });

  // ===== RECOGNITION INTERACTIONS =====

  // GET /recognitions/:recognitionId/interactions – Get interactions for a recognition
  fastify.get('/recognitions/:recognitionId/interactions', async (request, reply) => {
    try {
      const { recognitionId } = request.params as { recognitionId: string };

      const interactions = await prisma.recognitionInteraction.findMany({
        where: {
          recognitionId,
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      reply.send({ success: true, data: interactions });
    } catch (err) {
      log.error('Failed to fetch recognition interactions', err);
      reply.code(500).send({ error: 'Failed to fetch recognition interactions' });
    }
  });

  // POST /recognitions/:recognitionId/interactions – Add interaction to a recognition
  fastify.post('/recognitions/:recognitionId/interactions', async (request, reply) => {
    try {
      const { recognitionId } = request.params as { recognitionId: string };
      const body = validateRequest(recognitionInteractionBodySchema, request.body, 'Create recognition interaction body');

      // Verify the recognition exists
      const recognition = await prisma.teamRecognition.findUnique({
        where: { id: recognitionId },
      });

      if (!recognition) {
        reply.code(404).send({ error: 'Recognition not found' });
        return;
      }

      // Check if user already has this interaction type for this recognition
      const existingInteraction = await prisma.recognitionInteraction.findUnique({
        where: {
          recognitionId_userId_interactionType: {
            recognitionId,
            userId: body.userId,
            interactionType: body.interactionType,
          },
        },
      });

      if (existingInteraction) {
        reply.code(400).send({ error: `User already has ${body.interactionType} interaction for this recognition` });
        return;
      }

      // Create the interaction
      const interaction = await prisma.recognitionInteraction.create({
        data: {
          id: crypto.randomUUID(),
          recognitionId,
          userId: body.userId,
          interactionType: body.interactionType,
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

      reply.code(201).send({ success: true, data: interaction });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to create recognition interaction', err);
      reply.code(500).send({ error: 'Failed to create recognition interaction' });
    }
  });

  // DELETE /recognitions/:recognitionId/interactions/:userId/:interactionType – Remove interaction
  fastify.delete('/recognitions/:recognitionId/interactions/:userId/:interactionType', async (request, reply) => {
    try {
      const { recognitionId, userId, interactionType } = request.params as {
        recognitionId: string;
        userId: string;
        interactionType: string;
      };

      // Validate interaction type
      if (!['like', 'comment', 'share'].includes(interactionType)) {
        reply.code(400).send({ error: 'Invalid interaction type' });
        return;
      }

      const interaction = await prisma.recognitionInteraction.findUnique({
        where: {
          recognitionId_userId_interactionType: {
            recognitionId,
            userId,
            interactionType: interactionType as 'like' | 'comment' | 'share',
          },
        },
      });

      if (!interaction) {
        reply.code(404).send({ error: 'Interaction not found' });
        return;
      }

      await prisma.recognitionInteraction.delete({
        where: {
          recognitionId_userId_interactionType: {
            recognitionId,
            userId,
            interactionType: interactionType as 'like' | 'comment' | 'share',
          },
        },
      });

      reply.send({ success: true, message: 'Interaction removed successfully' });
    } catch (err) {
      log.error('Failed to remove recognition interaction', err);
      reply.code(500).send({ error: 'Failed to remove recognition interaction' });
    }
  });

  // ===== MOCK DATA ENDPOINTS FOR DEVELOPMENT =====

  // POST /mock/team-challenges/seed – Seed mock data
  fastify.post('/mock/team-challenges/seed', async (request, reply) => {
    try {
      // Mock data structure for development reference
      const mockDataStructure = {
        challenges: [
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
        ],
        recognitions: [
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
        ],
      };

      reply.send({
        success: true,
        message: 'Mock data structure defined. Use actual team IDs and user IDs for real data.',
        structure: mockDataStructure
      });
    } catch (err) {
      log.error('Failed to seed mock data', err);
      reply.code(500).send({ error: 'Failed to seed mock data' });
    }
  });
};

export default teamChallengesRoutes;
