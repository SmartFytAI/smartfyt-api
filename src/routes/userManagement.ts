import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

const userManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users/:userId/data – get user data
  fastify.get('/users/:userId/data', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch user data' });
    }
  });

  // POST /users – create a new user
  fastify.post('/users', async (request, reply) => {
    const body = request.body as {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      profileImage: string;
      username: string;
    };

    try {
      if (!body.id || !body.email || !body.firstName || !body.lastName) {
        reply.code(400).send({ error: 'Missing required fields: id, email, firstName, lastName' });
        return;
      }

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

      reply.code(201).send({ success: true, user: newUser });
    } catch (err) {
      fastify.log.error(err);
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

      reply.send(snapshotData);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch user snapshot' });
    }
  });

  // GET /users/:userId/goals – get user goals
  fastify.get('/users/:userId/goals', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const userForm = await prisma.userForm.findFirst({
        where: {
          authorID: userId,
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

      reply.send(goals);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch user goals' });
    }
  });

  // PUT /users/:userId/goals – update user goals
  fastify.put('/users/:userId/goals', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = request.body as {
      goalType: 'athletic' | 'academic';
      value: string;
    };

    try {
      if (!body.goalType || !body.value) {
        reply.code(400).send({ error: 'goalType and value are required' });
        return;
      }

      if (!['athletic', 'academic'].includes(body.goalType)) {
        reply.code(400).send({ error: 'goalType must be either "athletic" or "academic"' });
        return;
      }

      // Find the most recent userForm for the user
      const existingForm = await prisma.userForm.findFirst({
        where: { authorID: userId },
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
            authorID: userId,
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
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to update user goals' });
    }
  });
};

export default userManagementRoutes; 