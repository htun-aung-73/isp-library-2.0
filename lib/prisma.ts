import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: pg.Pool | undefined;
};

const connectionString = process.env.DATABASE_URL;

// Reuse pool to prevent connection leaks
if (!globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({ connectionString });
}

const pool = globalForPrisma.pool;
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Export pool so it can be closed if needed (e.g. in seeding)
export { pool };
