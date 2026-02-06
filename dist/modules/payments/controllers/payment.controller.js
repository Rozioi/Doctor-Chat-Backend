"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const balanceRepo_1 = require("../../../repositories/balanceRepo");
const paymentRepo_1 = require("../../../repositories/paymentRepo");
const userRepo_1 = require("../../../repositories/userRepo");
const client_1 = require("@prisma/client");
const robokassa_service_1 = require("../services/robokassa.service");
const chatRepo_1 = require("../../../repositories/chatRepo");
exports.PaymentController = {
    async getBalance(req, reply) {
        try {
            const telegramId = req.headers["x-telegram-user-id"] || req.query.telegramId;
            if (!telegramId) {
                return reply.status(401).send({ error: "User not authenticated" });
            }
            const balance = await balanceRepo_1.BalanceRepo.getBalanceByTelegramId(telegramId);
            if (!balance) {
                return reply.status(404).send({ error: "Balance not found" });
            }
            return reply.status(200).send({
                success: true,
                data: {
                    amount: Number(balance.amount),
                    userId: balance.userId,
                },
            });
        }
        catch (error) {
            console.error("Error getting balance:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to get balance",
            });
        }
    },
    async createPayment(req, reply) {
        try {
            const telegramId = req.headers["x-telegram-user-id"] || req.body.telegramId;
            if (!telegramId) {
                return reply.status(401).send({ error: "User not authenticated" });
            }
            const { amount, paymentMethod, chatId, description } = req.body;
            if (!amount || amount <= 0) {
                return reply.status(400).send({ error: "Invalid amount" });
            }
            const user = await userRepo_1.userRepo.getUserByTelegramId(telegramId);
            if (!user) {
                return reply.status(404).send({ error: "User not found" });
            }
            if (paymentMethod === client_1.PaymentMethod.BALANCE) {
                const balance = await balanceRepo_1.BalanceRepo.getBalanceByUserId(user.id);
                if (!balance) {
                    return reply.status(404).send({ error: "Balance not found" });
                }
                const currentAmount = Number(balance.amount);
                if (currentAmount < amount) {
                    return reply.status(400).send({
                        success: false,
                        error: "Insufficient balance",
                    });
                }
                await balanceRepo_1.BalanceRepo.subtractFromBalance(user.id, amount);
            }
            const payment = await paymentRepo_1.PaymentRepo.createPayment({
                userId: user.id,
                chatId,
                amount,
                paymentMethod,
                status: client_1.PaymentStatus.COMPLETED,
                description,
            });
            return reply.status(201).send({
                success: true,
                data: payment,
            });
        }
        catch (error) {
            console.error("Error creating payment:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to create payment",
            });
        }
    },
    async getPayments(req, reply) {
        try {
            const telegramId = req.headers["x-telegram-user-id"] || req.query.telegramId;
            if (!telegramId) {
                return reply.status(401).send({ error: "User not authenticated" });
            }
            const payments = await paymentRepo_1.PaymentRepo.getPaymentsByTelegramId(telegramId);
            return reply.status(200).send({
                success: true,
                data: payments.map((payment) => ({
                    id: payment.id,
                    amount: Number(payment.amount),
                    paymentMethod: payment.paymentMethod,
                    status: payment.status,
                    description: payment.description,
                    chatId: payment.chatId,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                })),
            });
        }
        catch (error) {
            console.error("Error getting payments:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to get payments",
            });
        }
    },
    async addToBalance(req, reply) {
        try {
            const telegramId = req.headers["x-telegram-user-id"] || req.body.telegramId;
            if (!telegramId) {
                return reply.status(401).send({ error: "User not authenticated" });
            }
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                return reply.status(400).send({ error: "Invalid amount" });
            }
            const user = await userRepo_1.userRepo.getUserByTelegramId(telegramId);
            if (!user) {
                return reply.status(404).send({ error: "User not found" });
            }
            const balance = await balanceRepo_1.BalanceRepo.addToBalance(user.id, amount);
            if (!balance) {
                return reply.status(500).send({ error: "Failed to update balance" });
            }
            await paymentRepo_1.PaymentRepo.createPayment({
                userId: user.id,
                amount,
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                status: client_1.PaymentStatus.COMPLETED,
                description: "Пополнение баланса",
            });
            return reply.status(200).send({
                success: true,
                data: {
                    amount: Number(balance.amount),
                    userId: balance.userId,
                },
            });
        }
        catch (error) {
            console.error("Error adding to balance:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to add to balance",
            });
        }
    },
    async initRobokassaPayment(req, reply) {
        try {
            const telegramId = req.headers["x-telegram-user-id"] || req.body.telegramId;
            if (!telegramId) {
                return reply.status(401).send({ error: "User not authenticated" });
            }
            const { doctorId, amount, serviceType, description } = req.body;
            if (!amount || amount <= 0) {
                return reply.status(400).send({ error: "Invalid amount" });
            }
            if (!doctorId) {
                return reply.status(400).send({ error: "Doctor ID is required" });
            }
            const user = await userRepo_1.userRepo.getUserByTelegramId(telegramId);
            if (!user) {
                return reply.status(404).send({ error: "User not found" });
            }
            const paymentData = {
                userId: user.id,
                amount,
                paymentMethod: "ROBOKASSA",
                status: client_1.PaymentStatus.PENDING,
                description: description || `Оплата ${serviceType}`,
            };
            const payment = await paymentRepo_1.PaymentRepo.createPayment(paymentData);
            const { platformAmount, doctorAmount } = robokassa_service_1.RobokassaService.calculateSplitAmounts(amount);
            const paymentUrl = robokassa_service_1.RobokassaService.generatePaymentUrl({
                orderId: payment.id,
                amount,
                description: description || `Оплата консультации врача #${doctorId}`,
                shp_doctorId: doctorId,
                shp_serviceType: serviceType,
                shp_userId: user.id,
            });
            await paymentRepo_1.PaymentRepo.updatePayment(payment.id, {
                robokassaInvoiceId: payment.id.toString(),
                splitAmount: platformAmount > 0 ? platformAmount : null,
            });
            return reply.status(200).send({
                success: true,
                data: {
                    paymentUrl,
                    invoiceId: payment.id.toString(),
                    amount,
                    platformAmount,
                    doctorAmount,
                },
            });
        }
        catch (error) {
            console.error("Error initializing Robokassa payment:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to initialize payment",
            });
        }
    },
    async robokassaResultCallback(req, reply) {
        try {
            const params = req.body;
            const isValid = robokassa_service_1.RobokassaService.verifyCallbackSignature(params);
            if (!isValid) {
                console.error("Invalid Robokassa signature:", params);
                return reply.status(400).send("Invalid signature");
            }
            const { InvId, OutSum } = params;
            const customParams = robokassa_service_1.RobokassaService.parseCustomParams(params);
            const payment = await paymentRepo_1.PaymentRepo.getPaymentById(parseInt(InvId, 10));
            if (!payment) {
                console.error("Payment not found:", InvId);
                return reply.status(404).send("Payment not found");
            }
            await paymentRepo_1.PaymentRepo.updatePayment(payment.id, {
                status: client_1.PaymentStatus.COMPLETED,
                robokassaSignature: params.SignatureValue,
                robokassaOutSum: OutSum,
            });
            if (customParams.doctorId && customParams.serviceType) {
                const existingChat = await chatRepo_1.ChatRepo.findActiveChat(payment.userId, customParams.doctorId, customParams.serviceType);
                if (!existingChat) {
                    await chatRepo_1.ChatRepo.createChat({
                        patientId: payment.userId,
                        doctorId: customParams.doctorId,
                        serviceType: customParams.serviceType,
                        amount: parseFloat(OutSum),
                    });
                }
            }
            return reply.status(200).send(`OK${InvId}`);
        }
        catch (error) {
            console.error("Error processing Robokassa callback:", error);
            return reply.status(500).send("Internal server error");
        }
    },
    async robokassaSuccess(req, reply) {
        try {
            const { InvId } = req.query;
            if (!InvId) {
                return reply.status(400).send({
                    success: false,
                    error: "Invoice ID is required",
                });
            }
            const payment = await paymentRepo_1.PaymentRepo.getPaymentById(parseInt(InvId, 10));
            if (!payment) {
                return reply.status(404).send({
                    success: false,
                    error: "Payment not found",
                });
            }
            return reply.status(200).send({
                success: true,
                data: {
                    paymentId: payment.id,
                    status: payment.status,
                    amount: Number(payment.amount),
                },
            });
        }
        catch (error) {
            console.error("Error handling Robokassa success:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to process success callback",
            });
        }
    },
    async robokassaFail(req, reply) {
        try {
            const { InvId } = req.query;
            if (InvId) {
                const payment = await paymentRepo_1.PaymentRepo.getPaymentById(parseInt(InvId, 10));
                if (payment && payment.status === client_1.PaymentStatus.PENDING) {
                    await paymentRepo_1.PaymentRepo.updatePayment(payment.id, {
                        status: client_1.PaymentStatus.FAILED,
                    });
                }
            }
            return reply.status(200).send({
                success: false,
                error: "Payment was cancelled or failed",
            });
        }
        catch (error) {
            console.error("Error handling Robokassa fail:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to process fail callback",
            });
        }
    },
    async checkRobokassaStatus(req, reply) {
        try {
            const { invoiceId } = req.params;
            const payment = await paymentRepo_1.PaymentRepo.getPaymentById(parseInt(invoiceId, 10));
            if (!payment) {
                return reply.status(404).send({
                    success: false,
                    error: "Payment not found",
                });
            }
            return reply.status(200).send({
                success: true,
                data: {
                    paymentId: payment.id,
                    status: payment.status,
                    amount: Number(payment.amount),
                    chatId: payment.chatId,
                },
            });
        }
        catch (error) {
            console.error("Error checking Robokassa status:", error);
            return reply.status(500).send({
                success: false,
                error: error.message || "Failed to check payment status",
            });
        }
    },
};
