"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRepo = void 0;
const prisma_1 = require("../modules/common/prisma");
exports.ReviewRepo = {
    async createReview(data) {
        try {
            const review = await prisma_1.prisma.review.create({
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
            await this.updateDoctorRating(data.doctorProfileId);
            return review;
        }
        catch (error) {
            throw new Error("Failed to create review");
        }
    },
    async getReviewsByDoctorProfileId(doctorProfileId) {
        try {
            const reviews = await prisma_1.prisma.review.findMany({
                where: { doctorProfileId },
                include: {
                    patient: true,
                },
                orderBy: { createdAt: "desc" },
            });
            return reviews;
        }
        catch (error) {
            throw new Error("Failed to get reviews");
        }
    },
    async getReviewByChatId(chatId) {
        try {
            const review = await prisma_1.prisma.review.findFirst({
                where: { chatId },
            });
            return review;
        }
        catch (error) {
            throw new Error("Failed to get review");
        }
    },
    async updateDoctorRating(doctorProfileId) {
        try {
            const reviews = await prisma_1.prisma.review.findMany({
                where: { doctorProfileId },
                select: { rating: true },
            });
            if (reviews.length === 0)
                return;
            const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) /
                reviews.length;
            await prisma_1.prisma.doctorProfile.update({
                where: { id: doctorProfileId },
                data: { rating: averageRating },
            });
        }
        catch (error) {
            console.error("Failed to update doctor rating:", error);
        }
    },
    async hasPatientReviewedDoctor(patientId, doctorProfileId, chatId) {
        try {
            const review = await prisma_1.prisma.review.findFirst({
                where: {
                    patientId,
                    doctorProfileId,
                    ...(chatId ? { chatId } : {}),
                },
            });
            return !!review;
        }
        catch (error) {
            throw new Error("Failed to check review");
        }
    },
};
