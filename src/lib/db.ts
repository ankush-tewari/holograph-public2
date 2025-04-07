// /src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { debugLog } from '@/utils/debug';


debugLog("🌐 NODE_ENV:", process.env.NODE_ENV);
debugLog("🌐 DATABASE_URL at runtime:", process.env.DATABASE_URL);

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  if (process.env.NODE_ENV === 'development') {
    debugLog("🔌 Prisma Client initialized in development mode");
  } else {
    debugLog("🔌 Prisma Client initialized in production mode");
  }
}