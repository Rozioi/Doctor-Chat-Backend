import { prisma } from "../modules/common/prisma";
import { User } from "../modules/users/types/user.types";

export const userRepo = {
  async getUserById(id: string | number): Promise<User | null> {
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

  async deleteUser(id: string): Promise<User | null> {
    try {
      const userId = parseInt(id);

      if (isNaN(userId)) {
        throw new Error("Invalid user ID");
      }

      // Проверяем существует ли пользователь
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      // Удаляем все возможные связанные данные
      await prisma.$transaction(async (tx) => {
        // Список возможных таблиц для очистки
        const deleteOperations = [
          // Чат
          () =>
            tx.chat.deleteMany({
              where: {
                OR: [{ patientId: userId }, { doctorId: userId }],
              },
            }),

          // Платежи
          () => tx.payment.deleteMany({ where: { userId } }),

          // Профиль врача
          () => tx.doctorProfile.deleteMany({ where: { userId } }),

          // Баланс
          () => tx.balance.deleteMany({ where: { userId } }),
          // // Отзывы (пробуем разные варианты полей)
          // () => tx.review.deleteMany({
          //   where: {
          //     OR: [
          //       { authorId: userId },
          //       { targetId: userId },
          //       { doctorId: userId },
          //       { patientId: userId }
          //     ]
          //   }
          // }),
        ];

        // Выполняем все операции удаления, игнорируем ошибки о несуществующих таблицах
        for (const operation of deleteOperations) {
          try {
            await operation();
          } catch (error) {
            // Игнорируем ошибки "таблица не найдена"
            if (!error.message?.includes("does not exist")) {
              console.warn("Error in delete operation:", error.message);
            }
          }
        }

        // Удаляем пользователя
        await tx.user.delete({
          where: { id: userId },
        });
      });

      return user;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
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
