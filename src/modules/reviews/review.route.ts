import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import { ReviewController } from "./controllers/review.controller";

export const reviewRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  fastify.post("/reviews", ReviewController.createReview);
  fastify.get("/reviews/doctor/:doctorProfileId", ReviewController.getReviewsByDoctor);
  fastify.get("/reviews/chat/:chatId", ReviewController.getReviewByChat);
  done();
};

