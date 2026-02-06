import { prisma } from "../modules/common/prisma";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export interface CreatePaymentData {
  userId: number;
  chatId?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status?: PaymentStatus;
  description?: string;
}

export const PaymentRepo = {
  async createPayment(data: CreatePaymentData) {
    try {
      const payment = await prisma.payment.create({
        data: {
          userId: data.userId,
          chatId: data.chatId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          status: data.status || PaymentStatus.PENDING,
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
    } catch (error) {
      throw new Error("Failed to create payment");
    }
  },

  async getPaymentById(id: number) {
    try {
      const payment = await prisma.payment.findUnique({
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
    } catch (error) {
      throw new Error("Failed to get payment");
    }
  },

  async getPaymentsByUserId(userId: number) {
    try {
      const payments = await prisma.payment.findMany({
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
    } catch (error) {
      throw new Error("Failed to get payments");
    }
  },

  async getPaymentsByTelegramId(telegramId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        return [];
      }

      return this.getPaymentsByUserId(user.id);
    } catch (error) {
      throw new Error("Failed to get payments by telegram id");
    }
  },

  async updatePaymentStatus(id: number, status: PaymentStatus) {
    try {
      const payment = await prisma.payment.update({
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
    } catch (error) {
      throw new Error("Failed to update payment status");
    }
  },

  async updatePayment(id: number, data: any) {
    try {
      const payment = await prisma.payment.update({
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
    } catch (error) {
      throw new Error("Failed to update payment");
    }
  },

  async getPaymentsByChatId(chatId: number) {
    try {
      const payments = await prisma.payment.findMany({
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
    } catch (error) {
      throw new Error("Failed to get payments by chat id");
    }
  },
};

