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

  async completeChat(
    req: FastifyRequest<{
      Params: {
        chatId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const chatId = parseInt(req.params.chatId, 10);
      const telegramId = req.headers["x-telegram-user-id"] as string;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      const user = await userRepo.getUserByTelegramId(telegramId);
      if (!user || user.role !== "DOCTOR") {
        return reply
          .status(403)
          .send({ error: "Only doctors can complete consultations" });
      }

      const chat = await ChatRepo.completeChat(chatId);

      // Automated Bot Notifications
      const { default: bot, clearActiveChat } = await import("../../../bot/bot");
      const { InlineKeyboard } = await import("grammy");

      // Clear active chats in bot
      if (chat.patient && chat.patient.telegramId) {
        await clearActiveChat(chat.patient.telegramId);
      }
      if (chat.doctor && chat.doctor.telegramId) {
        await clearActiveChat(chat.doctor.telegramId);
      }

      if (chat.tariffType === "VIP") {
        // Notification for VIP Patient
        await bot.api.sendMessage(
          chat.patient.telegramId,
          "Ваша VIP консультация завершена. Мы готовы к следующему этапу — визиту в партнерскую клинику.",
          {
            reply_markup: new InlineKeyboard().url(
              "Записаться к врачу-партнеру",
              "https://t.me/m/ZEH5m-TsMTMy", // Replace with real coordinator link
            ),
          },
        );

        // Notification for Coordinator
        // NOTE: In a real app, you'd fetch the coordinator's telegramId from config/DB
        // For now, we mock it or send it to an admin channel if available.
        console.log(
          `[VIP NOTIFICATION] New VIP Case: Patient ${chat.patient.username}, Doctor ${chat.doctor.username}`,
        );
      } else {
        // Notification for Standard Patient
        await bot.api.sendMessage(
          chat.patient.telegramId,
          "Ваша консультация завершена. Если у вас остались вопросы, вы можете связаться с нашим координатором.",
          {
            reply_markup: new InlineKeyboard().url(
              "Связаться с координатором",
              "https://t.me/m/ZEH5m-TsMTMy", // Replace with real coordinator link
            ),
          },
        );
      }

      return reply.status(200).send({ success: true, data: chat });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to complete chat",
      });
    }
  },
  async createQuestionnaire(
    req: FastifyRequest<{
      Body: {
        orderId: number;
        fullName: string;
        birthDate: string | null;
        location: string;
        mainRequest: string;
        history: string;
        currentTherapy: string;
        allergies: string;
        fileUrls?: string[];
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        orderId,
        fullName,
        birthDate,
        location,
        mainRequest,
        history,
        currentTherapy,
        allergies,
        fileUrls,
      } = req.body;
      const telegramId = req.headers["x-telegram-user-id"] as string;

      if (!telegramId) {
        return reply.status(401).send({ error: "User not authenticated" });
      }

      if (!orderId) {
        return reply.status(400).send({ error: "Order ID is required" });
      }

      const payment = await PaymentRepo.getPaymentById(orderId);
      if (!payment || !payment.doctorId || !payment.userId) {
        return reply
          .status(404)
          .send({ error: "Payment, doctor or user not found" });
      }

      let chat;
      if (payment.chatId) {
        chat = payment.chat;
      }

      if (!chat) {
        chat = await ChatRepo.createChat({
          patientId: payment.userId,
          doctorId: payment.doctorId,
          serviceType: payment.serviceType || "consultation",
          amount: Number(payment.amount),
        });

        await PaymentRepo.updatePayment(payment.id, { chatId: chat.id });
      }

      const bot = (await import("../../../bot/bot")).default;
      const { InlineKeyboard, InputFile } = await import("grammy");
      const path = await import("path");

      const doctorUser =
        payment.chat?.doctor || (await userRepo.getUserById(payment.doctorId));

      if (doctorUser && doctorUser.telegramId) {
        const questionnaireInfo =
          `📋 *Новая анкета пациента*\n\n` +
          `*ФИО:* ${fullName}\n` +
          `*Дата рождения:* ${birthDate || "Не указана"}\n` +
          `*Локация:* ${location}\n\n` +
          `*Основной запрос:*\n${mainRequest}\n\n` +
          `*Предыстория:*\n${history || "Нет"}\n\n` +
          `*Текущая терапия:*\n${currentTherapy || "Нет"}\n\n` +
          `*Аллергии:*\n${allergies || "Нет"}`;

        const botUsername = bot.botInfo?.username || "MedExpert_test_bot";
        const keyboard = new InlineKeyboard().url(
          "💬 Начать чат с пациентом",
          `https://t.me/${botUsername}?start=chat_${chat.id}`,
        );

        await bot.api.sendMessage(doctorUser.telegramId, questionnaireInfo, {
          parse_mode: "Markdown",
          reply_markup: keyboard,
        });

        if (fileUrls && fileUrls.length > 0) {
          const uploadsDir = path.join(process.cwd(), "uploads");
          for (const url of fileUrls) {
            try {
              let fileInput: any = url;

              // If it's a local URL, use the local file path for Telegram
              if (url.includes("/uploads/")) {
                const fileName = url.split("/uploads/").pop();
                if (fileName) {
                  const filePath = path.join(uploadsDir, fileName);
                  fileInput = new InputFile(filePath);
                }
              }

              if (url.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) {
                await bot.api.sendPhoto(doctorUser.telegramId, fileInput);
              } else {
                await bot.api.sendDocument(doctorUser.telegramId, fileInput);
              }
            } catch (err: any) {
              req.log.error({ err }, `Failed to send file ${url} to doctor`);
            }
          }
        }
      }

      return reply.status(200).send({ success: true, data: chat });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to submit questionnaire",
      });
    }
  },
};
