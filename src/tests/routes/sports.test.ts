import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import sportsRoutes from '../../routes/sports.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockSport,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Sports Routes', () => {
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
    await app.register(sportsRoutes);
  });

  describe('GET /sports', () => {
    it('should return all sports successfully', async () => {
      const mockSports = [
        createMockSport({ id: 'sport1', name: 'Basketball' }),
        createMockSport({ id: 'sport2', name: 'Football' }),
      ];

      mockPrisma.sport.findMany.mockResolvedValue(mockSports);

      const response = await app.inject({
        method: 'GET',
        url: '/sports',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.length).toBeGreaterThan(0);
      expect(payload[0]).toHaveProperty('id');
      expect(payload[0]).toHaveProperty('name');
    });

    it('should return sports in alphabetical order', async () => {
      const mockSports = [
        createMockSport({ id: 'sport1', name: 'Basketball' }),
        createMockSport({ id: 'sport2', name: 'Football' }),
      ];

      mockPrisma.sport.findMany.mockResolvedValue(mockSports);

      const response = await app.inject({
        method: 'GET',
        url: '/sports',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveLength(2);
      expect(payload[0].name).toBe('Basketball');
      expect(payload[1].name).toBe('Football');
    });

    it('should return correct data structure', async () => {
      const mockSports = [
        createMockSport({ id: 'sport1', name: 'Basketball' }),
      ];

      mockPrisma.sport.findMany.mockResolvedValue(mockSports);

      const response = await app.inject({
        method: 'GET',
        url: '/sports',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload[0]).toHaveProperty('id');
      expect(payload[0]).toHaveProperty('name');
      expect(typeof payload[0].id).toBe('string');
      expect(typeof payload[0].name).toBe('string');
    });
  });
}); 