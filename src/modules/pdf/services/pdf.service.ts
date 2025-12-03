import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { PDFRepo } from "../../../repositories/pdfRepo";
import type {
  CreatePDFDocumentInput,
  GeneratePDFOptions,
  PDFDocumentResponse,
  UploadPDFRequest,
} from "../types/pdf.types";
import { PDFDocumentType } from "@prisma/client";

export class PDFService {
  private static readonly PDFS_DIR = path.join(process.cwd(), "uploads", "pdfs");

  /**
   * Инициализирует директорию для хранения PDF файлов
   */
  static initializePDFsDirectory(): void {
    if (!fs.existsSync(this.PDFS_DIR)) {
      fs.mkdirSync(this.PDFS_DIR, { recursive: true });
    }
  }

  /**
   * Генерирует PDF документ на основе данных
   */
  static async generatePDF(options: GeneratePDFOptions): Promise<PDFDocumentResponse | null> {
    try {
      this.initializePDFsDirectory();

      const filename = `${Date.now()}_${this.generateSafeFilename(options.data.title || "document")}.pdf`;
      const filePath = path.join(this.PDFS_DIR, filename);

      // Создаем PDF документ
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Генерируем содержимое PDF в зависимости от типа
      this.generatePDFContent(doc, options.documentType, options.data);

      // Сохраняем PDF в файл
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      doc.end();

      // Ждем завершения записи
      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      // Получаем размер файла
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Сохраняем метаданные в БД
      const pdfDocument = await PDFRepo.createPDFDocument({
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
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  }

  /**
   * Загружает PDF файл на сервер
   */
  static async uploadPDF(request: UploadPDFRequest): Promise<PDFDocumentResponse | null> {
    try {
      this.initializePDFsDirectory();

      const filename = `${Date.now()}_${this.generateSafeFilename(request.originalName)}`;
      const filePath = path.join(this.PDFS_DIR, filename);

      // Сохраняем файл
      fs.writeFileSync(filePath, request.file);

      // Получаем размер файла
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Сохраняем метаданные в БД
      const pdfDocument = await PDFRepo.createPDFDocument({
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
    } catch (error) {
      console.error("Error uploading PDF:", error);
      return null;
    }
  }

  /**
   * Получает путь к PDF файлу
   */
  static getPDFFilePath(filename: string): string {
    return path.join(this.PDFS_DIR, path.basename(filename));
  }

  /**
   * Проверяет существование PDF файла
   */
  static fileExists(filename: string): boolean {
    const filePath = this.getPDFFilePath(filename);
    return fs.existsSync(filePath);
  }

  /**
   * Читает PDF файл в буфер
   */
  static readPDFFile(filename: string): Buffer | null {
    try {
      const filePath = this.getPDFFilePath(filename);
      if (!this.fileExists(filename)) {
        return null;
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error("Error reading PDF file:", error);
      return null;
    }
  }

  /**
   * Удаляет PDF файл с диска
   */
  static deletePDFFile(filename: string): boolean {
    try {
      const filePath = this.getPDFFilePath(filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting PDF file:", error);
      return false;
    }
  }

  /**
   * Генерирует содержимое PDF в зависимости от типа документа
   */
  private static generatePDFContent(
    doc: PDFDocument,
    documentType: PDFDocumentType,
    data: Record<string, unknown>,
  ): void {
    // Заголовок
    doc.fontSize(20).text(this.getDocumentTypeTitle(documentType), { align: "center" });
    doc.moveDown(2);

    // Дата создания
    doc.fontSize(12).text(`Дата создания: ${new Date().toLocaleString("ru-RU")}`, {
      align: "right",
    });
    doc.moveDown(2);

    // Содержимое в зависимости от типа
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

  /**
   * Генерирует содержимое для результата анализа
   */
  private static generateAnalysisResultContent(
    doc: PDFDocument,
    data: Record<string, unknown>,
  ): void {
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
      (data.results as Array<Record<string, unknown>>).forEach((result, index) => {
        doc.fontSize(12).text(`${index + 1}. ${result.name || "Параметр"}: ${result.value || "N/A"}`);
        if (result.normalRange) {
          doc.fontSize(10).text(`   Норма: ${result.normalRange}`, { indent: 20 });
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

  /**
   * Генерирует содержимое для отчета о консультации
   */
  private static generateConsultationReportContent(
    doc: PDFDocument,
    data: Record<string, unknown>,
  ): void {
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

  /**
   * Генерирует содержимое для рецепта
   */
  private static generatePrescriptionContent(
    doc: PDFDocument,
    data: Record<string, unknown>,
  ): void {
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
      (data.medications as Array<Record<string, unknown>>).forEach((med, index) => {
        doc.fontSize(12).text(`${index + 1}. ${med.name || "Препарат"}`);
        if (med.dosage) {
          doc.fontSize(10).text(`   Дозировка: ${med.dosage}`, { indent: 20 });
        }
        if (med.frequency) {
          doc.fontSize(10).text(`   Частота приема: ${med.frequency}`, { indent: 20 });
        }
        if (med.duration) {
          doc.fontSize(10).text(`   Продолжительность: ${med.duration}`, { indent: 20 });
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

  /**
   * Генерирует содержимое для медицинской справки
   */
  private static generateMedicalCertificateContent(
    doc: PDFDocument,
    data: Record<string, unknown>,
  ): void {
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

  /**
   * Генерирует общее содержимое
   */
  private static generateGenericContent(
    doc: PDFDocument,
    data: Record<string, unknown>,
  ): void {
    if (data.title) {
      doc.fontSize(16).text(String(data.title), { underline: true });
      doc.moveDown();
    }

    if (data.content) {
      doc.fontSize(12).text(String(data.content));
    } else {
      // Выводим все данные как ключ-значение
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "title") {
          doc.fontSize(12).text(`${key}: ${String(value)}`);
          doc.moveDown(0.5);
        }
      });
    }
  }

  /**
   * Получает заголовок для типа документа
   */
  private static getDocumentTypeTitle(documentType: PDFDocumentType): string {
    const titles: Record<PDFDocumentType, string> = {
      ANALYSIS_RESULT: "Результаты анализа",
      CONSULTATION_REPORT: "Отчет о консультации",
      PRESCRIPTION: "Рецепт",
      MEDICAL_CERTIFICATE: "Медицинская справка",
      OTHER: "Документ",
    };
    return titles[documentType] || "Документ";
  }

  /**
   * Генерирует безопасное имя файла
   */
  private static generateSafeFilename(originalName: string): string {
    return originalName
      .replace(/[^a-zA-Z0-9а-яА-Я._-]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 100);
  }
}

