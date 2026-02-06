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
  fastify.get("/doctors/:id", DoctorControlller.getDoctorByIdRepo);
  fastify.get("/doctors/user/:userId", DoctorControlller.getDoctorByUserIdRepo);
  fastify.put("/doctors/:id", DoctorControlller.updateDoctor);
  done();
};
