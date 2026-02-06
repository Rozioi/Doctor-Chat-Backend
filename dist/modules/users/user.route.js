"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const user_contorller_1 = require("./controllers/user.contorller");
const userRoutes = (fastify, _opts, done) => {
    fastify.get("/users/:id", user_contorller_1.userController.getUser);
    fastify.get("/users/check/:id", user_contorller_1.userController.getUserByTelegramId);
    fastify.post("/users", user_contorller_1.userController.createUser);
    fastify.post("/users/login", user_contorller_1.userController.login);
    fastify.delete("/users/:id", user_contorller_1.userController.deleteUser);
    fastify.put("/users/:telegramId", user_contorller_1.userController.updateUser);
    done();
};
exports.userRoutes = userRoutes;
