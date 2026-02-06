"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceRepo = void 0;
const prisma_1 = require("../modules/common/prisma");
exports.BalanceRepo = {
    async getBalanceByUserId(userId) {
        try {
            let balance = await prisma_1.prisma.balance.findUnique({
                where: { userId },
                include: {
                    user: true,
                },
            });
            if (!balance) {
                balance = await prisma_1.prisma.balance.create({
                    data: {
                        userId,
                        amount: 0,
                    },
                    include: {
                        user: true,
                    },
                });
            }
            return balance;
        }
        catch (error) {
            throw new Error("Failed to get balance");
        }
    },
    async getBalanceByTelegramId(telegramId) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { telegramId },
            });
            if (!user) {
                return null;
            }
            return this.getBalanceByUserId(user.id);
        }
        catch (error) {
            throw new Error("Failed to get balance by telegram id");
        }
    },
    async updateBalance(userId, amount) {
        try {
            const balance = await prisma_1.prisma.balance.upsert({
                where: { userId },
                update: {
                    amount,
                },
                create: {
                    userId,
                    amount: typeof amount === "number" ? amount : amount,
                },
                include: {
                    user: true,
                },
            });
            return balance;
        }
        catch (error) {
            throw new Error("Failed to update balance");
        }
    },
    async addToBalance(userId, amount) {
        try {
            const currentBalance = await this.getBalanceByUserId(userId);
            const currentAmount = Number(currentBalance.amount);
            const addAmount = typeof amount === "number" ? amount : Number(amount);
            const newAmount = currentAmount + addAmount;
            return this.updateBalance(userId, newAmount);
        }
        catch (error) {
            throw new Error("Failed to add to balance");
        }
    },
    async subtractFromBalance(userId, amount) {
        try {
            const currentBalance = await this.getBalanceByUserId(userId);
            const currentAmount = Number(currentBalance.amount);
            const subtractAmount = typeof amount === "number" ? amount : Number(amount);
            if (currentAmount < subtractAmount) {
                throw new Error("Insufficient balance");
            }
            const newAmount = currentAmount - subtractAmount;
            return this.updateBalance(userId, newAmount);
        }
        catch (error) {
            throw new Error("Failed to subtract from balance");
        }
    },
};
