import { FastifyReply, FastifyRequest } from "fastify";
import { ChatRepo } from "../../../repositories/chatRepo";
import { userRepo } from "../../../repositories/userRepo";
import { DoctorRepo } from "../../../repositories/doctorRepo";
import { PaymentRepo } from "../../../repositories/paymentRepo";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

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

      const doctorProfile = await DoctorRepo.getDoctorById(doctorId);
      if (!doctorProfile || !doctorProfile.userId) {
        return reply.status(404).send({ error: "Doctor not found" });
      }

      const doctorUser = await userRepo.getUser(doctorProfile.userId);
      if (!doctorUser) {
        return reply.status(404).send({ error: "Doctor user not found" });
      }

      if (patient.id === doctorUser.id) {
        return reply.status(400).send({
          error: "Doctor cannot book appointment with themselves",
        });
      }

      const chat = await ChatRepo.createChat({
        patientId: patient.id,
        doctorId: doctorUser.id as number,
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
      const telegramId =
        (req.headers["x-telegram-user-id"] as string) || req.query.telegramId;

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
        patientId: number;
        doctorId: number;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { patientId, doctorId } = req.body;
      const chat = await ChatRepo.getChatByDoctorAndPatientId(
        doctorId,
        patientId,
      );
      if (chat) {
        return reply.status(404).send({
          error: "Chat for patient already exists ",
        });
      }

      if (!patientId) {
        return reply
          .status(400)
          .send({ error: "Patient patientId is required" });
      }

      if (!doctorId) {
        return reply.status(400).send({ error: "Doctor ID is required" });
      }

      const doctorProfile = await DoctorRepo.getDoctorById(doctorId);
      if (!doctorProfile || !doctorProfile.userId) {
        return reply.status(404).send({ error: "Doctor not found" });
      }

      const doctorUser = await userRepo.getUser(doctorProfile.userId);

      const patientUser = await userRepo.getUserById(patientId);

      if (
        !doctorUser ||
        !doctorUser.telegramId ||
        !patientUser ||
        !patientUser.telegramId
      ) {
        return reply.status(404).send({ error: "User not found" });
      }

      const bot = (await import("../../../bot/bot")).default;

      const doctorName =
        doctorUser.firstName && doctorUser.lastName
          ? `${doctorUser.firstName} ${doctorUser.lastName}`
          : doctorUser.firstName || doctorUser.username || "Врач";

      const { InlineKeyboard } = await import("grammy");
      const keyboardUser = new InlineKeyboard().url(
        "Перейти в чат с врачом",
        `tg://user?id=${doctorUser.telegramId}`,
      );
      const keyboardDoctor = new InlineKeyboard().url(
        "Перейти в чат с пациентом ",
        `tg://user?id=${patientUser.telegramId}`,
      );
      const patientName =
        patientUser.firstName && patientUser.lastName
          ? `${patientUser.firstName} ${patientUser.lastName}`
          : patientUser.firstName || patientUser.username || "Пациент";
      console.log(patientName, doctorName);
      await bot.api.sendMessage(
        doctorUser.telegramId, // No need to parse, already string
        `Пациент ${patientName} хочет начать чат с вами. Нажмите кнопку ниже, чтобы перейти в чат:`,
        {
          reply_markup: keyboardDoctor,
        },
      );

      await bot.api.sendMessage(
        patientUser.telegramId, // No need to parse, already string
        `Вы хотите начать чат с врачом ${doctorName}. Нажмите кнопку ниже, чтобы перейти в чат:`,
        {
          reply_markup: keyboardUser,
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
