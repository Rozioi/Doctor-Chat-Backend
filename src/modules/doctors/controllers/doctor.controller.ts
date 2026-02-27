import { FastifyReply, FastifyRequest } from "fastify";
import { DoctorRepo } from "../../../repositories/doctorRepo";
import { DoctorInput } from "../types/doctor.types";
import { LoginRequest } from "../../users/controllers/user.contorller";
import { userRepo } from "../../../repositories/userRepo";
import { ReviewRepo } from "../../../repositories/reviewRepo";

interface ICreateDocotorInput {
  user: LoginRequest;
  doctor: DoctorInput;
}

export const DoctorControlller = {
  async createDoctor(
    req: FastifyRequest<{ Body: ICreateDocotorInput }>,
    reply: FastifyReply,
  ) {
    try {
      const { user, doctor } = req.body;

      const telegramId = String(user.telegramData.id);

      // Check if user already exists
      let existingUser = await userRepo.getUserByTelegramId(telegramId);
      let createdUser;

      if (existingUser) {
        // Update user if they exist
        createdUser = await userRepo.updateUser(telegramId, {
          username: user.telegramData.username,
          firstName: user.telegramData.first_name,
          lastName: user.telegramData.last_name,
          photoUrl: user.telegramData.photo_url,
          phoneNumber: user.phoneNumber,
          role: "DOCTOR",
        });
      } else {
        // Create new user if not exists
        const userData = {
          telegramId,
          username: user.telegramData.username,
          firstName: user.telegramData.first_name,
          lastName: user.telegramData.last_name,
          photoUrl: user.telegramData.photo_url,
          phoneNumber: user.phoneNumber,
          role: "DOCTOR" as const,
          createdAt: new Date(),
        };
        createdUser = await userRepo.createUser(userData);
      }

      if (!createdUser) {
        return reply.status(400).send({ error: "Failed to create or update user" });
      }

      if (!doctor.specialization) {
        return reply.status(400).send({ error: "specialization is required" });
      }
      if (!doctor.qualification) {
        return reply.status(400).send({ error: "qualification is required" });
      }
      if (!doctor.country) {
        return reply.status(400).send({ error: "country is required" });
      }

      if (!createdUser.id) {
        return reply.status(500).send({ error: "User ID is missing" });
      }

      const doctorData = {
        ...doctor,
        userId: createdUser.id,
      };

      const doctorRes = await DoctorRepo.createDoctor(doctorData);

      return reply.status(201).send({
        user: createdUser,
        doctor: doctorRes,
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to create doctor",
      });
    }
  },
  async getDoctors(req: FastifyRequest, reply: FastifyReply) {
    try {
      const doctors = await DoctorRepo.getDoctors();

      // Добавляем количество отзывов к каждому профилю
      const doctorsWithReviews = await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const reviews = await ReviewRepo.getReviewsByDoctorProfileId(
              doctor.id,
            );
            const reviewsCount = reviews.length;
            return {
              ...doctor,
              reviewsCount,
            };
          } catch {
            return {
              ...doctor,
              reviewsCount: 0,
            };
          }
        }),
      );

      return reply.status(200).send(doctorsWithReviews);
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get doctors" });
    }
  },
  async getDoctorById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: "Invalid doctor ID" });
      }
      const doctor = await DoctorRepo.getDoctorById(id);
      if (!doctor) {
        return reply.status(404).send({ error: "Doctor not found" });
      }
      // добавляем количество отзывов
      try {
        const reviews = await ReviewRepo.getReviewsByDoctorProfileId(
          doctor.id,
        );
        const reviewsCount = reviews.length;
        return reply.status(200).send({
          ...doctor,
          reviewsCount,
        });
      } catch {
        return reply.status(200).send({
          ...doctor,
          reviewsCount: 0,
        });
      }
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get doctor" });
    }
  },
  async getDoctorByIdRepo(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: "Invalid doctor ID" });
      }
      const doctor = await DoctorRepo.getDoctorById(id);
      if (!doctor) {
        return reply.status(404).send({ error: "Doctor not found" });
      }
      return reply.status(200).send(doctor);
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get doctor" });
    }
  },
  async getDoctorByUserId(
    req: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return reply.status(400).send({ error: "Invalid user ID" });
      }
      const doctor = await DoctorRepo.getDoctorByUserId(userId);
      if (!doctor) {
        return reply.status(404).send({ error: "Doctor profile not found" });
      }
      return reply.status(200).send(doctor);
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get doctor profile" });
    }
  },
  async getDoctorByUserIdRepo(
    req: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return reply.status(400).send({ error: "Invalid user ID" });
      }
      const doctor = await DoctorRepo.getDoctorByUserId(userId);
      if (!doctor) {
        return reply.status(404).send({ error: "Doctor profile not found" });
      }
      return reply.status(200).send(doctor);
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get doctor profile" });
    }
  },
  async updateDoctor(
    req: FastifyRequest<{ Params: { id: string }; Body: Partial<DoctorInput> }>,
    reply: FastifyReply,
  ) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: "Invalid doctor ID" });
      }

      const updateData = req.body;
      // Убираем userId из данных обновления, так как его нельзя менять
      const { userId, ...dataToUpdate } = updateData as any;

      const doctor = await DoctorRepo.updateDoctor(id, dataToUpdate);
      if (!doctor) {
        return reply.status(404).send({ error: "Doctor not found" });
      }
      return reply.status(200).send(doctor);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        error: error.message || "Failed to update doctor",
      });
    }
  },
};
