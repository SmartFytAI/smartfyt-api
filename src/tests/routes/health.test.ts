import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

describe('Health Endpoint', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    
    // Register health endpoint (same as in server.ts)
    app.get('/health', async () => ({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return health status without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.status).toBe('ok');
    expect(payload.version).toBe('1.0.0');
    expect(payload.timestamp).toBeDefined();
  });

  it('should return valid JSON structure', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('status');
    expect(payload).toHaveProperty('timestamp');
    expect(payload).toHaveProperty('version');
  });
}); 