import { FastifyReply, FastifyRequest } from "fastify";
import { PDFService } from "../services/pdf.service";
import { PDFRepo } from "../../../repositories/pdfRepo";
import { PDFDocumentType } from "@prisma/client";
import fs from "fs";
import path from "path";

interface GeneratePDFBody {
  documentType: PDFDocumentType;
  userId?: number;
  chatId?: number;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface UploadPDFBody {
  documentType: PDFDocumentType;
  userId?: number;
  chatId?: number;
  metadata?: Record<string, unknown>;
}

export const PDFController = {
  /**
   * Генерирует PDF документ
   * POST /api/v1/pdf/generate
   */
  async generatePDF(
    req: FastifyRequest<{ Body: GeneratePDFBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { documentType, userId, chatId, data, metadata } = req.body;

      if (!documentType) {
        return reply.status(400).send({ error: "documentType is required" });
      }

      if (!data) {
        return reply.status(400).send({ error: "data is required" });
      }

      const pdfDocument = await PDFService.generatePDF({
        documentType,
        userId,
        chatId,
        data,
        metadata,
      });

      if (!pdfDocument) {
        return reply.status(500).send({ error: "Failed to generate PDF" });
      }

      // Добавляем URL для доступа к файлу через статику
      const baseUrl = req.protocol + "://" + req.hostname;
      pdfDocument.url = `${baseUrl}/uploads/pdfs/${pdfDocument.filename}`;

      return reply.status(201).send({
        success: true,
        data: pdfDocument,
      });
    } catch (error) {
      console.error("Error in generatePDF:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Загружает PDF файл
   * POST /api/v1/pdf/upload
   */
  async uploadPDF(
    req: FastifyRequest<{ Body: UploadPDFBody }>,
    reply: FastifyReply,
  ) {
    try {
      const file = await req.file();
      if (!file) {
        return reply.status(400).send({ error: "No file provided" });
      }

      if (file.mimetype !== "application/pdf") {
        return reply.status(400).send({ error: "File must be a PDF" });
      }

      const { documentType, userId, chatId, metadata } = req.body;

      if (!documentType) {
        return reply.status(400).send({ error: "documentType is required" });
      }

      const fileBuffer = await file.toBuffer();

      const pdfDocument = await PDFService.uploadPDF({
        file: fileBuffer,
        originalName: file.filename || "document.pdf",
        documentType,
        userId,
        chatId,
        metadata,
      });

      if (!pdfDocument) {
        return reply.status(500).send({ error: "Failed to upload PDF" });
      }

      // Добавляем URL для доступа к файлу через статику
      const baseUrl = req.protocol + "://" + req.hostname;
      pdfDocument.url = `${baseUrl}/uploads/pdfs/${pdfDocument.filename}`;

      return reply.status(201).send({
        success: true,
        data: pdfDocument,
      });
    } catch (error) {
      console.error("Error in uploadPDF:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Получает PDF документ по ID
   * GET /api/v1/pdf/:id
   */
  async getPDFDocument(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return reply.status(400).send({ error: "Invalid PDF document ID" });
      }

      const pdfDocument = await PDFRepo.getPDFDocumentById(id);

      if (!pdfDocument) {
        return reply.status(404).send({ error: "PDF document not found" });
      }

      // Добавляем URL для доступа к файлу через статику
      const baseUrl = req.protocol + "://" + req.hostname;
      pdfDocument.url = `${baseUrl}/uploads/pdfs/${pdfDocument.filename}`;

      return reply.status(200).send({
        success: true,
        data: pdfDocument,
      });
    } catch (error) {
      console.error("Error in getPDFDocument:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Получает PDF файл для скачивания/просмотра
   * GET /api/v1/pdf/:id/file
   */
  async getPDFFile(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return reply.status(400).send({ error: "Invalid PDF document ID" });
      }

      const pdfDocument = await PDFRepo.getPDFDocumentById(id);

      if (!pdfDocument) {
        return reply.status(404).send({ error: "PDF document not found" });
      }

      // Проще отдаем файл как статический — редиректим на /uploads/pdfs
      const staticPath = `/uploads/pdfs/${pdfDocument.filename}`;
      return reply.redirect(staticPath);
    } catch (error) {
      console.error("Error in getPDFFile:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Получает список PDF документов пользователя
   * GET /api/v1/pdf/user/:userId
   */
  async getPDFDocumentsByUser(
    req: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return reply.status(400).send({ error: "Invalid user ID" });
      }

      const pdfDocuments = await PDFRepo.getPDFDocumentsByUserId(userId);

      // Добавляем URL для каждого документа (отдаём как статику)
      const baseUrl = req.protocol + "://" + req.hostname;
      const documentsWithUrls = pdfDocuments.map((doc) => ({
        ...doc,
        url: `${baseUrl}/uploads/pdfs/${doc.filename}`,
      }));

      return reply.status(200).send({
        success: true,
        data: documentsWithUrls,
      });
    } catch (error) {
      console.error("Error in getPDFDocumentsByUser:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Получает список PDF документов чата
   * GET /api/v1/pdf/chat/:chatId
   */
  async getPDFDocumentsByChat(
    req: FastifyRequest<{ Params: { chatId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const chatId = parseInt(req.params.chatId);

      if (isNaN(chatId)) {
        return reply.status(400).send({ error: "Invalid chat ID" });
      }

      const pdfDocuments = await PDFRepo.getPDFDocumentsByChatId(chatId);

      // Добавляем URL для каждого документа (отдаём как статику)
      const baseUrl = req.protocol + "://" + req.hostname;
      const documentsWithUrls = pdfDocuments.map((doc) => ({
        ...doc,
        url: `${baseUrl}/uploads/pdfs/${doc.filename}`,
      }));

      return reply.status(200).send({
        success: true,
        data: documentsWithUrls,
      });
    } catch (error) {
      console.error("Error in getPDFDocumentsByChat:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Удаляет PDF документ
   * DELETE /api/v1/pdf/:id
   */
  async deletePDFDocument(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return reply.status(400).send({ error: "Invalid PDF document ID" });
      }

      const pdfDocument = await PDFRepo.getPDFDocumentById(id);

      if (!pdfDocument) {
        return reply.status(404).send({ error: "PDF document not found" });
      }

      // Удаляем файл с диска
      PDFService.deletePDFFile(pdfDocument.filename);

      // Удаляем запись из БД
      const deleted = await PDFRepo.deletePDFDocument(id);

      if (!deleted) {
        return reply
          .status(500)
          .send({ error: "Failed to delete PDF document" });
      }

      return reply.status(200).send({
        success: true,
        message: "PDF document deleted successfully",
      });
    } catch (error) {
      console.error("Error in deletePDFDocument:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
