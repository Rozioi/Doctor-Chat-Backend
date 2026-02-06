"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfRoutes = void 0;
const pdf_controller_1 = require("./controllers/pdf.controller");
const pdfRoutes = (fastify, _opts, done) => {
    fastify.post("/pdf/generate", pdf_controller_1.PDFController.generatePDF);
    fastify.post("/pdf/upload", pdf_controller_1.PDFController.uploadPDF);
    fastify.get("/pdf/:id", pdf_controller_1.PDFController.getPDFDocument);
    fastify.get("/pdf/:id/file", pdf_controller_1.PDFController.getPDFFile);
    fastify.get("/pdf/user/:userId", pdf_controller_1.PDFController.getPDFDocumentsByUser);
    fastify.get("/pdf/chat/:chatId", pdf_controller_1.PDFController.getPDFDocumentsByChat);
    fastify.delete("/pdf/:id", pdf_controller_1.PDFController.deletePDFDocument);
    done();
};
exports.pdfRoutes = pdfRoutes;
