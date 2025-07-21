import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import motivationalQuotesRoutes from '../../routes/motivationalQuotes.js';
import { 
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';
import fs from 'fs';
import path from 'path';

// Mock fs and path modules
vi.mock('fs');
vi.mock('path');

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('MotivationalQuotes Routes', () => {
  let app: FastifyInstance;

  const mockQuotes = [
    {
      id: 1,
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "Success"
    },
    {
      id: 2,
      quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
      category: "Success"
    },
    {
      id: 3,
      quote: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      category: "Dreams"
    },
    {
      id: 4,
      quote: "Don't watch the clock; do what it does. Keep going.",
      author: "Sam Levenson",
      category: "Motivation"
    }
  ];

  beforeEach(async () => {
    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    
    // Create fresh Fastify instance
    app = Fastify();

    // Setup test app
    await setupTestApp(app);
    
    // Register routes
    await app.register(motivationalQuotesRoutes);

    // Setup default mocks
    mockPath.join.mockReturnValue('/mock/path/to/quotes.json');
    mockFs.readFileSync.mockReturnValue(JSON.stringify(mockQuotes));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /daily', () => {
    it('should return a random daily quote successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/daily',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toBeDefined();
      expect(payload.data).toHaveProperty('id');
      expect(payload.data).toHaveProperty('quote');
      expect(payload.data).toHaveProperty('author');
      expect(payload.data).toHaveProperty('category');
      expect(mockQuotes).toContainEqual(payload.data);
    });

    it('should handle empty quotes file', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify([]));

      const response = await app.inject({
        method: 'GET',
        url: '/daily',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes available');
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/daily',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes available');
    });
  });

  describe('GET /random', () => {
    it('should return a random quote successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/random',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toBeDefined();
      expect(payload.data).toHaveProperty('id');
      expect(payload.data).toHaveProperty('quote');
      expect(payload.data).toHaveProperty('author');
      expect(payload.data).toHaveProperty('category');
      expect(mockQuotes).toContainEqual(payload.data);
    });

    it('should handle empty quotes file', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify([]));

      const response = await app.inject({
        method: 'GET',
        url: '/random',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes available');
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/random',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes available');
    });
  });

  describe('GET /all', () => {
    it('should return all quotes successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/all',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toBeDefined();
      expect(Array.isArray(payload.data)).toBe(true);
      expect(payload.data).toHaveLength(4);
      expect(payload.data).toEqual(mockQuotes);
    });

    it('should handle empty quotes file', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify([]));

      const response = await app.inject({
        method: 'GET',
        url: '/all',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes available');
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/all',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes available');
    });
  });

  describe('GET /category', () => {
    it('should return quotes by category successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/category?category=Success',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toBeDefined();
      expect(Array.isArray(payload.data)).toBe(true);
      expect(payload.data).toHaveLength(2);
      expect(payload.data.every((quote: any) => quote.category === 'Success')).toBe(true);
    });

    it('should handle case-insensitive category matching', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/category?category=success',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toHaveLength(2);
      expect(payload.data.every((quote: any) => quote.category === 'Success')).toBe(true);
    });

    it('should return 400 when category parameter is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/category',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Category parameter is required');
    });

    it('should handle category with no matching quotes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/category?category=NonExistent',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes found for category: NonExistent');
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/category?category=Success',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('No quotes found for category: Success');
    });
  });

  describe('GET /categories', () => {
    it('should return unique categories successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/categories',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toBeDefined();
      expect(Array.isArray(payload.data)).toBe(true);
      expect(payload.data).toHaveLength(3);
      expect(payload.data).toContain('Success');
      expect(payload.data).toContain('Dreams');
      expect(payload.data).toContain('Motivation');
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/categories',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toEqual([]);
    });
  });

  describe('GET /:id', () => {
    it('should return quote by ID successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/1',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(true);
      expect(payload.data).toBeDefined();
      expect(payload.data).toEqual(mockQuotes[0]);
    });

    it('should return 404 when quote ID does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/999',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Quote with ID 999 not found');
    });

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/1',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Quote with ID 1 not found');
    });
  });
}); 