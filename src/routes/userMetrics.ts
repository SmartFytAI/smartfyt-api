import { FastifyPluginAsync } from 'fastify';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error prisma interop
import prismaModule from '../../lib/prisma.js';
const { prisma } = prismaModule as { prisma: typeof import('../../lib/prisma.js').prisma };

function parseHourRange(range: string | number | null): number {
  if (range === null || range === undefined) return 0;
  if (typeof range === 'number') return isNaN(range) ? 0 : range;
  if (range.includes('More than')) {
    const hours = Number.parseInt(range.match(/\d+/)?.[0] || '0');
    return hours + 1;
  }
  const numbers = range.match(/\d+/g);
  if (!numbers) return 0;
  if (numbers.length === 2) {
    return (Number.parseInt(numbers[0]) + Number.parseInt(numbers[1])) / 2;
  }
  if (range.includes('+')) {
    const hours = Number.parseInt(numbers[0]);
    return hours + 0.5;
  }
  if (range.includes('Less than')) {
    const hours = Number.parseInt(numbers[0]);
    return hours > 1 ? hours - 0.5 : 0.5;
  }
  return Number.parseInt(numbers[0]);
}

function parseStressLevel(stress: string | number | null): number {
  if (stress === null || stress === undefined) return 0;
  if (typeof stress === 'number') return isNaN(stress) ? 0 : Math.round(stress);
  const match = stress.match(/(\d+)\/10/);
  return match ? Number.parseInt(match[1]) : 0;
}

const userMetricsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users/:userId/metrics', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const [forms, journals] = await Promise.all([
        prisma.userForm.findMany({
          where: { authorID: userId },
          select: {
            createdAt: true,
            stress: true,
            screenTime: true,
            studyHours: true,
            activeHours: true,
            sleepHours: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.journal.findMany({
          where: { authorID: userId },
          select: {
            createdAt: true,
            stress: true,
            screenTime: true,
            studyHours: true,
            activeHours: true,
            sleepHours: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      const combined = [...forms, ...journals].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      const metrics = combined.map((e) => ({
        date: e.createdAt.toISOString().split('T')[0],
        stress: parseStressLevel(e.stress),
        screenTime: parseHourRange(e.screenTime),
        studyHours: parseHourRange(e.studyHours),
        activeHours: parseHourRange(e.activeHours),
        sleepHours: parseHourRange(e.sleepHours),
      }));

      reply.send(metrics);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to fetch metrics' });
    }
  });
};

export default userMetricsRoutes; 