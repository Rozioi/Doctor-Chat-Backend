import { prisma } from "../modules/common/prisma";
import { DoctorInput } from "../modules/doctors/types/doctor.types";

export const DoctorRepo = {
  async createDoctor(data: DoctorInput) {
    try {
      console.log(data);
      const doctor = await prisma.doctorProfile.create({ data });
      return doctor;
    } catch (error) {
      throw new Error("Failed to create doctor");
    }
  },
  async getDoctors() {
    try {
      const doctor = await prisma.doctorProfile.findMany({
        include: {
          user: true,
        },
      });
      return doctor;
    } catch (error) {
      throw new Error("Failed to get doctor");
    }
  },
  async getDoctorById(id: number) {
    try {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });
      return doctor;
    } catch (error) {
      throw new Error("Failed to get doctor by id");
    }
  },
  async getDoctorByUserId(userId: number) {
    try {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId },
        include: {
          user: true,
        },
      });
      return doctor;
    } catch (error) {
      throw new Error("Failed to get doctor by userId");
    }
  },
  async updateDoctor(id: number, data: Partial<DoctorInput>) {
    try {
      const doctor = await prisma.doctorProfile.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      });
      return doctor;
    } catch (error) {
      throw new Error("Failed to update doctor");
    }
  },
};
