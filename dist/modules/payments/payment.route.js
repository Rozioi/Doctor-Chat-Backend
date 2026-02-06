"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const payment_controller_1 = require("./controllers/payment.controller");
const paymentRoutes = (fastify, _opts, done) => {
    fastify.get("/balance", payment_controller_1.PaymentController.getBalance);
    fastify.post("/balance/add", payment_controller_1.PaymentController.addToBalance);
    fastify.post("/payments", payment_controller_1.PaymentController.createPayment);
    fastify.get("/payments", payment_controller_1.PaymentController.getPayments);
    fastify.post("/payments/robokassa/init", payment_controller_1.PaymentController.initRobokassaPayment);
    fastify.post("/payments/robokassa/result", payment_controller_1.PaymentController.robokassaResultCallback);
    fastify.get("/payments/robokassa/success", payment_controller_1.PaymentController.robokassaSuccess);
    fastify.get("/payments/robokassa/fail", payment_controller_1.PaymentController.robokassaFail);
    fastify.get("/payments/robokassa/status/:invoiceId", payment_controller_1.PaymentController.checkRobokassaStatus);
    done();
};
exports.paymentRoutes = paymentRoutes;
