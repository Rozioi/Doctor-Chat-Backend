import { prisma } from "../modules/common/prisma";
import { User } from "../modules/users/types/user.types";

export const userRepo = {
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: parseInt(id) } });
  },
  async createUser(data: User): Promise<User> {
    return prisma.user.create({ data });
  },
  async findByTelegramId(telegramId: string) {
    return prisma.user.findUnique({ where: { telegramId } });
  },
  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { telegramId } });
  },
  async updateUser(telegramId: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { telegramId },
      data,
    });
  },
  async getUser(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },
};
