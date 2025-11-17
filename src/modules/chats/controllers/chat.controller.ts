import { FastifyReply, FastifyRequest } from "fastify";
import { ChatRepo } from "../../../repositories/chatRepo";
import { userRepo } from "../../../repositories/userRepo";
import { DoctorRepo } from "../../../repositories/doctorRepo";

export const ChatController = {
  async createChat(
    req: FastifyRequest<{
      Body: {
        doctorId: number;
        serviceType: string;
        amount: number;
        telegramId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { doctorId, serviceType, amount, telegramId } = req.body;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const patient = await userRepo.getUserByTelegramId(telegramId);
      if (!patient || !patient.id) {
        return reply.status(404).send({ error: "Patient not found" });
      }

      // Проверяем существование врача по ID профиля
      const doctorProfile = await DoctorRepo.getDoctorById(doctorId);
      if (!doctorProfile || !doctorProfile.userId) {
        return reply.status(404).send({ error: "Doctor not found" });
      }

      // Получаем пользователя-врача
      const doctorUser = await userRepo.getUser(doctorProfile.userId);
      if (!doctorUser) {
        return reply.status(404).send({ error: "Doctor user not found" });
      }

      const chat = await ChatRepo.createChat({
        patientId: patient.id,
        doctorId: doctorUser.id,
        serviceType,
        amount,
      });

      return reply.status(201).send(chat);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to create chat",
      });
    }
  },

  async getChats(
    req: FastifyRequest<{
      Querystring: {
        telegramId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const telegramId = (req.headers["x-telegram-user-id"] as string) ||
        req.query.telegramId;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const user = await userRepo.getUserByTelegramId(telegramId);
      if (!user || !user.id) {
        return reply.status(404).send({ error: "User not found" });
      }

      let chats;
      if (user.role === "DOCTOR") {
        chats = await ChatRepo.getChatsByDoctorId(user.id);
      } else {
        chats = await ChatRepo.getChatsByPatientId(user.id);
      }

      return reply.status(200).send(chats);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to get chats",
      });
    }
  },

  async sendChatInvite(
    req: FastifyRequest<{
      Body: {
        patientTelegramId: string;
        doctorId: number;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { patientTelegramId, doctorId } = req.body;

      if (!patientTelegramId) {
        return reply.status(400).send({ error: "Patient telegramId is required" });
      }

      if (!doctorId) {
        return reply.status(400).send({ error: "Doctor ID is required" });
      }

      // Получаем данные врача
      const doctorProfile = await DoctorRepo.getDoctorById(doctorId);
      if (!doctorProfile || !doctorProfile.userId) {
        return reply.status(404).send({ error: "Doctor not found" });
      }

      const doctorUser = await userRepo.getUser(doctorProfile.userId);
      if (!doctorUser || !doctorUser.telegramId) {
        return reply.status(404).send({ error: "Doctor user not found" });
      }

      // Импортируем бота
      const bot = (await import("../../../bot/bot")).default;

      // Формируем имя врача
      const doctorName = 
        doctorUser.firstName && doctorUser.lastName
          ? `${doctorUser.firstName} ${doctorUser.lastName}`
          : doctorUser.firstName || doctorUser.username || "Врач";

      // Создаем кнопку для перехода в чат с врачом
      // Используем tg://user?id= для прямого перехода в чат с пользователем по его ID
      const { InlineKeyboard } = await import("grammy");
      const keyboard = new InlineKeyboard().url(
        "Перейти в чат с врачом",
        `tg://user?id=${doctorUser.telegramId}`,
      );

      // Отправляем сообщение пользователю
      await bot.api.sendMessage(
        parseInt(patientTelegramId),
        `Вы хотите начать чат с врачом ${doctorName}. Нажмите кнопку ниже, чтобы перейти в чат:`,
        {
          reply_markup: keyboard,
        },
      );

      return reply.status(200).send({
        success: true,
        message: "Chat invite sent successfully",
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to send chat invite",
      });
    }
  },
};

