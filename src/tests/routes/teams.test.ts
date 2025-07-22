import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import teamsRoutes from '../../routes/teams.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser, 
  createMockTeam,
  createMockTeamMembership,
  createMockSchool,
  createMockSport,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Teams Routes', () => {
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
    await app.register(teamsRoutes);
    await app.ready();
  });

  describe('GET /users/:userId/teams', () => {
    it('should return teams for a user', async () => {
      const mockMemberships = [
        {
          team: createMockTeam({ id: 'team1', name: 'Basketball Team' }),
        },
      ];

      mockPrisma.teamMembership.findMany.mockResolvedValue(mockMemberships);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/teams',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(1);
      expect(payload[0].id).toBe('team1');
      expect(payload[0].name).toBe('Basketball Team');
    });

    it('should handle empty teams list', async () => {
      mockPrisma.teamMembership.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/teams',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamMembership.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/teams',
      });

      expectErrorResponse(response, 500, 'Failed to fetch teams');
    });
  });

  describe('GET /teams', () => {
    it('should return all teams with member counts', async () => {
      const mockTeams = [
        {
          id: 'team1',
          name: 'Basketball Team',
          sportID: 'sport1',
          schoolID: 'school1',
          sport: { id: 'sport1', name: '🏀 Basketball' },
          school: { id: 'school1', name: 'High School' },
          _count: { memberships: 12 },
        },
      ];

      mockPrisma.team.findMany.mockResolvedValue(mockTeams);

      const response = await app.inject({
        method: 'GET',
        url: '/teams',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(1);
      expect(payload[0].id).toBe('team1');
      expect(payload[0].memberCount).toBe(12);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.team.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/teams',
      });

      expectErrorResponse(response, 500, 'Failed to fetch all teams');
    });
  });

  describe('GET /teams/:teamId/members', () => {
    it('should return team members', async () => {
      const mockMemberships = [
        {
          userId: 'user1',
          role: 'member',
          joinedAt: new Date(),
          user: createMockUser({ id: 'user1', firstName: 'John', lastName: 'Doe' }),
        },
      ];

      mockPrisma.teamMembership.findMany.mockResolvedValue(mockMemberships);

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/members',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(1);
      expect(payload[0].id).toBe('user1');
      expect(payload[0].role).toBe('member');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.teamMembership.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/teams/team1/members',
      });

      expectErrorResponse(response, 500, 'Failed to fetch team members');
    });
  });

  describe('POST /teams', () => {
    it('should create a new team successfully', async () => {
      const teamData = {
        name: 'Varsity Basketball',
        sportID: 'sport1',
        schoolID: 'school1',
        creatorId: 'user123',
      };

      const mockSport = { id: 'sport1', name: 'Basketball' };
      const mockSchool = { id: 'school1', name: 'High School' };
      const mockTeam = createMockTeam(teamData);

      mockPrisma.sport.findUnique.mockResolvedValue(mockSport);
      mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
      mockPrisma.team.create.mockResolvedValue(mockTeam);
      mockPrisma.teamMembership.create.mockResolvedValue({});

      const response = await app.inject({
        method: 'POST',
        url: '/teams',
        payload: teamData,
      });

      const payload = expectSuccessResponse(response, 201);
      expect(payload.success).toBe(true);
      expect(payload.team.name).toBe('Varsity Basketball');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/teams',
        payload: {
          name: 'Test Team',
          // Missing sportID and creatorId
        },
      });

      expectErrorResponse(response, 400, 'Missing required fields: name, sportID, creatorId');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.sport.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/teams',
        payload: {
          name: 'Test Team',
          sportID: 'sport1',
          creatorId: 'user123',
        },
      });

      expectErrorResponse(response, 500, 'Failed to create team');
    });
  });

  describe('POST /teams/:teamId/members', () => {
    it('should add user to team successfully', async () => {
      const mockTeam = createMockTeam({ id: 'team1', sportID: 'sport1' });
      const mockUser = createMockUser({ id: 'user123' });
      const mockMembership = createMockTeamMembership({
        userId: 'user123',
        teamId: 'team1',
        role: 'member',
      });

      mockPrisma.team.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.teamMembership.findUnique.mockResolvedValue(null);
      mockPrisma.teamMembership.create.mockResolvedValue(mockMembership);

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/members',
        payload: {
          userId: 'user123',
          role: 'member',
        },
      });

      const payload = expectSuccessResponse(response, 201);
      expect(payload.success).toBe(true);
      expect(payload.membership).toBeDefined();
    });

    it('should return 409 when user is already a member', async () => {
      const mockTeam = createMockTeam({ id: 'team1' });
      const mockUser = createMockUser({ id: 'user123' });
      const existingMembership = createMockTeamMembership({
        userId: 'user123',
        teamId: 'team1',
      });

      mockPrisma.team.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.teamMembership.findUnique.mockResolvedValue(existingMembership);

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/members',
        payload: {
          userId: 'user123',
          role: 'member',
        },
      });

      expectErrorResponse(response, 409, 'User is already a member of this team');
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        role: 'member',
        // Missing userId
      };

      const response = await app.inject({
        method: 'POST',
        url: '/teams/team1/members',
        payload: incompleteData,
      });

      expectErrorResponse(response, 400, 'Missing required field: userId');
    });
  });

  describe('PUT /teams/:teamId/members/:userId', () => {
    it('should update user role in team successfully', async () => {
      const existingMembership = {
        id: 'membership1',
        teamId: 'team1',
        userId: 'user123',
        role: 'member',
      };

      const updatedMembership = {
        ...existingMembership,
        role: 'coach',
      };

      mockPrisma.teamMembership.findFirst.mockResolvedValue(existingMembership);
      mockPrisma.teamMembership.update.mockResolvedValue(updatedMembership);

      const response = await app.inject({
        method: 'PUT',
        url: '/teams/team1/members/user123',
        payload: { role: 'coach' },
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
    });

    it('should return 404 when membership not found', async () => {
      mockPrisma.teamMembership.update.mockRejectedValue(new Error('Record not found'));

      const response = await app.inject({
        method: 'PUT',
        url: '/teams/team1/members/nonexistent',
        payload: {
          role: 'member',
        },
      });

      expectErrorResponse(response, 500, 'Failed to update user role');
    });
  });

  describe('DELETE /teams/:teamId/members/:userId', () => {
    it('should remove user from team successfully', async () => {
      const existingMembership = {
        id: 'membership1',
        teamId: 'team1',
        userId: 'user123',
        role: 'member',
      };

      mockPrisma.teamMembership.findFirst.mockResolvedValue(existingMembership);
      mockPrisma.teamMembership.delete.mockResolvedValue(existingMembership);

      const response = await app.inject({
        method: 'DELETE',
        url: '/teams/team1/members/user123',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
    });

    it('should return 404 when membership not found', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/teams/team1/members/user123',
      });

      expectErrorResponse(response, 404, 'Team membership not found');
    });
  });
}); 