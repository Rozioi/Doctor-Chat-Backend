"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRepo = void 0;
const prisma_1 = require("../modules/common/prisma");
exports.DoctorRepo = {
    async createDoctor(data) {
        try {
            console.log(data);
            const doctor = await prisma_1.prisma.doctorProfile.create({ data });
            return doctor;
        }
        catch (error) {
            throw new Error("Failed to create doctor");
        }
    },
    async getDoctors() {
        try {
            const doctor = await prisma_1.prisma.doctorProfile.findMany({
                include: {
                    user: true,
                },
            });
            return doctor;
        }
        catch (error) {
            throw new Error("Failed to get doctor");
        }
    },
    async getDoctorById(id) {
        try {
            const doctor = await prisma_1.prisma.doctorProfile.findUnique({
                where: { id },
                include: {
                    user: true,
                },
            });
            return doctor;
        }
        catch (error) {
            throw new Error("Failed to get doctor by id");
        }
    },
    async getDoctorByUserId(userId) {
        try {
            const doctor = await prisma_1.prisma.doctorProfile.findUnique({
                where: { userId },
                include: {
                    user: true,
                },
            });
            return doctor;
        }
        catch (error) {
            throw new Error("Failed to get doctor by userId");
        }
    },
    async updateDoctor(id, data) {
        try {
            const doctor = await prisma_1.prisma.doctorProfile.update({
                where: { id },
                data,
                include: {
                    user: true,
                },
            });
            return doctor;
        }
        catch (error) {
            throw new Error("Failed to update doctor");
        }
    },
};
