import { prisma } from "../modules/common/prisma";

export const ReviewRepo = {
  async createReview(data: {
    patientId: number;
    doctorId: number;
    doctorProfileId: number;
    chatId?: number;
    rating: number;
    comment?: string;
  }) {
    try {
      const review = await prisma.review.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          doctorProfileId: data.doctorProfileId,
          chatId: data.chatId,
          rating: data.rating,
          comment: data.comment,
        },
        include: {
          patient: true,
          doctor: true,
          doctorProfile: true,
        },
      });

      // Обновляем рейтинг врача
      await this.updateDoctorRating(data.doctorProfileId);

      return review;
    } catch (error) {
      throw new Error("Failed to create review");
    }
  },

  async getReviewsByDoctorProfileId(doctorProfileId: number) {
    try {
      const reviews = await prisma.review.findMany({
        where: { doctorProfileId },
        include: {
          patient: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return reviews;
    } catch (error) {
      throw new Error("Failed to get reviews");
    }
  },

  async getReviewByChatId(chatId: number) {
    try {
      const review = await prisma.review.findUnique({
        where: { chatId },
        include: {
          patient: true,
          doctor: true,
        },
      });
      return review;
    } catch (error) {
      throw new Error("Failed to get review");
    }
  },

  async updateDoctorRating(doctorProfileId: number) {
    try {
      const reviews = await prisma.review.findMany({
        where: { doctorProfileId },
        select: { rating: true },
      });

      if (reviews.length === 0) return;

      const averageRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length;

      await prisma.doctorProfile.update({
        where: { id: doctorProfileId },
        data: { rating: averageRating },
      });
    } catch (error) {
      console.error("Failed to update doctor rating:", error);
    }
  },

  async hasPatientReviewedDoctor(
    patientId: number,
    doctorProfileId: number,
    chatId?: number,
  ) {
    try {
      const review = await prisma.review.findFirst({
        where: {
          patientId,
          doctorProfileId,
          ...(chatId ? { chatId } : {}),
        },
      });
      return !!review;
    } catch (error) {
      throw new Error("Failed to check review");
    }
  },
};

