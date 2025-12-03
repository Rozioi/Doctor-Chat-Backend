import { FastifyReply, FastifyRequest } from "fastify";
import { userRepo } from "../../../repositories/userRepo";
import { User } from "../types/user.types";

interface TelegramData {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export interface LoginRequest {
  telegramData: TelegramData;
  phoneNumber: string;
}

export const userController = {
  async getUser(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = req.params;
    const user = await userRepo.getUserById(id);
    if (!user) return reply.status(404).send({ error: "User not found" });
    return reply.status(200).send(user);
  },
  async getUserByTelegramId(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const telegramId = req.params.id;

      if (!telegramId) {
        return reply.status(400).send({ error: "telegramId is required" });
      }

      const user = await userRepo.findByTelegramId(telegramId);

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply.status(200).send(user);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch user" });
    }
  },
  async createUser(
    req: FastifyRequest<{
      Body:
        | { user: User }
        | { telegramData: any; role: string; phoneNumber?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const body = req.body as any;

      // Поддерживаем оба формата: { user: ... } и { telegramData, role, phoneNumber }
      let userData: User;

      if (body.user) {
        // Старый формат: { user: User }
        userData = body.user;
      } else if (body.telegramData && body.telegramData.user) {
        // Новый формат: { telegramData, role, phoneNumber }
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
      } else {
        return reply.status(400).send({ error: "Invalid request body" });
      }

      // Проверяем, не существует ли уже пользователь с таким telegramId
      const existingUser = await userRepo.getUserByTelegramId(
        userData.telegramId,
      );
      if (existingUser) {
        return reply
          .status(409)
          .send({ error: "User with this Telegram ID already exists" });
      }

      const user = await userRepo.createUser(userData);
      return reply.status(201).send(user);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to create user",
      });
    }
  },

  async login(
    req: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply,
  ) {
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
      const user = await userRepo.getUserByTelegramId(telegramId);

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

      // Если всё совпало — успешный вход
      return reply.status(200).send({
        success: true,
        message: "Login successful",
        user,
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  },

  async updateUser(
    req: FastifyRequest<{
      Params: { telegramId: string };
      Body: {
        photoUrl?: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { telegramId } = req.params;
      const updateData = req.body;

      if (!telegramId) {
        return reply.status(400).send({ error: "telegramId is required" });
      }

      const user = await userRepo.updateUser(telegramId, updateData);
      return reply.status(200).send({
        success: true,
        user,
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to update user",
      });
    }
  },
  async deleteUser(
    req: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        return reply.status(400).send({ error: "id is required" });
      }

      const user = await userRepo.deleteUser(id);
      return reply.status(200).send({
        success: true,
        user,
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to delete user",
      });
    }
  },
};
