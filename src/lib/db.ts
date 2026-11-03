import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient({ transactionOptions: { maxWait: 10000, timeout: 15000 }, adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 10, connectionTimeoutMillis: 10000 }) });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
