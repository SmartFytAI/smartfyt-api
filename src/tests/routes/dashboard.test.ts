import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import dashboardRoutes from '../../routes/dashboard.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser, 
  createMockJournal,
  createMockUserStat,
  createMockUserQuest,
  createMockQuest,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Dashboard Routes', () => {
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
    await app.register(dashboardRoutes);
    await app.ready();
  });

  describe('GET /users/:userId/dashboard', () => {
    it('should return comprehensive dashboard data', async () => {
      const mockUser = createMockUser();
      const mockUserQuests = [
        createMockUserQuest({ 
          quest: createMockQuest({ title: 'Quest 1' }),
          status: 'assigned' 
        }),
      ];
      const mockCategories = [
        { id: 'category1', name: 'Fitness' },
        { id: 'category2', name: 'Academic' },
      ];
      const mockUserStats = [
        createMockUserStat({ points: 150, level: 2 }),
      ];
      const mockDailySummaries = [
        { id: 'summary1', date: new Date(), sleepHours: 8, studyHours: 4 },
      ];
      const mockSleepDetails = [
        { id: 'sleep1', startTime: new Date(), endTime: new Date(), duration: 8 },
      ];
      const mockActivityDetails = [
        { id: 'activity1', startTime: new Date(), endTime: new Date(), calories: 300 },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userQuest.findMany.mockResolvedValue(mockUserQuests);
      mockPrisma.questCategory.findMany.mockResolvedValue(mockCategories);
      mockPrisma.userStat.findMany.mockResolvedValue(mockUserStats);
      mockPrisma.dailyHealthSummary.findMany.mockResolvedValue(mockDailySummaries);
      mockPrisma.sleepDetail.findMany.mockResolvedValue(mockSleepDetails);
      mockPrisma.activityDetail.findMany.mockResolvedValue(mockActivityDetails);
      mockPrisma.userForm.findFirst.mockResolvedValue({ id: 'form1' });

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/dashboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.user).toBeDefined();
      expect(payload.quests).toHaveLength(1);
      expect(payload.stats).toHaveLength(2); // Categories + user stats
      expect(payload.healthData).toBeDefined();
      expect(payload.hasUserForm).toBe(true);
    });

    it('should handle user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      // Mock other data that would still be returned even if user is null
      mockPrisma.userQuest.findMany.mockResolvedValue([]);
      mockPrisma.questCategory.findMany.mockResolvedValue([]);
      mockPrisma.userStat.findMany.mockResolvedValue([]);
      mockPrisma.dailyHealthSummary.findMany.mockResolvedValue([]);
      mockPrisma.sleepDetail.findMany.mockResolvedValue([]);
      mockPrisma.activityDetail.findMany.mockResolvedValue([]);
      mockPrisma.userForm.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/nonexistent/dashboard',
      });

      // The route doesn't check if user exists, it just returns empty data
      const payload = expectSuccessResponse(response);
      expect(payload.user).toBeNull();
      expect(payload.quests).toEqual([]);
      expect(payload.stats).toEqual([]);
    });

    it('should handle empty dashboard data', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userQuest.findMany.mockResolvedValue([]);
      mockPrisma.questCategory.findMany.mockResolvedValue([]);
      mockPrisma.userStat.findMany.mockResolvedValue([]);
      mockPrisma.dailyHealthSummary.findMany.mockResolvedValue([]);
      mockPrisma.sleepDetail.findMany.mockResolvedValue([]);
      mockPrisma.activityDetail.findMany.mockResolvedValue([]);
      mockPrisma.userForm.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/dashboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.user).toBeDefined();
      expect(payload.quests).toEqual([]);
      expect(payload.stats).toEqual([]);
      expect(payload.hasUserForm).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/dashboard',
      });

      expectErrorResponse(response, 500, 'Failed to fetch dashboard data');
    });
  });
}); 