import { PrismaClient } from '@prisma/client';
import log from '../src/utils/logger.js';

const prismaClientSingleton = () => {
  log.info('Initializing Prisma client...');
  log.info('Database URL:', { configured: !!process.env.DATABASE_URL });
  log.info('Direct URL:', { configured: !!process.env.DIRECT_URL });

  return new PrismaClient({
    log: ['error', 'warn', 'query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Test the connection
prisma
  .$connect()
  .then(() => {
    log.info('Successfully connected to the database');
  })
  .catch((error) => {
    log.error('Failed to connect to the database', error);
  });

export { prisma };

// Default export for backward compatibility with route imports
export default { prisma };
