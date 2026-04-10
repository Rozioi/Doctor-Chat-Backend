import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreatePaymentDto,
  FreedomPayResult,
} from "../../types/freedompay.types";
import { PaymentRepo } from "../../../repositories/paymentRepo";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../../common/prisma";
import bot from "../../../bot/bot";
import { InlineKeyboard } from "grammy";
import { ChatRepo } from "../../../repositories/chatRepo";
import { DoctorRepo } from "../../../repositories/doctorRepo";
import { userRepo } from "../../../repositories/userRepo";

export const finalizePayment = async (
  paymentId: number,
  paymentStatus: string | undefined,
) => {
  const payment = await PaymentRepo.getPaymentById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  const normalizedStatus = (paymentStatus || "").toLowerCase();
  const isSuccess = ["success", "ok", "completed", "paid"].includes(
    normalizedStatus,
  );

  if (!payment.chatId && isSuccess) {
    if (!payment.doctorId) {
      throw new Error("Doctor not specified for payment");
    }

    const serviceType =
      (payment as any).serviceType === "analysis"
        ? "analysis"
        : "consultation";

    // Защита от двойного создания чата при повторных колбэках/запросах
    const existingChat = await ChatRepo.findActiveChat(
      payment.userId,
      payment.doctorId,
      serviceType,
    );

    // existingChat возвращается из ChatRepo без include,
    // поэтому, если он есть, достаём его ещё раз с relations
    const chat =
      existingChat &&
      (await prisma.chat.findUnique({
        where: { id: existingChat.id },
        include: { patient: true, doctor: true },
      })) ||
      (await prisma.chat.create({
        data: {
          patientId: payment.userId,
          doctorId: payment.doctorId,
          serviceType,
          amount: payment.amount,
          status: "ACTIVE",
        },
        include: {
          patient: true,
          doctor: true,
        },
      }));

    await PaymentRepo.updatePayment(paymentId, {
      status: PaymentStatus.COMPLETED,
      chatId: chat.id,
    });

    // Уведомления отправляем только при создании нового чата,
    // а не при повторных колбэках
    if (!existingChat && chat) {
      const serviceLabel =
        serviceType === "analysis" ? "расшифровку анализов" : "консультацию";

      const description = (payment.description || "").toLowerCase();
      const tariffLabel = description.includes("vip")
        ? "тариф VIP"
        : "тариф Стандарт";

      if (chat.doctor.telegramId) {
        await bot.api.sendMessage(
          chat.doctor.telegramId,
          `🆕 Новый оплаченный запрос на ${serviceLabel} (${tariffLabel}) от пациента ${chat.patient.username || chat.patient.firstName || "Пациент"
          }. Нажмите кнопку ниже, чтобы открыть чат с пациентом.`,
          {
            reply_markup: new InlineKeyboard().url(
              "Открыть диалог в Telegram",
              `tg://user?id=${chat.patient.telegramId}`,
            ),
          },
        );
      }

      if (chat.patient.telegramId && chat.doctor.telegramId) {
        await bot.api.sendMessage(
          chat.patient.telegramId,
          `✅ Оплата получена! Ваш доступ к MED EXPERT открыт.\n\n` +
          `Ваш врач: ${chat.doctor.firstName ||
          chat.doctor.username ||
          "Врач-консультант"
          }.\n` +
          `Нажмите кнопку ниже, чтобы написать врачу.`,
          {
            reply_markup: new InlineKeyboard().url(
              "Открыть чат с врачом",
              `tg://user?id=${chat.doctor.telegramId}`,
            ),
          },
        );
      }
    }
  } else {
    await PaymentRepo.updatePayment(paymentId, {
      status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
    });
  }
};

export const createPaymentController =
  (freedomPayService: any) =>
    async (
      request: FastifyRequest<{ Body: CreatePaymentDto }>,
      reply: FastifyReply,
    ) => {
      try {
        const { amount, doctorId, serviceType, tariffType, telegramId } =
          request.body;

        if (!telegramId) {
          return reply.status(400).send({ error: "telegramId is required" });
        }

        if (!doctorId) {
          return reply.status(400).send({ error: "doctorId is required" });
        }

        const user = await userRepo.getUserByTelegramId(telegramId);

        if (!user || !user.id) {
          return reply.status(404).send({ error: "User not found" });
        }

        const doctorProfile = await DoctorRepo.getDoctorById(doctorId);

        if (!doctorProfile || !doctorProfile.userId) {
          return reply.status(404).send({ error: "Doctor not found" });
        }

        const doctorUserId = doctorProfile.userId;

        const paymentRecord = await PaymentRepo.createPayment({
          userId: user.id,
          doctorId: doctorUserId,
          amount: Number(amount),
          paymentMethod: PaymentMethod.FREEDOMPAY,
          description:
            tariffType === "VIP"
              ? "VIP Tariff Consultation (FreedomPay)"
              : "Standard Tariff Consultation (FreedomPay)",
          serviceType: serviceType === "analysis" ? "analysis" : "consultation",
        });

        const gatewayPayment = await freedomPayService.createPayment({
          amount: Number(paymentRecord.amount),
          orderId: paymentRecord.id.toString(),
        });

        const updatedPayment = await PaymentRepo.updatePayment(paymentRecord.id, {
          status: PaymentStatus.PENDING,
          freedompayPaymentId: gatewayPayment.pg_payment_id?.toString(),
          freedompayOrderId: gatewayPayment.pg_order_id?.toString(),
          freedompayRedirectUrl: gatewayPayment.pg_redirect_url,
        });

        return reply.send({
          success: true,
          paymentId: updatedPayment.id,
          redirectUrl: updatedPayment.freedompayRedirectUrl,
          provider: "FREEDOMPAY",
          raw: gatewayPayment,
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          error: error.message || "Failed to create payment",
        });
      }
    };

