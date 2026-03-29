// Prisma Client Singleton
import { PrismaClient } from "@prisma/client";

// This pattern allows Prisma Client to persist across hot module reloads in development
// Without this, each hot reload would create a new Prisma Client instance, exhausting database connections
// See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// In development, store the client in a global variable to prevent multiple instances
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
