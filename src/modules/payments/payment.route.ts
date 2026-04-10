import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import {
  createPaymentController,
  resultController,
  successController,
  failController,
  createKaspiPaymentController,
  kaspiWebhookController,
} from "./controllers/payment.controller";
import { PaymentRepo } from "../../repositories/paymentRepo";

export const paymentRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  const { freedomPayService, kaspiService } = _opts;

  fastify.post(
    "/api/v1/payment/create",
    createPaymentController(freedomPayService),
  );

  fastify.post("/api/v1/payment/result", resultController(freedomPayService));

  fastify.get("/api/v1/payment/success", successController);
  fastify.get("/api/v1/payment/fail", failController);

  // Каспи (ApiPay.kz)
  fastify.post(
    "/api/v1/payment/kaspi/create",
    createKaspiPaymentController(kaspiService),
  );

  fastify.post(
    "/api/v1/payment/kaspi/webhook",
    kaspiWebhookController(kaspiService),
  );

  // Ручной финал платежа с фронта (страница успешной оплаты)
  fastify.post("/api/v1/payment/finalize", async (request, reply) => {
    const { paymentId, status } = request.body as {
      paymentId?: number;
      status?: string;
    };

    if (!paymentId) {
      return reply.status(400).send({ error: "paymentId is required" });
    }

    try {
      const { finalizePayment } = await import(
        "./controllers/payment.controller"
      );
      await finalizePayment(paymentId, status || "success");
      return reply.send({ success: true });
    } catch (error: any) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ error: error.message || "Failed to finalize payment" });
    }
  });

  // Список платежей пользователя по telegramId
  fastify.get("/api/v1/payments", async (request, reply) => {
    try {
      const query = request.query as { telegramId?: string };
      const telegramId =
        (request.headers["x-telegram-user-id"] as string) ||
        query.telegramId;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const payments = await PaymentRepo.getPaymentsByTelegramId(telegramId);

      return reply.send({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to get payments",
      });
    }
  });

  // Получить статус платежа по ID
  fastify.get("/api/v1/payment/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const paymentId = parseInt(id, 10);

    if (Number.isNaN(paymentId)) {
      return reply.status(400).send({ error: "Invalid payment id" });
    }

    try {
      const payment = await PaymentRepo.getPaymentById(paymentId);
      if (!payment) {
        return reply.status(404).send({ error: "Payment not found" });
      }

      return reply.send({
        success: true,
        status: payment.status,
        chatId: payment.chatId,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ error: error.message || "Failed to get payment status" });
    }
  });

  done();
};
