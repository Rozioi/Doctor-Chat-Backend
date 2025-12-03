import { FastifyReply, FastifyRequest } from "fastify";
import { ReviewRepo } from "../../../repositories/reviewRepo";
import { userRepo } from "../../../repositories/userRepo";
import { DoctorRepo } from "../../../repositories/doctorRepo";
import { ChatRepo } from "../../../repositories/chatRepo";

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
        return reply.status(401).send({ error: "User not authenticated" });
      }

      if (!rating || rating < 1 || rating > 5) {
        return reply.status(400).send({
          error: "Rating must be between 1 and 5",
        });
      }

      const patient = await userRepo.getUserByTelegramId(telegramId);
      if (!patient || !patient.id) {
        return reply.status(404).send({ error: "Patient not found" });
      }

      const doctorProfile = await DoctorRepo.getDoctorById(doctorProfileId);
      if (!doctorProfile || !doctorProfile.userId) {
        return reply.status(404).send({ error: "Doctor not found" });
      }

      const doctorUser = await userRepo.getUser(doctorProfile.userId);
      if (!doctorUser) {
        return reply.status(404).send({ error: "Doctor user not found" });
      }

      // Проверяем, что пациент не может оставить отзыв самому себе
      if (patient.id === doctorUser.id) {
        return reply.status(400).send({
          error: "Cannot review yourself",
        });
      }

      // Проверяем, что чат существует и принадлежит пациенту (если указан)
      if (chatId) {
        const chat = await ChatRepo.getChatByDoctorAndPatientId(
          doctorUser.id,
          patient.id,
        );
        if (!chat || chat.id !== chatId) {
          return reply.status(404).send({ error: "Chat not found" });
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
          error: "Review already exists for this doctor/chat",
        });
      }

      const review = await ReviewRepo.createReview({
        patientId: patient.id,
        doctorId: doctorUser.id,
        doctorProfileId,
        chatId,
        rating,
        comment,
      });

      return reply.status(201).send(review);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
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
        return reply.status(400).send({ error: "Invalid doctor profile ID" });
      }

      const reviews = await ReviewRepo.getReviewsByDoctorProfileId(
        doctorProfileId,
      );
      return reply.status(200).send(reviews);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
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
        return reply.status(400).send({ error: "Invalid chat ID" });
      }

      const review = await ReviewRepo.getReviewByChatId(chatId);
      if (!review) {
        return reply.status(404).send({ error: "Review not found" });
      }

      return reply.status(200).send(review);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to get review",
      });
    }
  },
};

