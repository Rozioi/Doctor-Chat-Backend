"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorControlller = void 0;
const doctorRepo_1 = require("../../../repositories/doctorRepo");
const userRepo_1 = require("../../../repositories/userRepo");
exports.DoctorControlller = {
    async createDoctor(req, reply) {
        try {
            const { user, doctor } = req.body;
            const userData = {
                telegramId: String(user.telegramData.id),
                username: user.telegramData.username,
                firstName: user.telegramData.first_name,
                lastName: user.telegramData.last_name,
                photoUrl: user.telegramData.photo_url,
                phoneNumber: user.phoneNumber,
                role: "DOCTOR",
                createdAt: new Date(),
            };
            const createdUser = await userRepo_1.userRepo.createUser(userData);
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
            const doctorRes = await doctorRepo_1.DoctorRepo.createDoctor(doctorData);
            return reply.status(201).send({
                user: createdUser,
                doctor: doctorRes,
            });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to create doctor",
            });
        }
    },
    async getDoctors(req, reply) {
        try {
            const doctors = await doctorRepo_1.DoctorRepo.getDoctors();
            return reply.status(200).send(doctors);
        }
        catch (error) {
            return reply.status(500).send({ error: "Failed to get doctors" });
        }
    },
    async getDoctorById(req, reply) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return reply.status(400).send({ error: "Invalid doctor ID" });
            }
            const doctor = await doctorRepo_1.DoctorRepo.getDoctorById(id);
            if (!doctor) {
                return reply.status(404).send({ error: "Doctor not found" });
            }
            return reply.status(200).send(doctor);
        }
        catch (error) {
            return reply.status(500).send({ error: "Failed to get doctor" });
        }
    },
    async getDoctorByIdRepo(req, reply) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return reply.status(400).send({ error: "Invalid doctor ID" });
            }
            const doctor = await doctorRepo_1.DoctorRepo.getDoctorById(id);
            if (!doctor) {
                return reply.status(404).send({ error: "Doctor not found" });
            }
            return reply.status(200).send(doctor);
        }
        catch (error) {
            return reply.status(500).send({ error: "Failed to get doctor" });
        }
    },
    async getDoctorByUserId(req, reply) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return reply.status(400).send({ error: "Invalid user ID" });
            }
            const doctor = await doctorRepo_1.DoctorRepo.getDoctorByUserId(userId);
            if (!doctor) {
                return reply.status(404).send({ error: "Doctor profile not found" });
            }
            return reply.status(200).send(doctor);
        }
        catch (error) {
            return reply.status(500).send({ error: "Failed to get doctor profile" });
        }
    },
    async getDoctorByUserIdRepo(req, reply) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return reply.status(400).send({ error: "Invalid user ID" });
            }
            const doctor = await doctorRepo_1.DoctorRepo.getDoctorByUserId(userId);
            if (!doctor) {
                return reply.status(404).send({ error: "Doctor profile not found" });
            }
            return reply.status(200).send(doctor);
        }
        catch (error) {
            return reply.status(500).send({ error: "Failed to get doctor profile" });
        }
    },
    async updateDoctor(req, reply) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return reply.status(400).send({ error: "Invalid doctor ID" });
            }
            const updateData = req.body;
            const { userId, ...dataToUpdate } = updateData;
            const doctor = await doctorRepo_1.DoctorRepo.updateDoctor(id, dataToUpdate);
            if (!doctor) {
                return reply.status(404).send({ error: "Doctor not found" });
            }
            return reply.status(200).send(doctor);
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to update doctor",
            });
        }
    },
};
