"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const userRepo_1 = require("../../../repositories/userRepo");
exports.userController = {
    async getUser(req, reply) {
        const { id } = req.params;
        const user = await userRepo_1.userRepo.getUserById(id);
        if (!user)
            return reply.status(404).send({ error: "User not found" });
        return reply.status(200).send(user);
    },
    async getUserByTelegramId(req, reply) {
        try {
            const telegramId = req.params.id;
            if (!telegramId) {
                return reply.status(400).send({ error: "telegramId is required" });
            }
            const user = await userRepo_1.userRepo.findByTelegramId(telegramId);
            if (!user) {
                return reply.status(404).send({ error: "User not found" });
            }
            return reply.status(200).send(user);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch user" });
        }
    },
    async createUser(req, reply) {
        try {
            const body = req.body;
            let userData;
            if (body.user) {
                userData = body.user;
            }
            else if (body.telegramData && body.telegramData.user) {
                const telegramUser = body.telegramData.user;
                userData = {
                    telegramId: String(telegramUser.id),
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    photoUrl: telegramUser.photo_url,
                    phoneNumber: body.phoneNumber,
                    role: body.role || "PATIENT",
                    createdAt: new Date(),
                };
            }
            else {
                return reply.status(400).send({ error: "Invalid request body" });
            }
            const existingUser = await userRepo_1.userRepo.getUserByTelegramId(userData.telegramId);
            if (existingUser) {
                return reply
                    .status(409)
                    .send({ error: "User with this Telegram ID already exists" });
            }
            const user = await userRepo_1.userRepo.createUser(userData);
            return reply.status(201).send(user);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to create user",
            });
        }
    },
    async login(req, reply) {
        try {
            const { telegramData, phoneNumber } = req.body;
            if (!telegramData || !telegramData.id) {
                return reply.status(400).send({
                    error: "Telegram data is required",
                });
            }
            if (!phoneNumber) {
                return reply.status(400).send({
                    error: "Phone number is required",
                });
            }
            const telegramId = String(telegramData.id);
            const user = await userRepo_1.userRepo.getUserByTelegramId(telegramId);
            if (!user) {
                return reply.status(404).send({
                    error: "User not found",
                });
            }
            const isSameTelegramData = user.telegramId === telegramId;
            const isSamePhoneNumber = user.phoneNumber === phoneNumber;
            console.log(isSamePhoneNumber, isSameTelegramData);
            if (!isSameTelegramData || !isSamePhoneNumber) {
                return reply.status(403).send({
                    error: "Telegram data does not match",
                });
            }
            return reply.status(200).send({
                success: true,
                message: "Login successful",
                user,
            });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: "Internal server error",
            });
        }
    },
    async updateUser(req, reply) {
        try {
            const { telegramId } = req.params;
            const updateData = req.body;
            if (!telegramId) {
                return reply.status(400).send({ error: "telegramId is required" });
            }
            const user = await userRepo_1.userRepo.updateUser(telegramId, updateData);
            return reply.status(200).send({
                success: true,
                user,
            });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to update user",
            });
        }
    },
    async deleteUser(req, reply) {
        try {
            const { id } = req.params;
            if (!id) {
                return reply.status(400).send({ error: "id is required" });
            }
            const user = await userRepo_1.userRepo.deleteUser(id);
            return reply.status(200).send({
                success: true,
                user,
            });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to delete user",
            });
        }
    },
};
