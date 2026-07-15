import { PrismaClient } from "@prisma/client"

// Reuse a single PrismaClient across hot-reloads in dev; without this, each
// file edit would open a new DB connection until the pool is exhausted.
const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
