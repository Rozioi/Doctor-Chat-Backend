"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = void 0;
const chat_controller_1 = require("./controllers/chat.controller");
const chatRoutes = (fastify, _opts, done) => {
    fastify.post("/chats", chat_controller_1.ChatController.createChat);
    fastify.get("/chats", chat_controller_1.ChatController.getChats);
    fastify.post("/chats/invite", chat_controller_1.ChatController.sendChatInvite);
    done();
};
exports.chatRoutes = chatRoutes;
