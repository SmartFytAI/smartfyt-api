import { PrismaClient } from '@prisma/client';
import { FastifyPluginAsync } from 'fastify';

import { validateRequest, challengeIdWithTeamIdSchema, challengeProgressUpdateBodySchema } from '../plugins/validation.js';
import log from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Challenge Progress routes
 */
const challengeProgressRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /teams/:teamId/challenges/:challengeId/progress – Update challenge progress
  fastify.post('/teams/:teamId/challenges/:challengeId/progress', async (request, reply) => {
    try {
      const params = validateRequest(challengeIdWithTeamIdSchema, request.params, 'Update challenge progress params');
      const body = validateRequest(challengeProgressUpdateBodySchema, request.body, 'Update challenge progress body');

      // Verify the challenge exists and user is a participant
      const participant = await prisma.teamChallengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId: params.challengeId,
            userId: body.userId,
          },
        },
        include: {
          challenge: true,
        },
      });

      if (!participant) {
        reply.code(404).send({
          success: false,
          error: 'Challenge participant not found',
        });
        return;
      }

      if (participant.challenge.teamId !== params.teamId) {
        reply.code(403).send({
          success: false,
          error: 'Challenge does not belong to the specified team',
        });
        return;
      }

      // Update participant progress
      const updatedParticipant = await prisma.teamChallengeParticipant.update({
        where: {
          challengeId_userId: {
            challengeId: params.challengeId,
            userId: body.userId,
          },
        },
        data: {
          progress: body.progress,
          score: body.progress, // For now, progress equals score
          lastUpdated: new Date(),
        },
      });

      // Create progress history entry
      const progressEntry = await prisma.challengeProgress.create({
        data: {
          challengeId: params.challengeId,
          userId: body.userId,
          progress: body.progress,
          notes: body.notes,
        },
      });

      // Check for milestones
      const milestones = await prisma.challengeMilestone.findMany({
        where: {
          challengeId: params.challengeId,
          achievedAt: null, // Not yet achieved
        },
        orderBy: {
          targetValue: 'asc',
        },
      });

      const achievedMilestones = [];
      for (const milestone of milestones) {
        if (body.progress >= milestone.targetValue) {
          const achievedMilestone = await prisma.challengeMilestone.update({
            where: { id: milestone.id },
            data: {
              achievedAt: new Date(),
              achievedBy: body.userId,
            },
          });
          achievedMilestones.push(achievedMilestone);
        }
      }

      log.info(`Updated challenge progress for user: ${body.userId}`, {
        challengeId: params.challengeId,
        teamId: params.teamId,
        progress: body.progress,
        milestonesAchieved: achievedMilestones.length,
      });

      reply.send({
        success: true,
        message: 'Progress updated successfully',
        data: {
          participant: updatedParticipant,
          progressEntry,
          achievedMilestones,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to update challenge progress', err, {
        teamId: request.params,
        challengeId: request.params,
        userId: request.body
      });
      reply.code(500).send({
        success: false,
        error: 'Failed to update challenge progress',
      });
    }
  });

  // GET /teams/:teamId/challenges/:challengeId/leaderboard – Get challenge leaderboard
  fastify.get('/teams/:teamId/challenges/:challengeId/leaderboard', async (request, reply) => {
    try {
      const { teamId, challengeId } = request.params as { teamId: string; challengeId: string };

      // Verify the challenge exists and belongs to the team
      const challenge = await prisma.teamChallenge.findFirst({
        where: {
          id: challengeId,
          teamId,
        },
      });

      if (!challenge) {
        reply.code(404).send({
          success: false,
          error: 'Challenge not found',
        });
        return;
      }

      // Get participants with their progress, ordered by score
      const participants = await prisma.teamChallengeParticipant.findMany({
        where: {
          challengeId,
          status: {
            in: ['accepted', 'completed'],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { score: 'desc' },
          { lastUpdated: 'asc' },
        ],
      });

      reply.send({
        success: true,
        data: {
          challenge,
          leaderboard: participants,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch challenge leaderboard',
      });
    }
  });

  // GET /teams/:teamId/challenges/:challengeId/progress – Get challenge progress history
  fastify.get('/teams/:teamId/challenges/:challengeId/progress', async (request, reply) => {
    try {
      const { teamId, challengeId } = request.params as { teamId: string; challengeId: string };
      const { userId } = request.query as { userId?: string };

      // Verify the challenge exists and belongs to the team
      const challenge = await prisma.teamChallenge.findFirst({
        where: {
          id: challengeId,
          teamId,
        },
      });

      if (!challenge) {
        reply.code(404).send({
          success: false,
          error: 'Challenge not found',
        });
        return;
      }

      const where: any = { challengeId };
      if (userId) {
        where.userId = userId;
      }

      const progressHistory = await prisma.challengeProgress.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      reply.send({
        success: true,
        data: progressHistory,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch challenge progress',
      });
    }
  });

  // POST /teams/:teamId/challenges/:challengeId/milestones – Create milestone
  fastify.post('/teams/:teamId/challenges/:challengeId/milestones', async (request, reply) => {
    try {
      const { teamId, challengeId } = request.params as { teamId: string; challengeId: string };
      const body = request.body as {
        title: string;
        description?: string;
        targetValue: number;
        createdBy: string;
      };

      if (!body.title || body.targetValue === undefined || !body.createdBy) {
        reply.code(400).send({
          success: false,
          error: 'title, targetValue, and createdBy are required',
        });
        return;
      }

      // Verify the challenge exists and belongs to the team
      const challenge = await prisma.teamChallenge.findFirst({
        where: {
          id: challengeId,
          teamId,
        },
      });

      if (!challenge) {
        reply.code(404).send({
          success: false,
          error: 'Challenge not found',
        });
        return;
      }

      const milestone = await prisma.challengeMilestone.create({
        data: {
          challengeId,
          title: body.title,
          description: body.description,
          targetValue: body.targetValue,
        },
      });

      reply.code(201).send({
        success: true,
        data: milestone,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Failed to create milestone',
      });
    }
  });

  // GET /teams/:teamId/challenges/:challengeId/milestones – Get challenge milestones
  fastify.get('/teams/:teamId/challenges/:challengeId/milestones', async (request, reply) => {
    try {
      const { teamId, challengeId } = request.params as { teamId: string; challengeId: string };

      // Verify the challenge exists and belongs to the team
      const challenge = await prisma.teamChallenge.findFirst({
        where: {
          id: challengeId,
          teamId,
        },
      });

      if (!challenge) {
        reply.code(404).send({
          success: false,
          error: 'Challenge not found',
        });
        return;
      }

      const milestones = await prisma.challengeMilestone.findMany({
        where: { challengeId },
        include: {
          achiever: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          targetValue: 'asc',
        },
      });

      reply.send({
        success: true,
        data: milestones,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch milestones',
      });
    }
  });
};

export default challengeProgressRoutes;
