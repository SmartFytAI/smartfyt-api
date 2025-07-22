import { FastifyInstance } from 'fastify';
import { vi, expect } from 'vitest';

// Import the global mock from setup.ts
import { prisma } from '../../../lib/prisma.js';

export interface MockPrisma {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  journal: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  userQuest: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  userStat: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
  team: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  teamMembership: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  quest: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  questCategory: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  school: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  sport: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  dailyHealthSummary: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  sleepDetail: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  activityDetail: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  userForm: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  teamChallenge: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  teamChallengeParticipant: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  teamRecognition: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  userRecognitionLimit: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  recognitionInteraction: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  challengeProgress: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  challengeMilestone: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  notification: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  $connect: ReturnType<typeof vi.fn>;
  $disconnect: ReturnType<typeof vi.fn>;
}

// Get the global mocked prisma instance
export function getMockPrisma(): MockPrisma {
  return vi.mocked(prisma) as unknown as MockPrisma;
}

// Reset all mocks - use this in beforeEach to ensure clean state
export function resetMockPrisma() {
  const mockPrisma = getMockPrisma();
  
  // Reset all mock functions
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'object' && method !== null && 'mockReset' in method) {
          (method as any).mockReset();
        }
      });
    }
  });
}

// Mock data factories
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user123',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    profileImage: 'https://example.com/john.jpg',
    username: 'johndoe',
    phone_number: 'placeholder',
    activeRole: 'student',
    schoolId: 'school1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockJournal(overrides: Partial<any> = {}) {
  return {
    id: 'journal1',
    authorID: 'user123',
    title: 'Daily Reflection',
    wentWell: 'Had a great workout',
    notWell: 'Felt tired in class',
    goals: 'Improve sleep schedule',
    response: 'Keep up the good work!',
    sleepHours: 8,
    activeHours: 2,
    studyHours: 4,
    stress: 3,
    screenTime: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUserStat(overrides: Partial<any> = {}) {
  return {
    id: 'userstat1',
    userId: 'user123',
    categoryId: 'category1',
    points: 150,
    level: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: {
      id: 'category1',
      name: 'Fitness',
      description: 'Physical fitness activities',
    },
    ...overrides,
  };
}

export function createMockSchool(overrides: Partial<any> = {}) {
  return {
    id: 'school1',
    name: 'High School',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockSport(overrides: Partial<any> = {}) {
  return {
    id: 'sport1',
    name: 'Basketball',
    description: 'Team sport with hoops',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTeam(overrides: Partial<any> = {}) {
  return {
    id: 'team1',
    name: 'Varsity Basketball',
    sportID: 'sport1',
    schoolID: 'school1',
    creatorId: 'user123',
    description: 'Varsity basketball team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTeamMembership(overrides: Partial<any> = {}) {
  return {
    id: 'membership1',
    teamId: 'team1',
    userId: 'user123',
    role: 'member',
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockQuestCategory(overrides: Partial<any> = {}) {
  return {
    id: 'cat1',
    name: 'Fitness',
    description: 'Physical fitness and health challenges',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockQuest(overrides: Partial<any> = {}) {
  return {
    id: 'quest1',
    title: 'Run 5K',
    description: 'Complete a 5K run',
    pointValue: 50,
    categoryId: 'cat1',
    category: createMockQuestCategory(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUserQuest(overrides: Partial<any> = {}) {
  return {
    id: 'userquest1',
    userId: 'user123',
    questId: 'quest1',
    status: 'assigned',
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quest: createMockQuest(),
    ...overrides,
  };
}

export function createMockUserForm(overrides: Partial<any> = {}) {
  return {
    id: 'form1',
    authorID: 'user123',
    age: '18',
    phone: '555-1234',
    grade: '12',
    sleepHours: 8,
    studyHours: 4,
    activeHours: 2,
    stress: 3,
    sportID: 'sport1',
    wearable: 'Apple Watch',
    screenTime: 3,
    athleticGoals: 'Win state championship',
    academicGoals: 'Get into college',
    coachName: 'Coach Smith',
    coachEmail: 'coach@school.com',
    team: createMockTeam(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper functions for test setup
export async function setupTestApp(app: FastifyInstance) {
  // The prisma module is already mocked globally in setup.ts
  // No additional setup needed
  return app;
}

export function expectErrorResponse(response: any, statusCode: number, errorMessage: string) {
  expect(response.statusCode).toBe(statusCode);
  const payload = JSON.parse(response.payload);
  expect(payload.error).toBe(errorMessage);
}

export function expectSuccessResponse(response: any, statusCode: number = 200) {
  expect(response.statusCode).toBe(statusCode);
  const payload = JSON.parse(response.payload);
  expect(payload).toBeDefined();
  return payload;
}

// Common test scenarios
export const testScenarios = {
  userNotFound: () => {
    const mockPrisma = getMockPrisma();
    mockPrisma.user.findUnique.mockResolvedValue(null);
  },
  
  databaseError: (method: keyof MockPrisma, operation: string) => {
    const mockPrisma = getMockPrisma();
    const model = mockPrisma[method] as any;
    if (model && model[operation]) {
      model[operation].mockRejectedValue(new Error('Database connection failed'));
    }
  },
  
  emptyResult: (method: keyof MockPrisma, operation: string) => {
    const mockPrisma = getMockPrisma();
    const model = mockPrisma[method] as any;
    if (model && model[operation]) {
      model[operation].mockResolvedValue([]);
    }
  },
}; 