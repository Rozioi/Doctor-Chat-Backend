import { FastifyReply, FastifyRequest } from "fastify";
import { ReviewRepo } from "../../../repositories/reviewRepo";
import { userRepo } from "../../../repositories/userRepo";
import { DoctorRepo } from "../../../repositories/doctorRepo";
import { prisma } from "../../common/prisma";

export const ReviewController = {
  async createReview(
    req: FastifyRequest<{
      Body: {
        doctorProfileId: number;
        chatId?: number;
        rating: number;
        comment?: string;
        telegramId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { doctorProfileId, chatId, rating, comment, telegramId } = req.body;

      if (!telegramId) {
        return reply
          .status(401)
          .send({ success: false, error: "User not authenticated" });
      }

      if (!rating || rating < 1 || rating > 5) {
        return reply.status(400).send({
          success: false,
          error: "Rating must be between 1 and 5",
        });
      }

      const patient = await userRepo.getUserByTelegramId(telegramId);
      if (!patient || !patient.id) {
        return reply
          .status(404)
          .send({ success: false, error: "Patient not found" });
      }

      const doctorProfile = await DoctorRepo.getDoctorById(doctorProfileId);
      if (!doctorProfile || !doctorProfile.userId) {
        return reply
          .status(404)
          .send({ success: false, error: "Doctor not found" });
      }

      const doctorUser = await userRepo.getUser(doctorProfile.userId);
      if (!doctorUser) {
        return reply
          .status(404)
          .send({ success: false, error: "Doctor user not found" });
      }

      // Проверяем, что пациент не может оставить отзыв самому себе
      if (patient.id === doctorUser.id) {
        return reply.status(400).send({
          success: false,
          error: "Cannot review yourself",
        });
      }

      // Проверяем, что чат существует и принадлежит пациенту (если указан)
      if (chatId) {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
        });

        if (
          !chat ||
          chat.patientId !== patient.id ||
          chat.doctorId !== doctorUser.id
        ) {
          return reply
            .status(404)
            .send({ success: false, error: "Chat not found" });
        }
      }

      // Проверяем, не оставлял ли уже пациент отзыв
      const hasReviewed = await ReviewRepo.hasPatientReviewedDoctor(
        patient.id,
        doctorProfileId,
        chatId,
      );
      if (hasReviewed) {
        return reply.status(400).send({
          success: false,
          error: "Review already exists for this doctor/chat",
        });
      }

      const review = await ReviewRepo.createReview({
        patientId: patient.id,
        doctorId: doctorUser.id as number,
        doctorProfileId,
        chatId,
        rating,
        comment,
      });

      return reply.status(201).send({
        success: true,
        data: review,
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to create review",
      });
    }
  },

  async getReviewsByDoctor(
    req: FastifyRequest<{ Params: { doctorProfileId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const doctorProfileId = parseInt(req.params.doctorProfileId);
      if (isNaN(doctorProfileId)) {
        return reply
          .status(400)
          .send({ success: false, error: "Invalid doctor profile ID" });
      }

      const reviews =
        await ReviewRepo.getReviewsByDoctorProfileId(doctorProfileId);
      return reply.status(200).send({
        success: true,
        data: reviews,
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to get reviews",
      });
    }
  },

  async getReviewByChat(
    req: FastifyRequest<{ Params: { chatId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return reply
          .status(400)
          .send({ success: false, error: "Invalid chat ID" });
      }

      const review = await ReviewRepo.getReviewByChatId(chatId);

      // Для удобства фронта: success=true даже если отзыва нет
      return reply.status(200).send({
        success: true,
        data: review || null,
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to get review",
      });
    }
  },
};
