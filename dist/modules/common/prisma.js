"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectPrisma = connectPrisma;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ["query", "info", "warn", "error"],
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
async function connectPrisma() {
    try {
        await exports.prisma.$connect();
        console.log("✅ Prisma connected to PostgreSQL");
    }
    catch (err) {
        console.error("❌ Prisma connection error:", err);
        process.exit(1);
    }
}
