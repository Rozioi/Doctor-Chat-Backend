"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepo = void 0;
const prisma_1 = require("../modules/common/prisma");
exports.ChatRepo = {
    async createChat(data) {
        try {
            const chat = await prisma_1.prisma.chat.create({
                data: {
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    serviceType: data.serviceType,
                    amount: data.amount,
                    telegramChatId: data.telegramChatId,
                },
                include: {
                    patient: true,
                    doctor: {
                        include: {
                            doctorProfile: true,
                        },
                    },
                },
            });
            return chat;
        }
        catch (error) {
            throw new Error("Failed to create chat");
        }
    },
    async getChatsByPatientId(patientId) {
        try {
            const chats = await prisma_1.prisma.chat.findMany({
                where: { patientId },
                include: {
                    patient: true,
                    doctor: {
                        include: {
                            doctorProfile: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            return chats;
        }
        catch (error) {
            throw new Error("Failed to get chats");
        }
    },
    async getChatByDoctorAndPatientId(doctorId, patientId) {
        try {
            const chat = await prisma_1.prisma.chat.findFirst({
                where: { doctorId, patientId },
                include: {
                    patient: true,
                    doctor: {
                        include: {
                            doctorProfile: true,
                        },
                    },
                },
            });
            return chat;
        }
        catch (error) {
            throw new Error("Failed to get chat");
        }
    },
    async getChatsByDoctorId(doctorId) {
        try {
            const chats = await prisma_1.prisma.chat.findMany({
                where: { doctorId },
                include: {
                    patient: true,
                    doctor: {
                        include: {
                            doctorProfile: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            return chats;
        }
        catch (error) {
            throw new Error("Failed to get chats");
        }
    },
    async findActiveChat(patientId, doctorId, serviceType) {
        try {
            const chat = await prisma_1.prisma.chat.findFirst({
                where: {
                    patientId,
                    doctorId,
                    serviceType,
                    status: "ACTIVE",
                },
            });
            return chat;
        }
        catch (error) {
            throw new Error("Failed to find active chat");
        }
    },
};
