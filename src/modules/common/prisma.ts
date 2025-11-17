import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to PostgreSQL");
  } catch (err) {
    console.error("❌ Prisma connection error:", err);
    process.exit(1);
  }
}
