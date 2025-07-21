import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import schoolsRoutes from '../../routes/schools.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockSchool,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Schools Routes', () => {
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
    await app.register(schoolsRoutes);
  });

  describe('GET /schools', () => {
    it('should return all schools in alphabetical order', async () => {
      // The route uses orderBy: { name: 'asc' } in the database query
      // So the mock should return schools in alphabetical order
      const mockSchools = [
        { id: 'school1', name: 'Adams High School' },
        { id: 'school3', name: 'Brookside Elementary' },
        { id: 'school2', name: 'Central Academy' },
      ];

      mockPrisma.school.findMany.mockResolvedValue(mockSchools);

      const response = await app.inject({
        method: 'GET',
        url: '/schools',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(3);
      expect(payload[0].name).toBe('Adams High School');
      expect(payload[1].name).toBe('Brookside Elementary');
      expect(payload[2].name).toBe('Central Academy');
    });

    it('should return only id and name fields', async () => {
      // The route uses select: { id: true, name: true }
      // So the mock should only return those fields
      const mockSchools = [
        { id: 'school1', name: 'Test School' },
      ];

      mockPrisma.school.findMany.mockResolvedValue(mockSchools);

      const response = await app.inject({
        method: 'GET',
        url: '/schools',
      });

      const payload = expectSuccessResponse(response);
      expect(payload[0]).toEqual({
        id: 'school1',
        name: 'Test School',
      });
      // Should not include other fields like createdAt, updatedAt, etc.
      expect(payload[0]).not.toHaveProperty('createdAt');
      expect(payload[0]).not.toHaveProperty('updatedAt');
    });

    it('should return empty array when no schools exist', async () => {
      mockPrisma.school.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/schools',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.school.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/schools',
      });

      expectErrorResponse(response, 500, 'Failed to fetch schools');
    });

    it('should handle single school response', async () => {
      const mockSchool = { 
        id: 'school1', 
        name: 'Lone Star Academy' 
      };

      mockPrisma.school.findMany.mockResolvedValue([mockSchool]);

      const response = await app.inject({
        method: 'GET',
        url: '/schools',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(1);
      expect(payload[0].id).toBe('school1');
      expect(payload[0].name).toBe('Lone Star Academy');
    });

    it('should handle schools with special characters in names', async () => {
      // The route uses orderBy: { name: 'asc' } in the database query
      // So the mock should return schools in alphabetical order
      const mockSchools = [
        { id: 'school3', name: 'École Bilingue' },
        { id: 'school2', name: 'O\'Connor Academy' },
        { id: 'school1', name: 'St. Mary\'s High School' },
      ];

      mockPrisma.school.findMany.mockResolvedValue(mockSchools);

      const response = await app.inject({
        method: 'GET',
        url: '/schools',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toHaveLength(3);
      expect(payload[0].name).toBe('École Bilingue');
      expect(payload[1].name).toBe('O\'Connor Academy');
      expect(payload[2].name).toBe('St. Mary\'s High School');
    });
  });
}); 