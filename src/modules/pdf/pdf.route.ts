import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../scripts/fastify-route";
import { PDFController } from "./controllers/pdf.controller";

export const pdfRoutes: TRouteFunction = (
  fastify: FastifyInstance,
  _opts,
  done,
) => {
  fastify.post("/pdf/generate", PDFController.generatePDF);

  fastify.post("/pdf/upload", PDFController.uploadPDF);

  fastify.get("/pdf/:id", PDFController.getPDFDocument);

  fastify.get("/pdf/:id/file", PDFController.getPDFFile);

  // Получение PDF документов пользователя
  fastify.get("/pdf/user/:userId", PDFController.getPDFDocumentsByUser);

  // Получение PDF документов чата
  fastify.get("/pdf/chat/:chatId", PDFController.getPDFDocumentsByChat);

  // Удаление PDF документа
  fastify.delete("/pdf/:id", PDFController.deletePDFDocument);

  done();
};
