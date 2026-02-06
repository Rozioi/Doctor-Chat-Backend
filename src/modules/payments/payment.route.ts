import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import { PaymentController } from "./controllers/payment.controller";

export const paymentRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  fastify.get("/balance", PaymentController.getBalance);
  fastify.post("/balance/add", PaymentController.addToBalance);
  fastify.post("/payments", PaymentController.createPayment);
  fastify.get("/payments", PaymentController.getPayments);

  // Robokassa routes
  fastify.post("/payments/robokassa/init", PaymentController.initRobokassaPayment);
  fastify.post("/payments/robokassa/result", PaymentController.robokassaResultCallback);
  fastify.get("/payments/robokassa/success", PaymentController.robokassaSuccess);
  fastify.get("/payments/robokassa/fail", PaymentController.robokassaFail);
  fastify.get("/payments/robokassa/status/:invoiceId", PaymentController.checkRobokassaStatus);
  done();
};
