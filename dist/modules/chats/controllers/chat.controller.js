"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chatRepo_1 = require("../../../repositories/chatRepo");
const userRepo_1 = require("../../../repositories/userRepo");
const doctorRepo_1 = require("../../../repositories/doctorRepo");
exports.ChatController = {
    async createChat(req, reply) {
        try {
            const { doctorId, serviceType, amount, telegramId } = req.body;
            if (!telegramId) {
                return reply.status(401).send({ error: "User not authenticated" });
            }
            const patient = await userRepo_1.userRepo.getUserByTelegramId(telegramId);
            if (!patient || !patient.id) {
                return reply.status(404).send({ error: "Patient not found" });
            }
            const doctorProfile = await doctorRepo_1.DoctorRepo.getDoctorById(doctorId);
            if (!doctorProfile || !doctorProfile.userId) {
                return reply.status(404).send({ error: "Doctor not found" });
            }
            const doctorUser = await userRepo_1.userRepo.getUser(doctorProfile.userId);
            if (!doctorUser) {
                return reply.status(404).send({ error: "Doctor user not found" });
            }
            if (patient.id === doctorUser.id) {
                return reply.status(400).send({
                    error: "Doctor cannot book appointment with themselves",
                });
            }
            const chat = await chatRepo_1.ChatRepo.createChat({
                patientId: patient.id,
                doctorId: doctorUser.id,
                serviceType,
                amount,
            });
            return reply.status(201).send(chat);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to create chat",
            });
        }
    },
    async getChats(req, reply) {
        try {
            const telegramId = req.headers["x-telegram-user-id"] || req.query.telegramId;
            if (!telegramId) {
                return reply.status(401).send({ error: "User not authenticated" });
            }
            const user = await userRepo_1.userRepo.getUserByTelegramId(telegramId);
            if (!user || !user.id) {
                return reply.status(404).send({ error: "User not found" });
            }
            let chats;
            if (user.role === "DOCTOR") {
                chats = await chatRepo_1.ChatRepo.getChatsByDoctorId(user.id);
            }
            else {
                chats = await chatRepo_1.ChatRepo.getChatsByPatientId(user.id);
            }
            return reply.status(200).send(chats);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to get chats",
            });
        }
    },
    async sendChatInvite(req, reply) {
        try {
            const { patientId, doctorId } = req.body;
            const chat = await chatRepo_1.ChatRepo.getChatByDoctorAndPatientId(doctorId, patientId);
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
            const doctorProfile = await doctorRepo_1.DoctorRepo.getDoctorById(doctorId);
            if (!doctorProfile || !doctorProfile.userId) {
                return reply.status(404).send({ error: "Doctor not found" });
            }
            const doctorUser = await userRepo_1.userRepo.getUser(doctorProfile.userId);
            const patientUser = await userRepo_1.userRepo.getUserById(patientId);
            if (!doctorUser ||
                !doctorUser.telegramId ||
                !patientUser ||
                !patientUser.telegramId) {
                return reply.status(404).send({ error: "User not found" });
            }
            const bot = (await Promise.resolve().then(() => __importStar(require("../../../bot/bot")))).default;
            const doctorName = doctorUser.firstName && doctorUser.lastName
                ? `${doctorUser.firstName} ${doctorUser.lastName}`
                : doctorUser.firstName || doctorUser.username || "Врач";
            const { InlineKeyboard } = await Promise.resolve().then(() => __importStar(require("grammy")));
            const keyboardUser = new InlineKeyboard().url("Перейти в чат с врачом", `tg://user?id=${doctorUser.telegramId}`);
            const keyboardDoctor = new InlineKeyboard().url("Перейти в чат с пациентом ", `tg://user?id=${patientUser.telegramId}`);
            const patientName = patientUser.firstName && patientUser.lastName
                ? `${patientUser.firstName} ${patientUser.lastName}`
                : patientUser.firstName || patientUser.username || "Пациент";
            console.log(patientName, doctorName);
            await bot.api.sendMessage(doctorUser.telegramId, `Пациент ${patientName} хочет начать чат с вами. Нажмите кнопку ниже, чтобы перейти в чат:`, {
                reply_markup: keyboardDoctor,
            });
            await bot.api.sendMessage(patientUser.telegramId, `Вы хотите начать чат с врачом ${doctorName}. Нажмите кнопку ниже, чтобы перейти в чат:`, {
                reply_markup: keyboardUser,
            });
            return reply.status(200).send({
                success: true,
                message: "Chat invite sent successfully",
            });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to send chat invite",
            });
        }
    },
};
