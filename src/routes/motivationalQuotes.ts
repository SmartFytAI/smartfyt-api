import fs from 'fs';
import path from 'path';

import { FastifyInstance } from 'fastify';

import log from '../utils/logger.js';

interface MotivationalQuote {
  id: number;
  quote: string;
  author: string;
  category: string;
}

interface QuotesResponse {
  success: boolean;
  data?: MotivationalQuote | MotivationalQuote[];
  error?: string;
}

// Load quotes from JSON file
function loadQuotes(): MotivationalQuote[] {
  try {
    const quotesPath = path.join(process.cwd(), 'data/motivational-quotes.json');
    log.info('📖 Loading motivational quotes from:', { path: quotesPath });

    const quotesData = fs.readFileSync(quotesPath, 'utf8');
    const quotes = JSON.parse(quotesData);

    log.info('✅ Successfully loaded motivational quotes:', {
      count: quotes.length,
      firstQuote: quotes[0]?.quote?.substring(0, 50) + '...'
    });

    return quotes;
  } catch (error) {
    log.error('❌ Error loading motivational quotes:', { error });
    return [];
  }
}

export default async function motivationalQuotesRoutes(fastify: FastifyInstance) {
  // Get daily quote (based on current date)
  fastify.get('/daily', async (request): Promise<QuotesResponse> => {
    log.info('📖 Daily quote request received:', {
      url: request.url,
      method: request.method,
      headers: request.headers,
      timestamp: new Date().toISOString()
    });

    try {
      const quotes = loadQuotes();
      if (quotes.length === 0) {
        log.warn('⚠️ No quotes available for daily request');
        return {
          success: false,
          error: 'No quotes available',
        };
      }

      // Get a random quote instead of date-based
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const dailyQuote = quotes[randomIndex];

      log.info('✅ Random daily quote selected:', {
        randomIndex,
        quoteId: dailyQuote.id,
        author: dailyQuote.author,
        category: dailyQuote.category
      });

      return {
        success: true,
        data: dailyQuote,
      };
    } catch (error) {
      log.error('❌ Error getting daily quote:', { error });
      return {
        success: false,
        error: 'Failed to retrieve daily quote',
      };
    }
  });

  // Get random quote
  fastify.get('/random', async (): Promise<QuotesResponse> => {
    try {
      const quotes = loadQuotes();
      if (quotes.length === 0) {
        return {
          success: false,
          error: 'No quotes available',
        };
      }

      const randomIndex = Math.floor(Math.random() * quotes.length);
      const randomQuote = quotes[randomIndex];

      return {
        success: true,
        data: randomQuote,
      };
    } catch (error) {
      log.error('Error getting random quote:', error);
      return {
        success: false,
        error: 'Failed to retrieve random quote',
      };
    }
  });

  // Get all quotes
  fastify.get('/all', async (): Promise<QuotesResponse> => {
    try {
      const quotes = loadQuotes();
      if (quotes.length === 0) {
        return {
          success: false,
          error: 'No quotes available',
        };
      }

      return {
        success: true,
        data: quotes,
      };
    } catch (error) {
      log.error('Error getting all quotes:', error);
      return {
        success: false,
        error: 'Failed to retrieve quotes',
      };
    }
  });

  // Get quotes by category
  fastify.get<{
    Querystring: { category?: string };
  }>('/category', async (request): Promise<QuotesResponse> => {
    try {
      const { category } = request.query;
      const quotes = loadQuotes();

      if (!category) {
        return {
          success: false,
          error: 'Category parameter is required',
        };
      }

      const filteredQuotes = quotes.filter(
        (quote) => quote.category.toLowerCase() === category.toLowerCase()
      );

      if (filteredQuotes.length === 0) {
        return {
          success: false,
          error: `No quotes found for category: ${category}`,
        };
      }

      return {
        success: true,
        data: filteredQuotes,
      };
    } catch (error) {
      log.error('Error getting quotes by category:', error);
      return {
        success: false,
        error: 'Failed to retrieve quotes by category',
      };
    }
  });

  // Get available categories
  fastify.get('/categories', async () => {
    try {
      const quotes = loadQuotes();
      const categories = [...new Set(quotes.map((quote) => quote.category))];

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      log.error('Error getting categories:', error);
      return {
        success: false,
        error: 'Failed to retrieve categories',
      };
    }
  });

  // Get quote by ID
  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request): Promise<QuotesResponse> => {
    try {
      const { id } = request.params;
      const quotes = loadQuotes();

      const quote = quotes.find((q) => q.id === parseInt(id));

      if (!quote) {
        return {
          success: false,
          error: `Quote with ID ${id} not found`,
        };
      }

      return {
        success: true,
        data: quote,
      };
    } catch (error) {
      log.error('Error getting quote by ID:', error);
      return {
        success: false,
        error: 'Failed to retrieve quote',
      };
    }
  });
}
