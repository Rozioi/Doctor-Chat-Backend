import { prisma } from "../modules/common/prisma";

export const ChatRepo = {
  async createChat(data: {
    patientId: number;
    doctorId: number;
    serviceType: string;
    amount: number;
    telegramChatId?: string;
    tariffType?: "STANDARD" | "VIP";
  }) {
    try {
      const chat = await prisma.chat.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          serviceType: data.serviceType,
          amount: data.amount,
          telegramChatId: data.telegramChatId,
          tariffType: data.tariffType || "STANDARD",
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

  async getChatById(id: number) {
    try {
      return await prisma.chat.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: {
            include: {
              doctorProfile: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error("Failed to get chat by ID");
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
  async getChatByDoctorAndPatientId(doctorId: number, patientId: number) {
    try {
      const chat = await prisma.chat.findFirst({
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
    } catch (error) {
      throw new Error("Failed to get chat");
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
  async findActiveChat(patientId: number, doctorId: number, serviceType: string) {
    try {
      const chat = await prisma.chat.findFirst({
        where: {
          patientId,
          doctorId,
          serviceType,
          status: "ACTIVE",
        },
      });
      return chat;
    } catch (error) {
      throw new Error("Failed to find active chat");
    }
  },

  async completeChat(chatId: number) {
    try {
      const chat = await prisma.chat.update({
        where: { id: chatId },
        data: { status: "COMPLETED" },
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
      throw new Error("Failed to complete chat");
    }
  },
};
