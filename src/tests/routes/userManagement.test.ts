import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import userManagementRoutes from '../../routes/userManagement.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser, 
  createMockJournal,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse,
  MockPrisma
} from '../utils/test-utils.js';

describe('User Management Routes', () => {
  let app: FastifyInstance;
  let mockPrisma: MockPrisma;

  beforeEach(async () => {
    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    resetMockPrisma();
    
    // Create fresh Fastify instance
    app = Fastify();
    
    // Get the mocked prisma instance
    mockPrisma = getMockPrisma();

    // Setup test app
    await setupTestApp(app);

    // Register routes
    await app.register(userManagementRoutes);
    await app.ready();
  });

  describe('GET /users/:userId/data', () => {
    it('should return user data when user exists', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/data',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual({
        id: 'user123',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john@example.com',
        phone_number: 'placeholder',
        picture: 'https://example.com/john.jpg',
      });

      // Verify the mock was called correctly
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/nonexistent/data',
      });

      expectErrorResponse(response, 404, 'User not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/data',
      });

      expectErrorResponse(response, 500, 'Failed to fetch user data');
    });
  });

  describe('POST /users', () => {
    it('should create a new user successfully', async () => {
      const newUserData = {
        id: 'newuser123',
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        profileImage: 'https://example.com/jane.jpg',
        username: 'janesmith',
      };

      // Mock that no existing user with this email
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Mock successful user creation
      const createdUser = createMockUser(newUserData);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: newUserData,
      });

      const payload = expectSuccessResponse(response, 201);
      expect(payload).toEqual({
        success: true,
        user: {
          id: 'newuser123',
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          profileImage: 'https://example.com/jane.jpg',
          username: 'janesmith',
          phone_number: 'placeholder',
          activeRole: 'student',
          schoolId: 'school1',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Verify the mocks were called correctly
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'newuser123',
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          profileImage: 'https://example.com/jane.jpg',
          username: 'janesmith',
        },
      });
    });

    it('should return 409 when user with email already exists', async () => {
      const existingUser = createMockUser({ email: 'existing@example.com' });
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          id: 'newuser123',
          email: 'existing@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      });

      expectErrorResponse(response, 409, 'A user with this email already exists');
    });

    it('should handle database errors during user creation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: {
          id: 'newuser123',
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      });

      expectErrorResponse(response, 500, 'Failed to create user');
    });
  });

  describe('GET /users/:userId/snapshot', () => {
    it('should return user snapshot data', async () => {
      const mockUser = createMockUser();
      const mockJournals = [
        createMockJournal({ id: 'journal1', sleepHours: 8 }),
        createMockJournal({ id: 'journal2', sleepHours: 7 }),
      ];
      const mockUserStats = [
        { categoryId: 'fitness', points: 150, level: 2 },
        { categoryId: 'academic', points: 200, level: 3 },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.journal.findMany.mockResolvedValue(mockJournals);
      mockPrisma.userStat.findMany.mockResolvedValue(mockUserStats);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/snapshot',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual({
        averages: {
          activeHours: 2,
          sleepHours: 7.5,
          stress: 3,
          studyHours: 4,
          screenTime: 3,
        },
        firstDay: {
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
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        lastDay: {
          id: 'journal2',
          authorID: 'user123',
          title: 'Daily Reflection',
          wentWell: 'Had a great workout',
          notWell: 'Felt tired in class',
          goals: 'Improve sleep schedule',
          response: 'Keep up the good work!',
          sleepHours: 7,
          activeHours: 2,
          studyHours: 4,
          stress: 3,
          screenTime: 3,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should handle user not found in snapshot', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.journal.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/users/nonexistent/snapshot',
      });

      expectErrorResponse(response, 404, 'No journal entries found for user');
    });

    it('should handle empty journal data', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.journal.findMany.mockResolvedValue([]);
      mockPrisma.userStat.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/snapshot',
      });

      expectErrorResponse(response, 404, 'No journal entries found for user');
    });
  });
}); 