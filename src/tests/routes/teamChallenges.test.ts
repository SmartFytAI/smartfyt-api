import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import teamChallengesRoutes from '../../routes/teamChallenges.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Team Challenges Routes', () => {
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
    await app.register(teamChallengesRoutes);
    await app.ready();
  });

  describe('Recognition Interactions', () => {
    const testRecognitionId = 'test-recognition-123';
    const testUserId = 'test-user-123';

    it('should get interactions for a recognition', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          recognitionId: testRecognitionId,
          userId: testUserId,
          interactionType: 'like',
          createdAt: new Date(),
          user: createMockUser({ id: testUserId }),
        },
      ];

      mockPrisma.recognitionInteraction.findMany.mockResolvedValue(mockInteractions);

      const response = await app.inject({
        method: 'GET',
        url: `/recognitions/${testRecognitionId}/interactions`,
      });

      expectSuccessResponse(response);
    });

    it('should create a new interaction', async () => {
      const mockRecognition = {
        id: testRecognitionId,
        fromUserId: 'from-user-123',
        toUserId: 'to-user-123',
        teamId: 'test-team-123',
        type: 'clap',
        message: 'Great job!',
      };

      const mockInteraction = {
        id: 'new-interaction-123',
        recognitionId: testRecognitionId,
        userId: testUserId,
        interactionType: 'like',
        createdAt: new Date(),
        user: createMockUser({ id: testUserId }),
      };

      mockPrisma.teamRecognition.findUnique.mockResolvedValue(mockRecognition);
      mockPrisma.recognitionInteraction.findUnique.mockResolvedValue(null);
      mockPrisma.recognitionInteraction.create.mockResolvedValue(mockInteraction);

      const response = await app.inject({
        method: 'POST',
        url: `/recognitions/${testRecognitionId}/interactions`,
        payload: {
          recognitionId: testRecognitionId,
          userId: testUserId,
          interactionType: 'like',
        },
      });

      expectSuccessResponse(response, 201);
    });

    it('should prevent duplicate interactions', async () => {
      const mockRecognition = {
        id: testRecognitionId,
        fromUserId: 'from-user-123',
        toUserId: 'to-user-123',
        teamId: 'test-team-123',
        type: 'clap',
        message: 'Great job!',
      };

      const mockExistingInteraction = {
        id: 'existing-interaction-123',
        recognitionId: testRecognitionId,
        userId: testUserId,
        interactionType: 'like',
        createdAt: new Date(),
      };

      mockPrisma.teamRecognition.findUnique.mockResolvedValue(mockRecognition);
      mockPrisma.recognitionInteraction.findUnique.mockResolvedValue(mockExistingInteraction);

      const response = await app.inject({
        method: 'POST',
        url: `/recognitions/${testRecognitionId}/interactions`,
        payload: {
          recognitionId: testRecognitionId,
          userId: testUserId,
          interactionType: 'like',
        },
      });

      expectErrorResponse(response, 400, 'User already has like interaction for this recognition');
    });

    it('should remove an interaction', async () => {
      const mockInteraction = {
        id: 'existing-interaction-123',
        recognitionId: testRecognitionId,
        userId: testUserId,
        interactionType: 'like',
        createdAt: new Date(),
      };

      mockPrisma.recognitionInteraction.findUnique.mockResolvedValue(mockInteraction);
      mockPrisma.recognitionInteraction.delete.mockResolvedValue(mockInteraction);

      const response = await app.inject({
        method: 'DELETE',
        url: `/recognitions/${testRecognitionId}/interactions/${testUserId}/like`,
      });

      expectSuccessResponse(response);
    });

    it('should return empty array for non-existent recognition', async () => {
      mockPrisma.recognitionInteraction.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/recognitions/non-existent/interactions',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.data).toEqual([]);
    });

    it('should return 404 when trying to create interaction for non-existent recognition', async () => {
      mockPrisma.teamRecognition.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/recognitions/non-existent/interactions',
        payload: {
          recognitionId: 'non-existent',
          userId: testUserId,
          interactionType: 'like',
        },
      });

      expectErrorResponse(response, 404, 'Recognition not found');
    });
  });
}); 