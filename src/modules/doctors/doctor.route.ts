import fastify, { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import { DoctorControlller } from "./controllers/doctor.controller";

export const doctorRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  fastify.post("/doctors", DoctorControlller.createDoctor);
  fastify.get("/doctors", DoctorControlller.getDoctors);
  fastify.get("/doctors/:id", DoctorControlller.getDoctorById);
  fastify.get("/doctors/user/:userId", DoctorControlller.getDoctorByUserId);
  fastify.put("/doctors/:id", DoctorControlller.updateDoctor);
  done();
};
