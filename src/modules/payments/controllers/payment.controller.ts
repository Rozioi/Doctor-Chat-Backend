import { FastifyReply, FastifyRequest } from "fastify";
import { BalanceRepo } from "../../../repositories/balanceRepo";
import { PaymentRepo } from "../../../repositories/paymentRepo";
import { userRepo } from "../../../repositories/userRepo";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export const PaymentController = {
  async getBalance(
    req: FastifyRequest<{
      Querystring: {
        telegramId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const telegramId =
        (req.headers["x-telegram-user-id"] as string) || req.query.telegramId;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const balance = await BalanceRepo.getBalanceByTelegramId(telegramId);

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
    } catch (error: any) {
      console.error("Error getting balance:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to get balance",
      });
    }
  },

  async createPayment(
    req: FastifyRequest<{
      Body: {
        amount: number;
        paymentMethod: PaymentMethod;
        chatId?: number;
        description?: string;
        telegramId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const telegramId =
        (req.headers["x-telegram-user-id"] as string) || req.body.telegramId;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const { amount, paymentMethod, chatId, description } = req.body;

      if (!amount || amount <= 0) {
        return reply.status(400).send({ error: "Invalid amount" });
      }

      const user = await userRepo.getUserByTelegramId(telegramId);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      if (paymentMethod === PaymentMethod.BALANCE) {
        const balance = await BalanceRepo.getBalanceByUserId(user.id);
        const currentAmount = Number(balance.amount);

        if (currentAmount < amount) {
          return reply.status(400).send({
            success: false,
            error: "Insufficient balance",
          });
        }

        await BalanceRepo.subtractFromBalance(user.id, amount);
      }

      const payment = await PaymentRepo.createPayment({
        userId: user.id,
        chatId,
        amount,
        paymentMethod,
        status: PaymentStatus.COMPLETED,
        description,
      });

      return reply.status(201).send({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to create payment",
      });
    }
  },

  async getPayments(
    req: FastifyRequest<{
      Querystring: {
        telegramId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const telegramId =
        (req.headers["x-telegram-user-id"] as string) || req.query.telegramId;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const payments = await PaymentRepo.getPaymentsByTelegramId(telegramId);

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
    } catch (error: any) {
      console.error("Error getting payments:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to get payments",
      });
    }
  },

  async addToBalance(
    req: FastifyRequest<{
      Body: {
        amount: number;
        telegramId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const telegramId =
        (req.headers["x-telegram-user-id"] as string) || req.body.telegramId;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return reply.status(400).send({ error: "Invalid amount" });
      }

      const user = await userRepo.getUserByTelegramId(telegramId);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const balance = await BalanceRepo.addToBalance(user.id, amount);

      await PaymentRepo.createPayment({
        userId: user.id,
        amount,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.COMPLETED,
        description: "Пополнение баланса",
      });

      return reply.status(200).send({
        success: true,
        data: {
          amount: Number(balance.amount),
          userId: balance.userId,
        },
      });
    } catch (error: any) {
      console.error("Error adding to balance:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to add to balance",
      });
    }
  },
};
