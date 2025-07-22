import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import challengeProgressRoutes from '../../routes/challengeProgress.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser,
  createMockTeam,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Challenge Progress Routes', () => {
  let app: FastifyInstance;
  let mockPrisma: ReturnType<typeof getMockPrisma>;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetMockPrisma();
    
    app = Fastify();
    mockPrisma = getMockPrisma();
    await setupTestApp(app);
    await app.register(challengeProgressRoutes);
    await app.ready();
  });

  const createMockChallenge = (overrides: Partial<any> = {}) => ({
    id: 'challenge1',
    title: 'Step Challenge',
    description: 'Walk 10,000 steps per day',
    type: 'step_competition',
    duration: 7,
    teamId: 'team1',
    createdBy: 'user123',
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockParticipant = (overrides: Partial<any> = {}) => ({
    id: 'participant1',
    challengeId: 'challenge1',
    userId: 'user123',
    status: 'accepted',
    joinedAt: new Date(),
    completedAt: null,
    score: 0,
    progress: 0,
    lastUpdated: new Date(),
    challenge: createMockChallenge(),
    user: createMockUser({ id: 'user123', firstName: 'John', lastName: 'Doe' }),
    ...overrides,
  });

  const createMockMilestone = (overrides: Partial<any> = {}) => ({
    id: 'milestone1',
    challengeId: 'challenge1',
    title: 'First 5K Steps',
    description: 'Complete 5,000 steps',
    targetValue: 5000,
    achievedAt: null,
    achievedBy: null,
    ...overrides,
  });

  describe('POST /teams/:teamId/challenges/:challengeId/progress', () => {
    it('should update challenge progress successfully', async () => {
      const mockParticipant = createMockParticipant();
      const mockProgressEntry = {
        id: 'progress1',
        challengeId: 'challenge1',
        userId: 'user123',
        progress: 7500,
        notes: 'Great progress today!',
        updatedAt: new Date(),
      };
      const mockMilestone = createMockMilestone();

      mockPrisma.teamChallengeParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.teamChallengeParticipant.update.mockResolvedValue({
        ...mockParticipant,
        progress: 7500,
        score: 7500,
      });
      mockPrisma.challengeProgress.create.mockResolvedValue(mockProgressEntry);
      mockPrisma.challengeMilestone.findMany.mockResolvedValue([mockMilestone]);
      mockPrisma.challengeMilestone.update.mockResolvedValue({
        ...mockMilestone,
        achievedAt: new Date(),
        achievedBy: 'user123',
      });
      mockPrisma.notification.create.mockResolvedValue({} as any);

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/progress',
        payload: {
          userId: 'user123',
          progress: 7500,
          notes: 'Great progress today!',
        },
      });

      const payload = expectSuccessResponse(response);
      expect(payload.data.participant.progress).toBe(7500);
      expect(payload.data.progressEntry.progress).toBe(7500);
      expect(payload.data.achievedMilestones).toHaveLength(1);
    });

    it('should require userId and progress', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/progress',
        payload: {
          // Missing required fields
        },
      });

      expectErrorResponse(response, 400, 'Update challenge progress body validation failed: Required, Required');
    });

    it('should return 404 for non-existent participant', async () => {
      mockPrisma.teamChallengeParticipant.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/progress',
        payload: {
          userId: 'user123',
          progress: 5000,
        },
      });

      expectErrorResponse(response, 404, 'Challenge participant not found');
    });

    it('should return 403 for wrong team', async () => {
      const mockParticipant = createMockParticipant({
        challenge: createMockChallenge({ teamId: 'wrong-team' }),
      });

      mockPrisma.teamChallengeParticipant.findUnique.mockResolvedValue(mockParticipant);

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/progress',
        payload: {
          userId: 'user123',
          progress: 5000,
        },
      });

      expectErrorResponse(response, 403, 'Challenge does not belong to the specified team');
    });

    it('should handle database errors gracefully', async () => {
      const mockParticipant = createMockParticipant();
      mockPrisma.teamChallengeParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.teamChallengeParticipant.update.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/progress',
        payload: {
          userId: 'user123',
          progress: 5000,
        },
      });

      expectErrorResponse(response, 500, 'Failed to update challenge progress');
    });
  });

  describe('GET /teams/:teamId/challenges/:challengeId/leaderboard', () => {
    it('should return challenge leaderboard', async () => {
      const mockParticipants = [
        createMockParticipant({ userId: 'user1', score: 10000 }),
        createMockParticipant({ userId: 'user2', score: 8000 }),
        createMockParticipant({ userId: 'user3', score: 6000 }),
      ];

      mockPrisma.teamChallenge.findFirst.mockResolvedValue(createMockChallenge());
      mockPrisma.teamChallengeParticipant.findMany.mockResolvedValue(mockParticipants);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/challenge1/leaderboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.data.challenge.id).toBe('challenge1');
      expect(payload.data.leaderboard).toHaveLength(3);
      expect(payload.data.leaderboard[0].score).toBe(10000); // Highest score first
    });

    it('should return 404 for non-existent challenge', async () => {
      mockPrisma.teamChallenge.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/nonexistent/leaderboard',
      });

      expectErrorResponse(response, 404, 'Challenge not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamChallenge.findFirst.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/challenge1/leaderboard',
      });

      expectErrorResponse(response, 500, 'Failed to fetch challenge leaderboard');
    });
  });

  describe('GET /teams/:teamId/challenges/:challengeId/progress', () => {
    it('should return progress history for all users', async () => {
      const mockProgressHistory = [
        {
          id: 'progress1',
          challengeId: 'challenge1',
          userId: 'user123',
          progress: 5000,
          notes: 'Good progress',
          updatedAt: new Date(),
          user: createMockUser({ id: 'user123' }),
        },
        {
          id: 'progress2',
          challengeId: 'challenge1',
          userId: 'user456',
          progress: 3000,
          notes: 'Getting there',
          updatedAt: new Date(),
          user: createMockUser({ id: 'user456' }),
        },
      ];

      mockPrisma.teamChallenge.findFirst.mockResolvedValue(createMockChallenge());
      mockPrisma.challengeProgress.findMany.mockResolvedValue(mockProgressHistory);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/challenge1/progress',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.data).toHaveLength(2);
      expect(payload.data[0].progress).toBe(5000);
      expect(payload.data[1].progress).toBe(3000);
    });

    it('should filter by userId when provided', async () => {
      const mockProgressHistory = [
        {
          id: 'progress1',
          challengeId: 'challenge1',
          userId: 'user123',
          progress: 5000,
          notes: 'Good progress',
          updatedAt: new Date(),
          user: createMockUser({ id: 'user123' }),
        },
      ];

      mockPrisma.teamChallenge.findFirst.mockResolvedValue(createMockChallenge());
      mockPrisma.challengeProgress.findMany.mockResolvedValue(mockProgressHistory);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/challenge1/progress?userId=user123',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.data).toHaveLength(1);
      expect(payload.data[0].userId).toBe('user123');
    });

    it('should return 404 for non-existent challenge', async () => {
      mockPrisma.teamChallenge.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/nonexistent/progress',
      });

      expectErrorResponse(response, 404, 'Challenge not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamChallenge.findFirst.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/challenge1/progress',
      });

      expectErrorResponse(response, 500, 'Failed to fetch challenge progress');
    });
  });

  describe('POST /teams/:teamId/challenges/:challengeId/milestones', () => {
    it('should create a new milestone', async () => {
      const mockMilestone = createMockMilestone({ 
        id: 'new-milestone',
        title: 'First 5K Steps',
        targetValue: 5000,
      });

      mockPrisma.teamChallenge.findFirst.mockResolvedValue(createMockChallenge());
      mockPrisma.challengeMilestone.create.mockResolvedValue(mockMilestone);

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/milestones',
        payload: {
          title: 'First 5K Steps',
          description: 'Complete 5,000 steps',
          targetValue: 5000,
          createdBy: 'user123',
        },
      });

      const payload = expectSuccessResponse(response, 201);
      expect(payload.data.id).toBe('new-milestone');
      expect(payload.data.title).toBe('First 5K Steps');
      expect(payload.data.targetValue).toBe(5000);
    });

    it('should require required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/milestones',
        payload: {
          title: 'Incomplete Milestone',
          // Missing required fields
        },
      });

      expectErrorResponse(response, 400, 'title, targetValue, and createdBy are required');
    });

    it('should return 404 for non-existent challenge', async () => {
      mockPrisma.teamChallenge.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/nonexistent/milestones',
        payload: {
          title: 'First 5K Steps',
          targetValue: 5000,
          createdBy: 'user123',
        },
      });

      expectErrorResponse(response, 404, 'Challenge not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamChallenge.findFirst.mockResolvedValue(createMockChallenge());
      mockPrisma.challengeMilestone.create.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/challenges/challenge1/milestones',
        payload: {
          title: 'First 5K Steps',
          targetValue: 5000,
          createdBy: 'user123',
        },
      });

      expectErrorResponse(response, 500, 'Failed to create milestone');
    });
  });

  describe('GET /teams/:teamId/challenges/:challengeId/milestones', () => {
    it('should return challenge milestones', async () => {
      const mockMilestones = [
        createMockMilestone({ id: 'milestone1', targetValue: 5000 }),
        createMockMilestone({ id: 'milestone2', targetValue: 10000 }),
        createMockMilestone({ 
          id: 'milestone3', 
          targetValue: 5000, 
          achievedAt: new Date(),
          achievedBy: 'user123',
          achiever: createMockUser({ id: 'user123' }),
        }),
      ];

      mockPrisma.teamChallenge.findFirst.mockResolvedValue(createMockChallenge());
      mockPrisma.challengeMilestone.findMany.mockResolvedValue(mockMilestones);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/challenge1/milestones',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.data).toHaveLength(3);
      expect(payload.data[0].targetValue).toBe(5000); // Ordered by targetValue
      expect(payload.data[2].achievedAt).toBeTruthy(); // Achieved milestone
    });

    it('should return 404 for non-existent challenge', async () => {
      mockPrisma.teamChallenge.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/nonexistent/milestones',
      });

      expectErrorResponse(response, 404, 'Challenge not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamChallenge.findFirst.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/challenges/challenge1/milestones',
      });

      expectErrorResponse(response, 500, 'Failed to fetch milestones');
    });
  });
}); 