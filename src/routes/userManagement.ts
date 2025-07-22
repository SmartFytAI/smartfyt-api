import { FastifyPluginAsync } from 'fastify';

import prismaModule from '../../lib/prisma.js';
import { validateRequest, userIdParamSchema, createUserBodySchema, updateGoalsBodySchema } from '../plugins/validation.js';
import log from '../utils/logger.js';

const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const userManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/data – get user data
  fastify.get('/users/:userId/data', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get user data params');
              const user = await prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }

      // Transform the data to match the UserProps type
      const userData = {
        id: user.id,
        given_name: user.firstName,
        family_name: user.lastName,
        email: user.email,
        picture: user.profileImage,
        phone_number: user.phone_number || null,
      };

      reply.send(userData);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch user data', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch user data' });
    }
  });

  // POST /users – create a new user
  fastify.post('/users', async (request, reply) => {
    try {
      const body = validateRequest(createUserBodySchema, request.body, 'Create user body');

      // First, check if a user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        reply.code(409).send({ error: 'A user with this email already exists' });
        return;
      }

      // If no existing user, proceed with creation
      const newUser = await prisma.user.create({
        data: {
          id: body.id,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          profileImage: body.profileImage,
          username: body.username,
        },
      });

      // TODO: Assign daily quests to the new user (this could be handled by a webhook or separate service)

      log.info(`Created new user: ${body.id}`);
      reply.code(201).send({ success: true, user: newUser });
    } catch (err) {
      log.error('Failed to create user', err, { body: request.body });
      reply.code(500).send({ error: 'Failed to create user' });
    }
  });

  // GET /users/:userId/snapshot – get user snapshot data
  fastify.get('/users/:userId/snapshot', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      if (!userId) {
        reply.code(400).send({ error: 'User ID is required' });
        return;
      }

      const journals = await prisma.journal.findMany({
        where: {
          authorID: userId,
        },
        select: {
          sleepHours: true,
          activeHours: true,
          stress: true,
          screenTime: true,
          studyHours: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (journals.length === 0) {
        reply.code(404).send({ error: 'No journal entries found for user' });
        return;
      }

      const initialAverages = {
        sleepHours: 0,
        activeHours: 0,
        stress: 0,
        screenTime: 0,
        studyHours: 0,
      };

      const averages = journals.reduce((acc, journal) => {
        acc.sleepHours += journal.sleepHours ?? 0;
        acc.activeHours += journal.activeHours ?? 0;
        acc.stress += journal.stress ?? 0;
        acc.screenTime += journal.screenTime ?? 0;
        acc.studyHours += journal.studyHours ?? 0;
        return acc;
      }, initialAverages);

      Object.keys(averages).forEach((key) => {
        averages[key as keyof typeof averages] = +(averages[key as keyof typeof averages] / journals.length).toFixed(1);
      });

      const firstDay = journals[0];
      const lastDay = journals[journals.length - 1];

      const snapshotData = {
        averages,
        firstDay,
        lastDay,
      };

      log.info(`Fetched snapshot data for user: ${userId}`);
      reply.send(snapshotData);
    } catch (err) {
      log.error('Failed to fetch user snapshot', err, { userId });
      reply.code(500).send({ error: 'Failed to fetch user snapshot' });
    }
  });

  // GET /users/:userId/goals – get user goals
  fastify.get('/users/:userId/goals', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Get user goals params');

      const userForm = await prisma.userForm.findFirst({
        where: {
          authorID: params.userId,
        },
        select: {
          academicGoals: true,
          athleticGoals: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      if (!userForm) {
        reply.code(404).send({ error: 'No goals found for user' });
        return;
      }

      const goals = {
        academic: userForm.academicGoals,
        athletic: userForm.athleticGoals,
      };

      log.info(`Fetched goals for user: ${params.userId}`);
      reply.send(goals);
    } catch (err) {
      if (err instanceof Error && err.message.includes('validation failed')) {
        reply.code(400).send({ error: err.message });
        return;
      }
      log.error('Failed to fetch user goals', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to fetch user goals' });
    }
  });

  // PUT /users/:userId/goals – update user goals
  fastify.put('/users/:userId/goals', async (request, reply) => {
    try {
      const params = validateRequest(userIdParamSchema, request.params, 'Update user goals params');
      const body = validateRequest(updateGoalsBodySchema, request.body, 'Update user goals body');

      // Find the most recent userForm for the user
      const existingForm = await prisma.userForm.findFirst({
        where: { authorID: params.userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (existingForm) {
        await prisma.userForm.update({
          where: { id: existingForm.id },
          data:
            body.goalType === 'athletic'
              ? { athleticGoals: body.value, updatedAt: new Date() }
              : { academicGoals: body.value, updatedAt: new Date() },
        });
      } else {
        // If no form exists, create one (with empty string/default for all required fields)
        await prisma.userForm.create({
          data: {
            authorID: params.userId,
            athleticGoals: body.goalType === 'athletic' ? body.value : '',
            academicGoals: body.goalType === 'academic' ? body.value : '',
            title: Date.now().toString(),
            response: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            published: false,
            podcast: 'pending',
            // Required fields with defaults
            name: '',
            age: '',
            email: '',
            phone: '',
            sleepHours: 0,
            studyHours: 0,
            stress: 0,
            wearable: '',
            screenTime: 0,
            activeHours: 0,
            coachEmail: '',
            coachName: '',
            grade: 'placeholder',
          },
        });
      }

      reply.send({ success: true });
    } catch (err) {
      log.error('Failed to update user goals', err, { userId: request.params });
      reply.code(500).send({ error: 'Failed to update user goals' });
    }
  });

  // PUT /users/:userId/profile-image – update user profile image
  fastify.put('/users/:userId/profile-image', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = request.body as {
      imageUrl: string;
    };

    try {
      if (body.imageUrl === undefined) {
        reply.code(400).send({ error: 'imageUrl is required' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profileImage: body.imageUrl },
      });

      log.info(`Updated profile image for user: ${userId}`);
      reply.send({ success: true, profileImage: updatedUser.profileImage });
    } catch (err) {
      log.error('Failed to update profile image', err, { userId });
      reply.code(500).send({ error: 'Failed to update profile image' });
    }
  });

  // PUT /users/:userId/form-data – update user form data
  fastify.put('/users/:userId/form-data', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = request.body as {
      grade?: string;
      school?: string;
      sport?: string;
      age?: string;
      phone?: string;
      sleepHours?: number;
      studyHours?: number;
      activeHours?: number;
      stressLevel?: number;
      screenTime?: number;
      wearable?: string;
      coachName?: string;
      coachEmail?: string;
    };

    try {
      // Find existing user form
      const existingForm = await prisma.userForm.findFirst({
        where: { authorID: userId },
        include: { team: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (existingForm) {
        // Update existing form
        const updateData: any = {};

        if (body.grade !== undefined) updateData.grade = body.grade;
        if (body.age !== undefined) updateData.age = body.age;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.sleepHours !== undefined) updateData.sleepHours = body.sleepHours;
        if (body.studyHours !== undefined) updateData.studyHours = body.studyHours;
        if (body.activeHours !== undefined) updateData.activeHours = body.activeHours;
        if (body.stressLevel !== undefined) updateData.stress = body.stressLevel;
        if (body.screenTime !== undefined) updateData.screenTime = body.screenTime;
        if (body.wearable !== undefined) updateData.wearable = body.wearable;
        if (body.coachName !== undefined) updateData.coachName = body.coachName;
        if (body.coachEmail !== undefined) updateData.coachEmail = body.coachEmail;

        // Handle school and sport updates (these require team updates)
        if (body.school || body.sport) {
          let schoolId = body.school;
          let sportId = body.sport;

          // If only one is provided, get the other from existing form
          if (!schoolId && existingForm.team?.schoolID) {
            schoolId = existingForm.team.schoolID;
          }
          if (!sportId && existingForm.sportID) {
            sportId = existingForm.sportID;
          }

          if (schoolId && sportId) {
            // Find or create team
            let team = await prisma.team.findFirst({
              where: {
                schoolID: schoolId,
                sportID: sportId,
              },
            });

            if (!team) {
              const school = await prisma.school.findUnique({ where: { id: schoolId } });
              const sport = await prisma.sport.findUnique({ where: { id: sportId } });

              if (school && sport) {
                team = await prisma.team.create({
                  data: {
                    name: `${school.name} ${sport.name}`,
                    schoolID: schoolId,
                    sportID: sportId,
                  },
                });
              }
            }

            if (team) {
              updateData.teamID = team.id;
              updateData.sportID = sportId;
            }
          }
        }

        updateData.updatedAt = new Date();

        const updatedForm = await prisma.userForm.update({
          where: { id: existingForm.id },
          data: updateData,
        });

        log.info(`Updated form data for user: ${userId}`);
        reply.send({ success: true, formData: updatedForm });
      } else {
        // Create new form if none exists
        const formData: any = {
          authorID: userId,
          title: Date.now().toString(),
          response: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          published: false,
          podcast: 'pending',
          name: '',
          email: '',
          academicGoals: '',
          athleticGoals: '',
        };

        // Add provided fields
        if (body.grade !== undefined) formData.grade = body.grade;
        if (body.age !== undefined) formData.age = body.age;
        if (body.phone !== undefined) formData.phone = body.phone;
        if (body.sleepHours !== undefined) formData.sleepHours = body.sleepHours;
        if (body.studyHours !== undefined) formData.studyHours = body.studyHours;
        if (body.activeHours !== undefined) formData.activeHours = body.activeHours;
        if (body.stressLevel !== undefined) formData.stress = body.stressLevel;
        if (body.screenTime !== undefined) formData.screenTime = body.screenTime;
        if (body.wearable !== undefined) formData.wearable = body.wearable;
        if (body.coachName !== undefined) formData.coachName = body.coachName;
        if (body.coachEmail !== undefined) formData.coachEmail = body.coachEmail;

        // Handle school and sport
        if (body.school && body.sport) {
          let team = await prisma.team.findFirst({
            where: {
              schoolID: body.school,
              sportID: body.sport,
            },
          });

          if (!team) {
            const school = await prisma.school.findUnique({ where: { id: body.school } });
            const sport = await prisma.sport.findUnique({ where: { id: body.sport } });

            if (school && sport) {
              team = await prisma.team.create({
                data: {
                  name: `${school.name} ${sport.name}`,
                  schoolID: body.school,
                  sportID: body.sport,
                },
              });
            }
          }

          if (team) {
            formData.teamID = team.id;
            formData.sportID = body.sport;
          }
        }

        const newForm = await prisma.userForm.create({
          data: formData,
        });

        log.info(`Created new form data for user: ${userId}`);
        reply.send({ success: true, formData: newForm });
      }
    } catch (err) {
      log.error('Failed to update user form data', err, { userId });
      reply.code(500).send({ error: 'Failed to update user form data' });
    }
  });
};

export default userManagementRoutes;
