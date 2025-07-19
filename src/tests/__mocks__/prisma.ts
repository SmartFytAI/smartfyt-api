import { vi } from 'vitest';

// Mock Prisma Client
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  sport: {
    findMany: vi.fn().mockResolvedValue([
      { id: '1', name: '⚽️ Soccer' },
      { id: '2', name: '🏀 Basketball' },
      { id: '3', name: '🏈 Football' },
    ]),
  },
  school: {
    findMany: vi.fn().mockResolvedValue([
      { id: '1', name: 'Harvard' },
      { id: '2', name: 'Stanford' },
      { id: '3', name: 'MIT' },
    ]),
  },
  team: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  journal: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  userForm: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  dailyHealthSummary: {
    findMany: vi.fn(),
  },
  sleepDetail: {
    findMany: vi.fn(),
  },
  activityDetail: {
    findMany: vi.fn(),
  },
  userQuest: {
    findMany: vi.fn(),
  },
  questCategory: {
    findMany: vi.fn(),
  },
  userStat: {
    findMany: vi.fn(),
  },
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
};

// Mock the lib/prisma module
vi.mock('../../lib/prisma.js', () => ({
  prisma: mockPrisma,
  default: { prisma: mockPrisma },
})); 