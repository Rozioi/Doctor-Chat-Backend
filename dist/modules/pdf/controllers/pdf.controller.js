"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFController = void 0;
const pdf_service_1 = require("../services/pdf.service");
const pdfRepo_1 = require("../../../repositories/pdfRepo");
exports.PDFController = {
    async generatePDF(req, reply) {
        try {
            const { documentType, userId, chatId, data, metadata } = req.body;
            if (!documentType) {
                return reply.status(400).send({ error: "documentType is required" });
            }
            if (!data) {
                return reply.status(400).send({ error: "data is required" });
            }
            const pdfDocument = await pdf_service_1.PDFService.generatePDF({
                documentType,
                userId,
                chatId,
                data,
                metadata,
            });
            if (!pdfDocument) {
                return reply.status(500).send({ error: "Failed to generate PDF" });
            }
            const baseUrl = req.protocol + "://" + req.hostname;
            pdfDocument.url = `${baseUrl}/uploads/pdfs/${pdfDocument.filename}`;
            return reply.status(201).send({
                success: true,
                data: pdfDocument,
            });
        }
        catch (error) {
            console.error("Error in generatePDF:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    async uploadPDF(req, reply) {
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
            const pdfDocument = await pdf_service_1.PDFService.uploadPDF({
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
            const baseUrl = req.protocol + "://" + req.hostname;
            pdfDocument.url = `${baseUrl}/uploads/pdfs/${pdfDocument.filename}`;
            return reply.status(201).send({
                success: true,
                data: pdfDocument,
            });
        }
        catch (error) {
            console.error("Error in uploadPDF:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    async getPDFDocument(req, reply) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return reply.status(400).send({ error: "Invalid PDF document ID" });
            }
            const pdfDocument = await pdfRepo_1.PDFRepo.getPDFDocumentById(id);
            if (!pdfDocument) {
                return reply.status(404).send({ error: "PDF document not found" });
            }
            const baseUrl = req.protocol + "://" + req.hostname;
            pdfDocument.url = `${baseUrl}/uploads/pdfs/${pdfDocument.filename}`;
            return reply.status(200).send({
                success: true,
                data: pdfDocument,
            });
        }
        catch (error) {
            console.error("Error in getPDFDocument:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    async getPDFFile(req, reply) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return reply.status(400).send({ error: "Invalid PDF document ID" });
            }
            const pdfDocument = await pdfRepo_1.PDFRepo.getPDFDocumentById(id);
            if (!pdfDocument) {
                return reply.status(404).send({ error: "PDF document not found" });
            }
            const staticPath = `/uploads/pdfs/${pdfDocument.filename}`;
            return reply.redirect(staticPath);
        }
        catch (error) {
            console.error("Error in getPDFFile:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    async getPDFDocumentsByUser(req, reply) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return reply.status(400).send({ error: "Invalid user ID" });
            }
            const pdfDocuments = await pdfRepo_1.PDFRepo.getPDFDocumentsByUserId(userId);
            const baseUrl = req.protocol + "://" + req.hostname;
            const documentsWithUrls = pdfDocuments.map((doc) => ({
                ...doc,
                url: `${baseUrl}/uploads/pdfs/${doc.filename}`,
            }));
            return reply.status(200).send({
                success: true,
                data: documentsWithUrls,
            });
        }
        catch (error) {
            console.error("Error in getPDFDocumentsByUser:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    async getPDFDocumentsByChat(req, reply) {
        try {
            const chatId = parseInt(req.params.chatId);
            if (isNaN(chatId)) {
                return reply.status(400).send({ error: "Invalid chat ID" });
            }
            const pdfDocuments = await pdfRepo_1.PDFRepo.getPDFDocumentsByChatId(chatId);
            const baseUrl = req.protocol + "://" + req.hostname;
            const documentsWithUrls = pdfDocuments.map((doc) => ({
                ...doc,
                url: `${baseUrl}/uploads/pdfs/${doc.filename}`,
            }));
            return reply.status(200).send({
                success: true,
                data: documentsWithUrls,
            });
        }
        catch (error) {
            console.error("Error in getPDFDocumentsByChat:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
    async deletePDFDocument(req, reply) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return reply.status(400).send({ error: "Invalid PDF document ID" });
            }
            const pdfDocument = await pdfRepo_1.PDFRepo.getPDFDocumentById(id);
            if (!pdfDocument) {
                return reply.status(404).send({ error: "PDF document not found" });
            }
            pdf_service_1.PDFService.deletePDFFile(pdfDocument.filename);
            const deleted = await pdfRepo_1.PDFRepo.deletePDFDocument(id);
            if (!deleted) {
                return reply
                    .status(500)
                    .send({ error: "Failed to delete PDF document" });
            }
            return reply.status(200).send({
                success: true,
                message: "PDF document deleted successfully",
            });
        }
        catch (error) {
            console.error("Error in deletePDFDocument:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
};
