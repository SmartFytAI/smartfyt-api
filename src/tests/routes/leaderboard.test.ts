import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import leaderboardRoutes from '../../routes/leaderboard.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser, 
  createMockTeam,
  createMockTeamMembership,
  createMockSchool,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Leaderboard Routes', () => {
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
    await app.register(leaderboardRoutes);
  });

  describe('GET /teams/:teamId/leaderboard', () => {
    it('should return team leaderboard', async () => {
      const mockTeam = createMockTeam();
      const mockMembers = [
        createMockTeamMembership({
          teamId: 'team1',
          userId: 'user1',
          role: 'member',
          user: createMockUser({ id: 'user1', firstName: 'John', lastName: 'Doe' }),
        }),
        createMockTeamMembership({
          teamId: 'team1',
          userId: 'user2',
          role: 'member',
          user: createMockUser({ id: 'user2', firstName: 'Jane', lastName: 'Smith' }),
        }),
      ];

      mockPrisma.teamMembership.findMany.mockResolvedValue(mockMembers);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/leaderboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(2);
      expect(payload[0]).toHaveProperty('id');
      expect(payload[0]).toHaveProperty('firstName');
      expect(payload[0]).toHaveProperty('performanceScore');
    });

    it('should return 400 when teamId is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/teams//leaderboard',
      });

      expectErrorResponse(response, 400, 'Get team leaderboard params validation failed: Team ID is required');
    });

    it('should handle empty team leaderboard', async () => {
      mockPrisma.teamMembership.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/leaderboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamMembership.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/leaderboard',
      });

      expectErrorResponse(response, 500, 'Could not load team leaderboard.');
    });
  });

  describe('GET /users/:userId/school/leaderboard', () => {
    it('should return school leaderboard for user', async () => {
      const mockUser = createMockUser({ schoolId: 'school1' });
      const mockSchoolMembers = [
        createMockUser({ id: 'user1', firstName: 'John', lastName: 'Doe' }),
        createMockUser({ id: 'user2', firstName: 'Jane', lastName: 'Smith' }),
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.findMany.mockResolvedValue(mockSchoolMembers);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/school/leaderboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(2);
      expect(payload[0]).toHaveProperty('id');
      expect(payload[0]).toHaveProperty('firstName');
      expect(payload[0]).toHaveProperty('performanceScore');
    });

    it('should handle users without school', async () => {
      const mockUser = createMockUser({ schoolId: null });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/school/leaderboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/school/leaderboard',
      });

      expectErrorResponse(response, 500, 'Could not load school leaderboard.');
    });
  });

  describe('GET /users/:userId/teams/leaderboard', () => {
    it('should return leaderboards for all user teams', async () => {
      const mockMemberships = [
        {
          team: { id: 'team1', name: 'Team Alpha' },
        },
        {
          team: { id: 'team2', name: 'Team Beta' },
        },
      ];

      mockPrisma.teamMembership.findMany.mockResolvedValue(mockMemberships);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/teams/leaderboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(2);
      expect(payload[0]).toEqual({ id: 'team1', name: 'Team Alpha' });
      expect(payload[1]).toEqual({ id: 'team2', name: 'Team Beta' });
    });

    it('should handle users with no teams', async () => {
      mockPrisma.teamMembership.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/teams/leaderboard',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamMembership.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/teams/leaderboard',
      });

      expectErrorResponse(response, 500, 'Could not load your teams.');
    });
  });
}); 