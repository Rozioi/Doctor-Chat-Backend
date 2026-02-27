import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import {
  createPaymentController,
  resultController,
  successController,
  failController,
} from "./controllers/payment.controller";
import { PaymentRepo } from "../../repositories/paymentRepo";

export const paymentRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  const { freedomPayService } = _opts;

  fastify.post(
    "/api/v1/payment/create",
    createPaymentController(freedomPayService),
  );

  fastify.post("/api/v1/payment/result", resultController(freedomPayService));

  fastify.get("/api/v1/payment/success", successController);
  fastify.get("/api/v1/payment/fail", failController);

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

  done();
};
