import { FastifyReply, FastifyRequest } from "fastify";
import { BalanceRepo } from "../../repositories/balanceRepo";
import { prisma } from "../common/prisma";

export const BalanceController = {
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

      const user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      if (user.role !== "DOCTOR") {
        return reply
          .status(403)
          .send({ error: "Balance is available only for doctors" });
      }

      const balance = await BalanceRepo.getBalanceByUserId(user.id);

      return reply.send({
        success: true,
        data: {
          userId: balance.userId,
          amount: balance.amount,
        },
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to get balance",
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
      const { amount, telegramId: bodyTelegramId } = req.body;
      const telegramId =
        bodyTelegramId || (req.headers["x-telegram-user-id"] as string);

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      if (!amount || amount <= 0) {
        return reply.status(400).send({ error: "Invalid amount" });
      }

      const user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      if (user.role !== "DOCTOR") {
        return reply
          .status(403)
          .send({ error: "Only doctors can have a balance" });
      }

      const balance = await BalanceRepo.addToBalance(user.id, amount);

      return reply.send({
        success: true,
        data: {
          userId: balance.userId,
          amount: balance.amount,
        },
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to add to balance",
      });
    }
  },
};

