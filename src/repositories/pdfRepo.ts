import { prisma } from "../modules/common/prisma";
import { PDFDocumentType } from "@prisma/client";
import type { CreatePDFDocumentInput, PDFDocumentResponse } from "../modules/pdf/types/pdf.types";

export class PDFRepo {
  /**
   * Создает новую запись о PDF документе в БД
   */
  static async createPDFDocument(
    data: CreatePDFDocumentInput,
  ): Promise<PDFDocumentResponse | null> {
    try {
      const pdfDocument = await prisma.pDFDocument.create({
        data: {
          filename: data.filename,
          originalName: data.originalName,
          filePath: data.filePath,
          fileSize: data.fileSize,
          mimeType: data.mimeType || "application/pdf",
          documentType: data.documentType,
          userId: data.userId,
          chatId: data.chatId,
          metadata: data.metadata || null,
        },
      });

      return this.mapToResponse(pdfDocument);
    } catch (error) {
      console.error("Error creating PDF document:", error);
      return null;
    }
  }

  /**
   * Получает PDF документ по ID
   */
  static async getPDFDocumentById(id: number): Promise<PDFDocumentResponse | null> {
    try {
      const pdfDocument = await prisma.pDFDocument.findUnique({
        where: { id },
      });

      if (!pdfDocument) {
        return null;
      }

      return this.mapToResponse(pdfDocument);
    } catch (error) {
      console.error("Error getting PDF document:", error);
      return null;
    }
  }

  /**
   * Получает все PDF документы пользователя
   */
  static async getPDFDocumentsByUserId(userId: number): Promise<PDFDocumentResponse[]> {
    try {
      const pdfDocuments = await prisma.pDFDocument.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return pdfDocuments.map((doc) => this.mapToResponse(doc));
    } catch (error) {
      console.error("Error getting PDF documents by user ID:", error);
      return [];
    }
  }

  /**
   * Получает все PDF документы чата
   */
  static async getPDFDocumentsByChatId(chatId: number): Promise<PDFDocumentResponse[]> {
    try {
      const pdfDocuments = await prisma.pDFDocument.findMany({
        where: { chatId },
        orderBy: { createdAt: "desc" },
      });

      return pdfDocuments.map((doc) => this.mapToResponse(doc));
    } catch (error) {
      console.error("Error getting PDF documents by chat ID:", error);
      return [];
    }
  }

  /**
   * Получает PDF документы по типу
   */
  static async getPDFDocumentsByType(
    documentType: PDFDocumentType,
  ): Promise<PDFDocumentResponse[]> {
    try {
      const pdfDocuments = await prisma.pDFDocument.findMany({
        where: { documentType },
        orderBy: { createdAt: "desc" },
      });

      return pdfDocuments.map((doc) => this.mapToResponse(doc));
    } catch (error) {
      console.error("Error getting PDF documents by type:", error);
      return [];
    }
  }

  /**
   * Удаляет PDF документ по ID
   */
  static async deletePDFDocument(id: number): Promise<boolean> {
    try {
      await prisma.pDFDocument.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting PDF document:", error);
      return false;
    }
  }

  /**
   * Преобразует модель Prisma в ответ API
   */
  private static mapToResponse(pdfDocument: {
    id: number;
    filename: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    documentType: PDFDocumentType;
    userId: number | null;
    chatId: number | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  }): PDFDocumentResponse {
    return {
      id: pdfDocument.id,
      filename: pdfDocument.filename,
      originalName: pdfDocument.originalName,
      filePath: pdfDocument.filePath,
      fileSize: pdfDocument.fileSize,
      mimeType: pdfDocument.mimeType,
      documentType: pdfDocument.documentType,
      userId: pdfDocument.userId,
      chatId: pdfDocument.chatId,
      metadata: pdfDocument.metadata
        ? (pdfDocument.metadata as Record<string, unknown>)
        : null,
      createdAt: pdfDocument.createdAt,
      updatedAt: pdfDocument.updatedAt,
    };
  }
}

