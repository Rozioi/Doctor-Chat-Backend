import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import { userController } from "./controllers/user.contorller";

export const userRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  fastify.get("/users/:id", userController.getUser);
  fastify.get("/users/check/:id", userController.getUserByTelegramId);
  fastify.post("/users", userController.createUser);
  fastify.post("/users/login", userController.login);
  fastify.delete("/users/:id", userController.deleteUser);
  fastify.put("/users/:telegramId", userController.updateUser);
  done();
};
