import { FastifyReply, FastifyRequest } from "fastify";
import { DoctorRepo } from "../../../repositories/doctorRepo";
import { DoctorInput } from "../types/doctor.types";
import { LoginRequest } from "../../users/controllers/user.contorller";
import { userRepo } from "../../../repositories/userRepo";

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

      const userData = {
        telegramId: String(user.telegramData.id),
        username: user.telegramData.username,
        firstName: user.telegramData.first_name,
        lastName: user.telegramData.last_name,
        photoUrl: user.telegramData.photo_url,
        phoneNumber: user.phoneNumber,
        role: "DOCTOR" as const,
        createdAt: new Date(),
      };

      const createdUser = await userRepo.createUser(userData);

      if (!createdUser) {
        return reply.status(400).send({ error: "Failed to create user" });
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
      return reply.status(200).send(doctors);
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
      return reply.status(200).send(doctor);
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
