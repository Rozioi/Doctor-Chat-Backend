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
  done();
};
