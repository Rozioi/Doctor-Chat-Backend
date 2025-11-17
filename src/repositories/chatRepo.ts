import { prisma } from "../modules/common/prisma";

export const ChatRepo = {
  async createChat(data: {
    patientId: number;
    doctorId: number;
    serviceType: string;
    amount: number;
    telegramChatId?: string;
  }) {
    try {
      const chat = await prisma.chat.create({
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
    } catch (error) {
      throw new Error("Failed to create chat");
    }
  },

  async getChatsByPatientId(patientId: number) {
    try {
      const chats = await prisma.chat.findMany({
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
    } catch (error) {
      throw new Error("Failed to get chats");
    }
  },

  async getChatsByDoctorId(doctorId: number) {
    try {
      const chats = await prisma.chat.findMany({
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
    } catch (error) {
      throw new Error("Failed to get chats");
    }
  },
};

