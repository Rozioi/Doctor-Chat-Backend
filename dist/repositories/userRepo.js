"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepo = void 0;
const prisma_1 = require("../modules/common/prisma");
exports.userRepo = {
    async getUserById(id) {
        const userId = typeof id === "string" ? parseInt(id) : id;
        if (isNaN(userId))
            return null;
        return prisma_1.prisma.user.findUnique({ where: { id: userId } });
    },
    async createUser(data) {
        return prisma_1.prisma.user.create({ data });
    },
    async findByTelegramId(telegramId) {
        return prisma_1.prisma.user.findUnique({ where: { telegramId } });
    },
    async getUserByTelegramId(telegramId) {
        return prisma_1.prisma.user.findUnique({ where: { telegramId } });
    },
    async deleteUser(id) {
        try {
            const userId = parseInt(id);
            if (isNaN(userId)) {
                throw new Error("Invalid user ID");
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return null;
            }
            await prisma_1.prisma.$transaction(async (tx) => {
                const deleteOperations = [
                    () => tx.chat.deleteMany({
                        where: {
                            OR: [{ patientId: userId }, { doctorId: userId }],
                        },
                    }),
                    () => tx.payment.deleteMany({ where: { userId } }),
                    () => tx.doctorProfile.deleteMany({ where: { userId } }),
                    () => tx.balance.deleteMany({ where: { userId } }),
                ];
                for (const operation of deleteOperations) {
                    try {
                        await operation();
                    }
                    catch (error) {
                        if (!error.message?.includes("does not exist")) {
                            console.warn("Error in delete operation:", error.message);
                        }
                    }
                }
                await tx.user.delete({
                    where: { id: userId },
                });
            });
            return user;
        }
        catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },
    async updateUser(telegramId, data) {
        return prisma_1.prisma.user.update({
            where: { telegramId },
            data,
        });
    },
    async getUser(id) {
        return prisma_1.prisma.user.findUnique({ where: { id } });
    },
};
