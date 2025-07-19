import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { mockPrisma } from '../__mocks__/prisma.js';
import sportsRoutes from '../../routes/sports.js';

// Mock the auth plugin to skip authentication for tests
vi.mock('../../plugins/auth.js', () => ({
  default: async (fastify: FastifyInstance) => {
    // Mock auth that just adds a user to the request
    fastify.addHook('onRequest', async (request) => {
      (request as any).user = { id: 'test-user-id' };
    });
  }
}));

describe('Sports Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    
    // Register the auth plugin mock
    const authPlugin = await import('../../plugins/auth.js');
    await app.register(authPlugin.default);
    
    // Register sports routes
    await app.register(sportsRoutes);

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return list of sports', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/sports'
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(3);
    expect(payload[0]).toHaveProperty('id');
    expect(payload[0]).toHaveProperty('name');
  });

  it('should return sports sorted alphabetically', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/sports'
    });

    const payload = JSON.parse(response.payload);
    expect(payload[0].name).toBe('⚽️ Soccer');
    expect(payload[1].name).toBe('🏀 Basketball');
    expect(payload[2].name).toBe('🏈 Football');
  });

  it('should call prisma.sport.findMany with correct parameters', async () => {
    await app.inject({
      method: 'GET',
      url: '/sports'
    });

    expect(mockPrisma.sport.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });
}); 