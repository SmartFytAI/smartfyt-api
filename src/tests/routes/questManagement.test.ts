import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import questManagementRoutes from '../../routes/questManagement.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser, 
  createMockQuest,
  createMockUserQuest,
  createMockUserStat,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Quest Management Routes', () => {
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
    await app.register(questManagementRoutes);
    await app.ready();
  });

  describe('POST /users/:userId/quests/complete', () => {
    it('should complete a quest successfully and update user stats', async () => {
      const mockQuest = createMockQuest({ pointValue: 50 });
      const mockUserQuest = createMockUserQuest({
        status: 'assigned',
        quest: mockQuest,
      });
      const mockUserStat = createMockUserStat({ points: 100, level: 1 });

      mockPrisma.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrisma.userQuest.findFirst.mockResolvedValue(mockUserQuest);
      mockPrisma.userQuest.update.mockResolvedValue({
        ...mockUserQuest,
        status: 'completed',
        completedAt: new Date(),
      });
      mockPrisma.userStat.findFirst.mockResolvedValue(mockUserStat);
      mockPrisma.userStat.update.mockResolvedValue({
        ...mockUserStat,
        points: 150,
        level: 2,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/complete',
        payload: {
          questId: 'quest1',
          notes: 'Great workout!',
        },
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.points).toBe(50);
      expect(payload.newLevel).toBe(2);
      expect(payload.totalPoints).toBe(150);
    });

    it('should create new user stat when none exists', async () => {
      const mockQuest = createMockQuest({ pointValue: 50 });
      const mockUserQuest = createMockUserQuest({
        status: 'assigned',
        quest: mockQuest,
      });
      const mockUserStat = createMockUserStat({ points: 50, level: 1 });

      mockPrisma.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrisma.userQuest.findFirst.mockResolvedValue(mockUserQuest);
      mockPrisma.userQuest.update.mockResolvedValue({
        ...mockUserQuest,
        status: 'completed',
        completedAt: new Date(),
      });
      mockPrisma.userStat.findFirst.mockResolvedValue(null);
      mockPrisma.userStat.create.mockResolvedValue(mockUserStat);

      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/complete',
        payload: {
          questId: 'quest1',
          notes: 'Great workout!',
        },
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.points).toBe(50);
      expect(payload.newLevel).toBe(1);
      expect(payload.totalPoints).toBe(50);
    });

    it('should return 400 when questId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/complete',
        payload: {},
      });

      expectErrorResponse(response, 400, 'questId is required');
    });

    it('should return 400 when notes are too long', async () => {
      const longNotes = 'a'.repeat(281);
      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/complete',
        payload: {
          questId: 'quest1',
          notes: longNotes,
        },
      });

      expectErrorResponse(response, 400, 'Notes must be 280 characters or less');
    });

    it('should return 404 when quest not found', async () => {
      mockPrisma.quest.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/complete',
        payload: {
          questId: 'nonexistent',
          notes: 'Test notes',
        },
      });

      expectErrorResponse(response, 404, 'Quest not found in database');
    });

    it('should return 404 when user quest not found or already completed', async () => {
      const mockQuest = createMockQuest();
      mockPrisma.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrisma.userQuest.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/complete',
        payload: {
          questId: 'quest1',
          notes: 'Test notes',
        },
      });

      expectErrorResponse(response, 404, 'Quest not found or already completed');
    });
  });

  describe('POST /users/:userId/quests/assign', () => {
    it('should assign quests to user successfully', async () => {
      const mockCategories = [
        { id: 'category1', name: 'Fitness' },
        { id: 'category2', name: 'Academic' },
        { id: 'category3', name: 'Social' },
      ];
      const mockQuests = [
        createMockQuest({ id: 'quest1', categoryId: 'category1' }),
        createMockQuest({ id: 'quest2', categoryId: 'category2' }),
      ];
      const mockUserQuests = [
        createMockUserQuest({ questId: 'quest1', status: 'assigned' }),
        createMockUserQuest({ questId: 'quest2', status: 'assigned' }),
      ];

      mockPrisma.userQuest.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.questCategory.findMany.mockResolvedValue(mockCategories);
      mockPrisma.quest.findMany.mockResolvedValue(mockQuests);
      mockPrisma.userQuest.create.mockResolvedValue(mockUserQuests[0]);
      mockPrisma.userQuest.findMany.mockResolvedValue(mockUserQuests);

      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/assign',
        payload: {},
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(2);
      expect(payload[0]).toHaveProperty('id');
      expect(payload[0]).toHaveProperty('title');
      expect(payload[0]).toHaveProperty('categoryName');
    });

    it('should handle no quest categories found', async () => {
      mockPrisma.userQuest.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.questCategory.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/assign',
        payload: {},
      });

      expectErrorResponse(response, 404, 'No quest categories found in the database');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.userQuest.updateMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/users/user123/quests/assign',
        payload: {},
      });

      expectErrorResponse(response, 500, 'Failed to assign quests');
    });
  });
}); 