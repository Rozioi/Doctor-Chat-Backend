"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepo = void 0;
const prisma_1 = require("../modules/common/prisma");
const client_1 = require("@prisma/client");
exports.PaymentRepo = {
    async createPayment(data) {
        try {
            const payment = await prisma_1.prisma.payment.create({
                data: {
                    userId: data.userId,
                    chatId: data.chatId,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                    status: data.status || client_1.PaymentStatus.PENDING,
                    description: data.description,
                },
                include: {
                    user: true,
                    chat: {
                        include: {
                            patient: true,
                            doctor: {
                                include: {
                                    doctorProfile: true,
                                },
                            },
                        },
                    },
                },
            });
            return payment;
        }
        catch (error) {
            throw new Error("Failed to create payment");
        }
    },
    async getPaymentById(id) {
        try {
            const payment = await prisma_1.prisma.payment.findUnique({
                where: { id },
                include: {
                    user: true,
                    chat: {
                        include: {
                            patient: true,
                            doctor: {
                                include: {
                                    doctorProfile: true,
                                },
                            },
                        },
                    },
                },
            });
            return payment;
        }
        catch (error) {
            throw new Error("Failed to get payment");
        }
    },
    async getPaymentsByUserId(userId) {
        try {
            const payments = await prisma_1.prisma.payment.findMany({
                where: { userId },
                include: {
                    user: true,
                    chat: {
                        include: {
                            patient: true,
                            doctor: {
                                include: {
                                    doctorProfile: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            return payments;
        }
        catch (error) {
            throw new Error("Failed to get payments");
        }
    },
    async getPaymentsByTelegramId(telegramId) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { telegramId },
            });
            if (!user) {
                return [];
            }
            return this.getPaymentsByUserId(user.id);
        }
        catch (error) {
            throw new Error("Failed to get payments by telegram id");
        }
    },
    async updatePaymentStatus(id, status) {
        try {
            const payment = await prisma_1.prisma.payment.update({
                where: { id },
                data: { status },
                include: {
                    user: true,
                    chat: {
                        include: {
                            patient: true,
                            doctor: {
                                include: {
                                    doctorProfile: true,
                                },
                            },
                        },
                    },
                },
            });
            return payment;
        }
        catch (error) {
            throw new Error("Failed to update payment status");
        }
    },
    async updatePayment(id, data) {
        try {
            const payment = await prisma_1.prisma.payment.update({
                where: { id },
                data,
                include: {
                    user: true,
                    chat: {
                        include: {
                            patient: true,
                            doctor: {
                                include: {
                                    doctorProfile: true,
                                },
                            },
                        },
                    },
                },
            });
            return payment;
        }
        catch (error) {
            throw new Error("Failed to update payment");
        }
    },
    async getPaymentsByChatId(chatId) {
        try {
            const payments = await prisma_1.prisma.payment.findMany({
                where: { chatId },
                include: {
                    user: true,
                    chat: {
                        include: {
                            patient: true,
                            doctor: {
                                include: {
                                    doctorProfile: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            return payments;
        }
        catch (error) {
            throw new Error("Failed to get payments by chat id");
        }
    },
};
