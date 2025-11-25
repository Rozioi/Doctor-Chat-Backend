import { prisma } from "../modules/common/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const BalanceRepo = {
  async getBalanceByUserId(userId: number) {
    try {
      let balance = await prisma.balance.findUnique({
        where: { userId },
        include: {
          user: true,
        },
      });

      // Если баланса нет, создаем его с нулевым значением
      if (!balance) {
        balance = await prisma.balance.create({
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
    } catch (error) {
      throw new Error("Failed to get balance");
    }
  },

  async getBalanceByTelegramId(telegramId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        return null;
      }

      return this.getBalanceByUserId(user.id);
    } catch (error) {
      throw new Error("Failed to get balance by telegram id");
    }
  },

  async updateBalance(userId: number, amount: number | Decimal) {
    try {
      // Используем upsert для создания баланса, если его нет
      const balance = await prisma.balance.upsert({
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
    } catch (error) {
      throw new Error("Failed to update balance");
    }
  },

  async addToBalance(userId: number, amount: number | Decimal) {
    try {
      const currentBalance = await this.getBalanceByUserId(userId);
      const currentAmount = Number(currentBalance.amount);
      const addAmount = typeof amount === "number" ? amount : Number(amount);
      const newAmount = currentAmount + addAmount;

      return this.updateBalance(userId, newAmount);
    } catch (error) {
      throw new Error("Failed to add to balance");
    }
  },

  async subtractFromBalance(userId: number, amount: number | Decimal) {
    try {
      const currentBalance = await this.getBalanceByUserId(userId);
      const currentAmount = Number(currentBalance.amount);
      const subtractAmount = typeof amount === "number" ? amount : Number(amount);

      if (currentAmount < subtractAmount) {
        throw new Error("Insufficient balance");
      }

      const newAmount = currentAmount - subtractAmount;
      return this.updateBalance(userId, newAmount);
    } catch (error) {
      throw new Error("Failed to subtract from balance");
    }
  },
};

