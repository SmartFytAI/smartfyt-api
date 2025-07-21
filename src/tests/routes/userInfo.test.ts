import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import userInfoRoutes from '../../routes/userInfo.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser,
  createMockUserForm,
  createMockTeam,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('UserInfo Routes', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof getMockPrisma>;

  beforeEach(async () => {
    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    resetMockPrisma();
    
    // Create fresh Fastify instance
    app = Fastify();
    
    // Get the mocked prisma instance
    mockPrisma = getMockPrisma();

    // Setup test app with mocked Prisma
    await setupTestApp(app);
    
    // Register routes
    await app.register(userInfoRoutes);
  });

  describe('GET /users/:userId/info', () => {
    it('should return user info with form data successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
      };

      const mockTeam = createMockTeam({ id: 'team1', schoolID: 'school1' });
      const mockUserForm = createMockUserForm({
        authorID: 'user123',
        age: '18',
        phone: '555-1234',
        team: mockTeam,
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
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userForm.findFirst.mockResolvedValue(mockUserForm);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/info',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual({
        id: 'user123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
        name: 'John Doe',
        age: '18',
        phoneNumber: '555-1234',
        school: 'school1',
        grade: '12',
        sleepHours: 8,
        studyHours: 4,
        activeHours: 2,
        stressLevel: 3,
        sport: 'sport1',
        wearable: 'Apple Watch',
        screenTime: 3,
        athleticGoals: 'Win state championship',
        academicGoals: 'Get into college',
        coachName: 'Coach Smith',
        coachEmail: 'coach@school.com',
      });
    });

    it('should return user info without form data when form does not exist', async () => {
      const mockUser = {
        id: 'user123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userForm.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/info',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual({
        id: 'user123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
        name: 'John Doe',
        age: '',
        phoneNumber: '',
        school: '',
        grade: '',
        sleepHours: 0,
        studyHours: 0,
        activeHours: 0,
        stressLevel: 0,
        sport: '',
        wearable: '',
        screenTime: 0,
        athleticGoals: '',
        academicGoals: '',
        coachName: '',
        coachEmail: '',
      });
    });

    it('should handle user with missing first or last name', async () => {
      const mockUser = {
        id: 'user123',
        email: 'john@example.com',
        firstName: null,
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userForm.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/info',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.name).toBe('Doe');
    });

    it('should handle user with both missing first and last name', async () => {
      const mockUser = {
        id: 'user123',
        email: 'john@example.com',
        firstName: null,
        lastName: null,
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userForm.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/info',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.name).toBe('');
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/nonexistent/info',
      });

      expectErrorResponse(response, 404, 'User not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/info',
      });

      expectErrorResponse(response, 500, 'Failed to fetch user info');
    });

    it('should handle user form without team data', async () => {
      const mockUser = {
        id: 'user123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
      };

      const mockUserForm = createMockUserForm({
        authorID: 'user123',
        team: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userForm.findFirst.mockResolvedValue(mockUserForm);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/info',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.school).toBe('');
    });

    it('should handle user form with partial data', async () => {
      const mockUser = {
        id: 'user123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
        username: 'johndoe',
      };

      const mockUserForm = createMockUserForm({
        authorID: 'user123',
        age: '18',
        phone: '555-1234',
        grade: undefined,
        sleepHours: undefined,
        studyHours: undefined,
        activeHours: undefined,
        stress: undefined,
        sportID: undefined,
        wearable: undefined,
        screenTime: undefined,
        athleticGoals: undefined,
        academicGoals: undefined,
        coachName: undefined,
        coachEmail: undefined,
        team: undefined,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userForm.findFirst.mockResolvedValue(mockUserForm);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/info',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.age).toBe('18');
      expect(payload.phoneNumber).toBe('555-1234');
      expect(payload.grade).toBe('');
      expect(payload.sleepHours).toBe(0);
    });
  });
}); 