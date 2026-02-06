import { FastifyReply, FastifyRequest } from "fastify";
import { BalanceRepo } from "../../../repositories/balanceRepo";
import { PaymentRepo } from "../../../repositories/paymentRepo";
import { userRepo } from "../../../repositories/userRepo";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { RobokassaService } from "../services/robokassa.service";
import { ChatRepo } from "../../../repositories/chatRepo";

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
        const balance = await BalanceRepo.getBalanceByUserId(user.id as number);
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

        await BalanceRepo.subtractFromBalance(user.id as number, amount);
      }

      const payment = await PaymentRepo.createPayment({
        userId: user.id as number,
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

      const balance = await BalanceRepo.addToBalance(user.id as number, amount);
      if (!balance) {
        return reply.status(500).send({ error: "Failed to update balance" });
      }

      await PaymentRepo.createPayment({
        userId: user.id as number,
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

  // Robokassa payment endpoints
  async initRobokassaPayment(
    req: FastifyRequest<{
      Body: {
        doctorId: number;
        amount: number;
        serviceType: string;
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

      const { doctorId, amount, serviceType, description } = req.body;

      if (!amount || amount <= 0) {
        return reply.status(400).send({ error: "Invalid amount" });
      }

      if (!doctorId) {
        return reply.status(400).send({ error: "Doctor ID is required" });
      }

      const user = await userRepo.getUserByTelegramId(telegramId);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      // Create pending payment record
      const paymentData = {
        userId: user.id as number,
        amount,
        paymentMethod: "ROBOKASSA" as PaymentMethod,
        status: PaymentStatus.PENDING,
        description: description || `Оплата ${serviceType}`,
      };
      const payment = await PaymentRepo.createPayment(paymentData);

      // Calculate split amounts if enabled
      const { platformAmount, doctorAmount } =
        RobokassaService.calculateSplitAmounts(amount);

      // Generate Robokassa payment URL
      const paymentUrl = RobokassaService.generatePaymentUrl({
        orderId: payment.id,
        amount,
        description: description || `Оплата консультации врача #${doctorId}`,
        shp_doctorId: doctorId,
        shp_serviceType: serviceType,
        shp_userId: user.id,
      });

      // Update payment with Robokassa invoice ID
      await PaymentRepo.updatePayment(payment.id, {
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
    } catch (error: any) {
      console.error("Error initializing Robokassa payment:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to initialize payment",
      });
    }
  },

  async robokassaResultCallback(
    req: FastifyRequest<{
      Body: {
        OutSum: string;
        InvId: string;
        SignatureValue: string;
        shp_doctorId?: string;
        shp_serviceType?: string;
        shp_userId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const params = req.body;

      // Verify signature
      const isValid = RobokassaService.verifyCallbackSignature(params);

      if (!isValid) {
        console.error("Invalid Robokassa signature:", params);
        return reply.status(400).send("Invalid signature");
      }

      const { InvId, OutSum } = params;
      const customParams = RobokassaService.parseCustomParams(params);

      // Find payment by invoice ID
      const payment = await PaymentRepo.getPaymentById(parseInt(InvId, 10));

      if (!payment) {
        console.error("Payment not found:", InvId);
        return reply.status(404).send("Payment not found");
      }

      // Update payment status
      await PaymentRepo.updatePayment(payment.id, {
        status: PaymentStatus.COMPLETED,
        robokassaSignature: params.SignatureValue,
        robokassaOutSum: OutSum,
      });

      // Create chat if doctor and service type are provided
      if (customParams.doctorId && customParams.serviceType) {
        const existingChat = await ChatRepo.findActiveChat(
          payment.userId,
          customParams.doctorId,
          customParams.serviceType,
        );

        if (!existingChat) {
          await ChatRepo.createChat({
            patientId: payment.userId,
            doctorId: customParams.doctorId,
            serviceType: customParams.serviceType,
            amount: parseFloat(OutSum),
          });
        }
      }

      // Robokassa expects "OK" + invoice ID
      return reply.status(200).send(`OK${InvId}`);
    } catch (error: any) {
      console.error("Error processing Robokassa callback:", error);
      return reply.status(500).send("Internal server error");
    }
  },

  async robokassaSuccess(
    req: FastifyRequest<{
      Querystring: {
        InvId?: string;
        OutSum?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { InvId } = req.query;

      if (!InvId) {
        return reply.status(400).send({
          success: false,
          error: "Invoice ID is required",
        });
      }

      const payment = await PaymentRepo.getPaymentById(parseInt(InvId, 10));

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
    } catch (error: any) {
      console.error("Error handling Robokassa success:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to process success callback",
      });
    }
  },

  async robokassaFail(
    req: FastifyRequest<{
      Querystring: {
        InvId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { InvId } = req.query;

      if (InvId) {
        const payment = await PaymentRepo.getPaymentById(parseInt(InvId, 10));

        if (payment && payment.status === PaymentStatus.PENDING) {
          await PaymentRepo.updatePayment(payment.id, {
            status: PaymentStatus.FAILED,
          });
        }
      }

      return reply.status(200).send({
        success: false,
        error: "Payment was cancelled or failed",
      });
    } catch (error: any) {
      console.error("Error handling Robokassa fail:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to process fail callback",
      });
    }
  },

  async checkRobokassaStatus(
    req: FastifyRequest<{
      Params: {
        invoiceId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { invoiceId } = req.params;

      const payment = await PaymentRepo.getPaymentById(parseInt(invoiceId, 10));

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
    } catch (error: any) {
      console.error("Error checking Robokassa status:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to check payment status",
      });
    }
  },
};
