"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFRepo = void 0;
const prisma_1 = require("../modules/common/prisma");
const library_1 = __importDefault(require("@prisma/client/runtime/library"));
class PDFRepo {
    static async createPDFDocument(data) {
        try {
            const pdfDocument = await prisma_1.prisma.pDFDocument.create({
                data: {
                    filename: data.filename,
                    originalName: data.originalName,
                    filePath: data.filePath,
                    fileSize: data.fileSize,
                    mimeType: data.mimeType || "application/pdf",
                    documentType: data.documentType,
                    userId: data.userId,
                    chatId: data.chatId,
                    metadata: library_1.default | null,
                },
            });
            return this.mapToResponse(pdfDocument);
        }
        catch (error) {
            console.error("Error creating PDF document:", error);
            return null;
        }
    }
    static async getPDFDocumentById(id) {
        try {
            const pdfDocument = await prisma_1.prisma.pDFDocument.findUnique({
                where: { id },
            });
            if (!pdfDocument) {
                return null;
            }
            return this.mapToResponse(pdfDocument);
        }
        catch (error) {
            console.error("Error getting PDF document:", error);
            return null;
        }
    }
    static async getPDFDocumentsByUserId(userId) {
        try {
            const pdfDocuments = await prisma_1.prisma.pDFDocument.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            });
            return pdfDocuments.map((doc) => this.mapToResponse(doc));
        }
        catch (error) {
            console.error("Error getting PDF documents by user ID:", error);
            return [];
        }
    }
    static async getPDFDocumentsByChatId(chatId) {
        try {
            const pdfDocuments = await prisma_1.prisma.pDFDocument.findMany({
                where: { chatId },
                orderBy: { createdAt: "desc" },
            });
            return pdfDocuments.map((doc) => this.mapToResponse(doc));
        }
        catch (error) {
            console.error("Error getting PDF documents by chat ID:", error);
            return [];
        }
    }
    static async getPDFDocumentsByType(documentType) {
        try {
            const pdfDocuments = await prisma_1.prisma.pDFDocument.findMany({
                where: { documentType },
                orderBy: { createdAt: "desc" },
            });
            return pdfDocuments.map((doc) => this.mapToResponse(doc));
        }
        catch (error) {
            console.error("Error getting PDF documents by type:", error);
            return [];
        }
    }
    static async deletePDFDocument(id) {
        try {
            await prisma_1.prisma.pDFDocument.delete({
                where: { id },
            });
            return true;
        }
        catch (error) {
            console.error("Error deleting PDF document:", error);
            return false;
        }
    }
    static mapToResponse(pdfDocument) {
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
                ? pdfDocument.metadata
                : null,
            createdAt: pdfDocument.createdAt,
            updatedAt: pdfDocument.updatedAt,
        };
    }
}
exports.PDFRepo = PDFRepo;
