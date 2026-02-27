import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import { BalanceController } from "./balance.controller";

export const balanceRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  fastify.get("/balance", BalanceController.getBalance);
  fastify.post("/balance/add", BalanceController.addToBalance);

  done();
};

