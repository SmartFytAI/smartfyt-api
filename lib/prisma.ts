import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  console.log('Initializing Prisma client...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('Direct URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');

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
    console.log('Successfully connected to the database');
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
  });

export { prisma };

// Default export for backward compatibility with route imports
export default { prisma };
