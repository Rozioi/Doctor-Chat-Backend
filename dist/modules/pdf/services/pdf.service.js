"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const pdfRepo_1 = require("../../../repositories/pdfRepo");
class PDFService {
    static PDFS_DIR = path_1.default.join(process.cwd(), "uploads", "pdfs");
    static initializePDFsDirectory() {
        if (!fs_1.default.existsSync(this.PDFS_DIR)) {
            fs_1.default.mkdirSync(this.PDFS_DIR, { recursive: true });
        }
    }
    static async generatePDF(options) {
        try {
            this.initializePDFsDirectory();
            const title = typeof options.data.title === "string"
                ? options.data.title
                : "document";
            const filename = `${Date.now()}_${this.generateSafeFilename(title)}.pdf`;
            const filePath = path_1.default.join(this.PDFS_DIR, filename);
            const doc = new pdfkit_1.default({
                size: "A4",
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });
            this.generatePDFContent(doc, options.documentType, options.data);
            const writeStream = fs_1.default.createWriteStream(filePath);
            doc.pipe(writeStream);
            doc.end();
            await new Promise((resolve, reject) => {
                writeStream.on("finish", resolve);
                writeStream.on("error", reject);
            });
            const stats = fs_1.default.statSync(filePath);
            const fileSize = stats.size;
            const pdfDocument = await pdfRepo_1.PDFRepo.createPDFDocument({
                filename,
                originalName: options.data.title
                    ? `${options.data.title}.pdf`
                    : `document_${Date.now()}.pdf`,
                filePath,
                fileSize,
                mimeType: "application/pdf",
                documentType: options.documentType,
                userId: options.userId,
                chatId: options.chatId,
                metadata: options.metadata || options.data,
            });
            return pdfDocument;
        }
        catch (error) {
            console.error("Error generating PDF:", error);
            return null;
        }
    }
    static async uploadPDF(request) {
        try {
            this.initializePDFsDirectory();
            const filename = `${Date.now()}_${this.generateSafeFilename(request.originalName)}`;
            const filePath = path_1.default.join(this.PDFS_DIR, filename);
            fs_1.default.writeFileSync(filePath, request.file);
            const stats = fs_1.default.statSync(filePath);
            const fileSize = stats.size;
            const pdfDocument = await pdfRepo_1.PDFRepo.createPDFDocument({
                filename,
                originalName: request.originalName,
                filePath,
                fileSize,
                mimeType: "application/pdf",
                documentType: request.documentType,
                userId: request.userId,
                chatId: request.chatId,
                metadata: request.metadata,
            });
            return pdfDocument;
        }
        catch (error) {
            console.error("Error uploading PDF:", error);
            return null;
        }
    }
    static getPDFFilePath(filename) {
        return path_1.default.join(this.PDFS_DIR, path_1.default.basename(filename));
    }
    static fileExists(filename) {
        const filePath = this.getPDFFilePath(filename);
        return fs_1.default.existsSync(filePath);
    }
    static readPDFFile(filename) {
        try {
            const filePath = this.getPDFFilePath(filename);
            if (!this.fileExists(filename)) {
                return null;
            }
            return fs_1.default.readFileSync(filePath);
        }
        catch (error) {
            console.error("Error reading PDF file:", error);
            return null;
        }
    }
    static deletePDFFile(filename) {
        try {
            const filePath = this.getPDFFilePath(filename);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error("Error deleting PDF file:", error);
            return false;
        }
    }
    static generatePDFContent(doc, documentType, data) {
        doc
            .fontSize(20)
            .text(this.getDocumentTypeTitle(documentType), { align: "center" });
        doc.moveDown(2);
        doc
            .fontSize(12)
            .text(`Дата создания: ${new Date().toLocaleString("ru-RU")}`, {
            align: "right",
        });
        doc.moveDown(2);
        switch (documentType) {
            case "ANALYSIS_RESULT":
                this.generateAnalysisResultContent(doc, data);
                break;
            case "CONSULTATION_REPORT":
                this.generateConsultationReportContent(doc, data);
                break;
            case "PRESCRIPTION":
                this.generatePrescriptionContent(doc, data);
                break;
            case "MEDICAL_CERTIFICATE":
                this.generateMedicalCertificateContent(doc, data);
                break;
            default:
                this.generateGenericContent(doc, data);
        }
    }
    static generateAnalysisResultContent(doc, data) {
        doc.fontSize(16).text("Результаты анализа", { underline: true });
        doc.moveDown();
        if (data.patientName) {
            doc.fontSize(12).text(`Пациент: ${data.patientName}`);
        }
        if (data.analysisType) {
            doc.fontSize(12).text(`Тип анализа: ${data.analysisType}`);
        }
        doc.moveDown();
        if (data.results && Array.isArray(data.results)) {
            doc.fontSize(14).text("Результаты:", { underline: true });
            doc.moveDown();
            data.results.forEach((result, index) => {
                doc
                    .fontSize(12)
                    .text(`${index + 1}. ${result.name || "Параметр"}: ${result.value || "N/A"}`);
                if (result.normalRange) {
                    doc
                        .fontSize(10)
                        .text(`   Норма: ${result.normalRange}`, { indent: 20 });
                }
                doc.moveDown(0.5);
            });
        }
        if (data.conclusion) {
            doc.moveDown();
            doc.fontSize(14).text("Заключение:", { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(String(data.conclusion));
        }
    }
    static generateConsultationReportContent(doc, data) {
        doc.fontSize(16).text("Отчет о консультации", { underline: true });
        doc.moveDown();
        if (data.patientName) {
            doc.fontSize(12).text(`Пациент: ${data.patientName}`);
        }
        if (data.doctorName) {
            doc.fontSize(12).text(`Врач: ${data.doctorName}`);
        }
        if (data.specialization) {
            doc.fontSize(12).text(`Специализация: ${data.specialization}`);
        }
        doc.moveDown();
        if (data.complaints) {
            doc.fontSize(14).text("Жалобы:", { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(String(data.complaints));
            doc.moveDown();
        }
        if (data.diagnosis) {
            doc.fontSize(14).text("Диагноз:", { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(String(data.diagnosis));
            doc.moveDown();
        }
        if (data.recommendations) {
            doc.fontSize(14).text("Рекомендации:", { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(String(data.recommendations));
        }
    }
    static generatePrescriptionContent(doc, data) {
        doc.fontSize(16).text("Рецепт", { underline: true });
        doc.moveDown();
        if (data.patientName) {
            doc.fontSize(12).text(`Пациент: ${data.patientName}`);
        }
        if (data.doctorName) {
            doc.fontSize(12).text(`Врач: ${data.doctorName}`);
        }
        doc.moveDown();
        if (data.medications && Array.isArray(data.medications)) {
            doc.fontSize(14).text("Лекарственные препараты:", { underline: true });
            doc.moveDown();
            data.medications.forEach((med, index) => {
                doc.fontSize(12).text(`${index + 1}. ${med.name || "Препарат"}`);
                if (med.dosage) {
                    doc
                        .fontSize(10)
                        .text(`   Дозировка: ${med.dosage}`, { indent: 20 });
                }
                if (med.frequency) {
                    doc
                        .fontSize(10)
                        .text(`   Частота приема: ${med.frequency}`, { indent: 20 });
                }
                if (med.duration) {
                    doc
                        .fontSize(10)
                        .text(`   Продолжительность: ${med.duration}`, { indent: 20 });
                }
                doc.moveDown(0.5);
            });
        }
        if (data.instructions) {
            doc.moveDown();
            doc.fontSize(14).text("Инструкции:", { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(String(data.instructions));
        }
    }
    static generateMedicalCertificateContent(doc, data) {
        doc.fontSize(16).text("Медицинская справка", { underline: true });
        doc.moveDown();
        if (data.patientName) {
            doc.fontSize(12).text(`Пациент: ${data.patientName}`);
        }
        if (data.doctorName) {
            doc.fontSize(12).text(`Врач: ${data.doctorName}`);
        }
        if (data.organization) {
            doc.fontSize(12).text(`Организация: ${data.organization}`);
        }
        doc.moveDown();
        if (data.certificateText) {
            doc.fontSize(12).text(String(data.certificateText));
        }
    }
    static generateGenericContent(doc, data) {
        if (data.title) {
            doc.fontSize(16).text(String(data.title), { underline: true });
            doc.moveDown();
        }
        if (data.content) {
            doc.fontSize(12).text(String(data.content));
        }
        else {
            Object.entries(data).forEach(([key, value]) => {
                if (key !== "title") {
                    doc.fontSize(12).text(`${key}: ${String(value)}`);
                    doc.moveDown(0.5);
                }
            });
        }
    }
    static getDocumentTypeTitle(documentType) {
        const titles = {
            ANALYSIS_RESULT: "Результаты анализа",
            CONSULTATION_REPORT: "Отчет о консультации",
            PRESCRIPTION: "Рецепт",
            MEDICAL_CERTIFICATE: "Медицинская справка",
            OTHER: "Документ",
        };
        return titles[documentType] || "Документ";
    }
    static generateSafeFilename(originalName) {
        return originalName
            .replace(/[^a-zA-Z0-9а-яА-Я._-]/g, "_")
            .replace(/\s+/g, "_")
            .substring(0, 100);
    }
}
exports.PDFService = PDFService;
