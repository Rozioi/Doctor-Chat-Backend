"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
const review_controller_1 = require("./controllers/review.controller");
const reviewRoutes = (fastify, _opts, done) => {
    fastify.post("/reviews", review_controller_1.ReviewController.createReview);
    fastify.get("/reviews/doctor/:doctorProfileId", review_controller_1.ReviewController.getReviewsByDoctor);
    fastify.get("/reviews/chat/:chatId", review_controller_1.ReviewController.getReviewByChat);
    done();
};
exports.reviewRoutes = reviewRoutes;
