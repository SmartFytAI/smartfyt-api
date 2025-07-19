import { beforeAll, afterAll, vi } from 'vitest';

// Mock Prisma at the module level
const mockPrisma = {
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
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
};

// Mock the prisma module globally
vi.mock('../lib/prisma.js', () => ({
  prisma: mockPrisma,
  default: { prisma: mockPrisma },
}));

// Set test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.KINDE_ISSUER_URL = 'https://test.kinde.com';
  process.env.KINDE_CLIENT_ID = 'test-client-id';
  process.env.LOG_LEVEL = 'silent';
  
  // Mock console.log to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
}); 