export const resultController =
  (freedomPayService: any) =>
    async (
      request: FastifyRequest<{ Body: FreedomPayResult }>,
      reply: FastifyReply,
    ) => {
      try {
        const body = { ...request.body };

        const isValid = freedomPayService.validateResult(body);

        if (!isValid) {
          if (process.env.NODE_ENV === "production") {
            return reply.status(400).send("Invalid signature");
          }
          // В не-prod окружении не блокируем создание чата, только логируем
          request.log.error(
            { body },
            "FreedomPay result: invalid signature (non-production mode)",
          );
        }

        const paymentId = parseInt(body.pg_order_id, 10);

        if (Number.isNaN(paymentId)) {
          return reply.status(400).send("Invalid order id");
        }

        await finalizePayment(paymentId, body.pg_payment_status);

        return reply.send("OK");
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          error: error.message || "Failed to process payment result",
        });
      }
    };

export const successController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const query = request.query as any;
    const paymentId = query.pg_order_id
      ? parseInt(query.pg_order_id, 10)
      : undefined;

    if (paymentId && !Number.isNaN(paymentId)) {
      try {
        await finalizePayment(paymentId, query.pg_payment_status || "success");
      } catch (e) {
        request.log.error(e);
      }
    }

    return reply.send({ status: "Payment successful" });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: error.message || "Failed to handle payment success",
    });
  }
};

export const failController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const query = request.query as any;
    const paymentId = query.pg_order_id
      ? parseInt(query.pg_order_id, 10)
      : undefined;

    if (paymentId && !Number.isNaN(paymentId)) {
      try {
        await finalizePayment(paymentId, "failed");
      } catch (e) {
        request.log.error(e);
      }
    }

    return reply.send({ status: "Payment failed" });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: error.message || "Failed to handle payment fail",
    });
  }
};

export const createKaspiPaymentController =
  (kaspiService: any) =>
    async (
      request: FastifyRequest<{
        Body: {
          amount: number;
          doctorId: number;
          serviceType: string;
          tariffType: string;
          telegramId: string;
          phoneNumber: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const {
          // amount,
          doctorId,
          serviceType,
          tariffType,
          telegramId,
          phoneNumber,
        } = request.body;
        const amount = kaspiService.config.itemPrice;
        if (!telegramId) {
          return reply.status(400).send({ error: "telegramId is required" });
        }

        if (!doctorId) {
          return reply.status(400).send({ error: "doctorId is required" });
        }

        if (!phoneNumber) {
          return reply.status(400).send({ error: "phoneNumber is required" });
        }

        const user = await userRepo.getUserByTelegramId(telegramId);

        if (!user || !user.id) {
          return reply.status(404).send({ error: "User not found" });
        }

        const doctorProfile = await DoctorRepo.getDoctorById(doctorId);

        if (!doctorProfile || !doctorProfile.userId) {
          return reply.status(404).send({ error: "Doctor not found" });
        }

        const doctorUserId = doctorProfile.userId;

        // Create local payment record
        const paymentRecord = await PaymentRepo.createPayment({
          userId: user.id,
          doctorId: doctorUserId,
          amount: Number(amount),
          paymentMethod: PaymentMethod.KASPI,
          description: `${tariffType === "VIP" ? "VIP" : "Standard"} Tariff Consultation (Kaspi/ApiPay)`,
          serviceType: serviceType === "analysis" ? "analysis" : "consultation",
          kaspiPhone: phoneNumber,
        } as any);

        // Create invoice in ApiPay.kz
        const kaspiInvoice = await kaspiService.createInvoice({
          amount: Number(paymentRecord.amount),
          phoneNumber: phoneNumber,
          externalOrderId: paymentRecord.id.toString(),
          description: paymentRecord.description || "Консультация врача",
        });

        // Update payment with Kaspi info
        const updatedPayment = await PaymentRepo.updatePayment(paymentRecord.id, {
          status: PaymentStatus.PENDING,
          kaspiInvoiceId: kaspiInvoice.id.toString(),
          kaspiExternalId: kaspiInvoice.kaspi_invoice_id,
        } as any);

        return reply.send({
          success: true,
          paymentId: updatedPayment.id,
          kaspiInvoiceId: updatedPayment.kaspiInvoiceId,
          provider: "KASPI",
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          error: error.message || "Failed to create Kaspi payment",
        });
      }
    };

export const kaspiWebhookController =
  (kaspiService: any) => async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const signature = request.headers["x-webhook-signature"] as string;
      const body = request.body as any;
      const rawBody = JSON.stringify(body);

      const isValid = kaspiService.verifySignature(rawBody, signature);

      if (!isValid && process.env.NODE_ENV === "production") {
        return reply.status(400).send({ error: "Invalid signature" });
      }

      if (body.event === "invoice.status_changed") {
        const { invoice } = body;
        const paymentId = parseInt(invoice.external_order_id, 10);

        if (!Number.isNaN(paymentId)) {
          await finalizePayment(paymentId, invoice.status);
        }
      }

      return reply.status(200).send({ success: true });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: error.message || "Webhook processing failed",
      });
    }
  };
