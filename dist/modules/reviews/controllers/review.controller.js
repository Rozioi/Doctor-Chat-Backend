"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const reviewRepo_1 = require("../../../repositories/reviewRepo");
const userRepo_1 = require("../../../repositories/userRepo");
const doctorRepo_1 = require("../../../repositories/doctorRepo");
const chatRepo_1 = require("../../../repositories/chatRepo");
exports.ReviewController = {
    async createReview(req, reply) {
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
            const patient = await userRepo_1.userRepo.getUserByTelegramId(telegramId);
            if (!patient || !patient.id) {
                return reply.status(404).send({ error: "Patient not found" });
            }
            const doctorProfile = await doctorRepo_1.DoctorRepo.getDoctorById(doctorProfileId);
            if (!doctorProfile || !doctorProfile.userId) {
                return reply.status(404).send({ error: "Doctor not found" });
            }
            const doctorUser = await userRepo_1.userRepo.getUser(doctorProfile.userId);
            if (!doctorUser) {
                return reply.status(404).send({ error: "Doctor user not found" });
            }
            if (patient.id === doctorUser.id) {
                return reply.status(400).send({
                    error: "Cannot review yourself",
                });
            }
            if (chatId) {
                const chat = await chatRepo_1.ChatRepo.getChatByDoctorAndPatientId(doctorUser.id, patient.id);
                if (!chat || chat.id !== chatId) {
                    return reply.status(404).send({ error: "Chat not found" });
                }
            }
            const hasReviewed = await reviewRepo_1.ReviewRepo.hasPatientReviewedDoctor(patient.id, doctorProfileId, chatId);
            if (hasReviewed) {
                return reply.status(400).send({
                    error: "Review already exists for this doctor/chat",
                });
            }
            const review = await reviewRepo_1.ReviewRepo.createReview({
                patientId: patient.id,
                doctorId: doctorUser.id,
                doctorProfileId,
                chatId,
                rating,
                comment,
            });
            return reply.status(201).send(review);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to create review",
            });
        }
    },
    async getReviewsByDoctor(req, reply) {
        try {
            const doctorProfileId = parseInt(req.params.doctorProfileId);
            if (isNaN(doctorProfileId)) {
                return reply.status(400).send({ error: "Invalid doctor profile ID" });
            }
            const reviews = await reviewRepo_1.ReviewRepo.getReviewsByDoctorProfileId(doctorProfileId);
            return reply.status(200).send(reviews);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to get reviews",
            });
        }
    },
    async getReviewByChat(req, reply) {
        try {
            const chatId = parseInt(req.params.chatId);
            if (isNaN(chatId)) {
                return reply.status(400).send({ error: "Invalid chat ID" });
            }
            const review = await reviewRepo_1.ReviewRepo.getReviewByChatId(chatId);
            if (!review) {
                return reply.status(404).send({ error: "Review not found" });
            }
            return reply.status(200).send(review);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to get review",
            });
        }
    },
};
