import pino from 'pino';

// Create logger instance with appropriate configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'smartfyt-api',
    version: '1.0.0',
  },
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// Enhanced logging functions with context
export const log = {
  debug: (message: string, context?: any) => {
    logger.debug({ ...context }, message);
  },
  
  info: (message: string, context?: any) => {
    logger.info({ ...context }, message);
  },
  
  warn: (message: string, context?: any) => {
    logger.warn({ ...context }, message);
  },
  
  error: (message: string, error?: Error | unknown, context?: any) => {
    if (error instanceof Error) {
      logger.error({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      }, message);
    } else {
      logger.error({ error, ...context }, message);
    }
  },

  // Authentication specific logging
  auth: {
    success: (userId: string, context?: any) => {
      logger.info({ userId, ...context }, 'User authenticated successfully');
    },
    
    failure: (reason: string, context?: any) => {
      logger.warn({ reason, ...context }, 'Authentication failed');
    },
    
    tokenValidation: (success: boolean, context?: any) => {
      if (success) {
        logger.debug({ ...context }, 'JWT token validated successfully');
      } else {
        logger.warn({ ...context }, 'JWT token validation failed');
      }
    },
  },

  // API request logging
  request: {
    start: (method: string, url: string, context?: any) => {
      logger.info({ method, url, ...context }, 'API request started');
    },
    
    complete: (method: string, url: string, statusCode: number, duration: number, context?: any) => {
      const level = statusCode >= 400 ? 'warn' : 'info';
      logger[level]({ 
        method, 
        url, 
        statusCode, 
        duration,
        ...context 
      }, `API request completed in ${duration}ms`);
    },

    error: (method: string, url: string, error: Error, context?: any) => {
      logger.error({
        method,
        url,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      }, 'API request failed');
    },
  },

  // Database operation logging
  database: {
    query: (operation: string, table: string, duration?: number, context?: any) => {
      logger.debug({ 
        operation, 
        table, 
        duration,
        ...context 
      }, `Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`);
    },
    
    error: (operation: string, table: string, error: Error, context?: any) => {
      logger.error({
        operation,
        table,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      }, `Database ${operation} failed on ${table}`);
    },
  },
};

// Export the raw logger for advanced use cases
export { logger };

export default log; 