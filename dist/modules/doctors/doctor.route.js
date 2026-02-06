"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorRoutes = void 0;
const doctor_controller_1 = require("./controllers/doctor.controller");
const doctorRoutes = (fastify, _opts, done) => {
    fastify.post("/doctors", doctor_controller_1.DoctorControlller.createDoctor);
    fastify.get("/doctors", doctor_controller_1.DoctorControlller.getDoctors);
    fastify.get("/doctors/:id", doctor_controller_1.DoctorControlller.getDoctorByIdRepo);
    fastify.get("/doctors/user/:userId", doctor_controller_1.DoctorControlller.getDoctorByUserIdRepo);
    fastify.put("/doctors/:id", doctor_controller_1.DoctorControlller.updateDoctor);
    done();
};
exports.doctorRoutes = doctorRoutes;
