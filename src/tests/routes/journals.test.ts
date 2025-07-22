import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import journalsRoutes from '../../routes/journals.js';
import { 
  getMockPrisma, 
  resetMockPrisma,
  createMockUser, 
  createMockJournal,
  setupTestApp, 
  expectErrorResponse, 
  expectSuccessResponse 
} from '../utils/test-utils.js';

describe('Journals Routes', () => {
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
    await app.register(journalsRoutes);
    await app.ready();
  });

  describe('GET /users/:userId/journals', () => {
    it('should return user journals with pagination', async () => {
      const mockJournals = [
        createMockJournal({ id: 'journal1', title: 'Day 1' }),
        createMockJournal({ id: 'journal2', title: 'Day 2' }),
      ];

      mockPrisma.journal.findMany.mockResolvedValue(mockJournals);
      mockPrisma.journal.count.mockResolvedValue(10);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals?limit=2&offset=0',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.journals).toHaveLength(2);
      expect(payload.pagination.total).toBe(10);
      expect(payload.pagination.limit).toBe(2);
      expect(payload.pagination.offset).toBe(0);
      expect(payload.pagination.hasMore).toBe(true);
    });

    it('should use default pagination when not provided', async () => {
      const mockJournals = [createMockJournal()];
      mockPrisma.journal.findMany.mockResolvedValue(mockJournals);
      mockPrisma.journal.count.mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.pagination.limit).toBe(10);
      expect(payload.pagination.offset).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.journal.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals',
      });

      expectErrorResponse(response, 500, 'Failed to fetch journals');
    });
  });

  describe('GET /users/:userId/journals/dates', () => {
    it('should return journal dates in ascending order', async () => {
      const mockEntries = [
        { createdAt: new Date('2024-01-01T10:00:00Z') },
        { createdAt: new Date('2024-01-02T10:00:00Z') },
        { createdAt: new Date('2024-01-03T10:00:00Z') },
      ];

      mockPrisma.journal.findMany.mockResolvedValue(mockEntries);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals/dates',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
    });

    it('should handle empty journal dates', async () => {
      mockPrisma.journal.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals/dates',
      });

      const payload = expectSuccessResponse(response);
      expect(payload).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.journal.findMany.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals/dates',
      });

      expectErrorResponse(response, 500, 'Failed to fetch journal dates');
    });
  });

  describe('GET /users/:userId/journals/date/:date', () => {
    it('should return journal for specific date', async () => {
      const mockJournal = createMockJournal({ title: 'Specific Day' });
      mockPrisma.journal.findFirst.mockResolvedValue(mockJournal);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals/date/2024-01-01',
      });

      const payload = expectSuccessResponse(response);
      expect(payload.title).toBe('Specific Day');
    });

    it('should return 404 when journal not found for date', async () => {
      mockPrisma.journal.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals/date/2024-01-01',
      });

      expectErrorResponse(response, 404, 'Journal not found for this date');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.journal.findFirst.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/users/user123/journals/date/2024-01-01',
      });

      expectErrorResponse(response, 500, 'Failed to fetch journal for date');
    });
  });

  describe('POST /journals', () => {
    it('should create a new journal entry successfully', async () => {
      const journalData = {
        userId: 'user123',
        title: 'New Journal Entry',
        sleepHours: 8,
        studyHours: 4,
        activeHours: 2,
        stress: 3,
        wentWell: 'Had a great workout',
        notWell: 'Felt tired in class',
        goals: 'Improve sleep schedule',
        screenTime: 3,
      };

      const createdJournal = createMockJournal(journalData);
      mockPrisma.journal.create.mockResolvedValue(createdJournal);

      const response = await app.inject({
        method: 'POST',
        url: '/journals',
        payload: journalData,
      });

      const payload = expectSuccessResponse(response, 201);
      expect(payload).toEqual(createdJournal);
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        authorID: 'user123',
        title: 'New Journal Entry',
        // Missing required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: '/journals',
        payload: incompleteData,
      });

      expectErrorResponse(response, 400, 'Create journal body validation failed: Required');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.journal.create.mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/journals',
        payload: {
          userId: 'user123',
          title: 'Test Journal',
        },
      });

      expectErrorResponse(response, 500, 'Failed to create journal');
    });
  });
}); 