import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import { ChatController } from "./controllers/chat.controller";

export const chatRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  fastify.post("/chats", ChatController.createChat);
  fastify.get("/chats", ChatController.getChats);
  fastify.post("/chats/invite", ChatController.sendChatInvite);
  done();
};

