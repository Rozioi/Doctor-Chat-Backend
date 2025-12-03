import { PDFDocumentType } from "@prisma/client";

export interface CreatePDFDocumentInput {
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  documentType: PDFDocumentType;
  userId?: number;
  chatId?: number;
  metadata?: Record<string, unknown>;
}

export interface PDFDocumentResponse {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  documentType: PDFDocumentType;
  userId?: number | null;
  chatId?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  url?: string; // URL для доступа к файлу
}

export interface GeneratePDFOptions {
  documentType: PDFDocumentType;
  userId?: number;
  chatId?: number;
  data: Record<string, unknown>; // Данные для генерации PDF
  metadata?: Record<string, unknown>;
}

export interface UploadPDFRequest {
  file: Buffer;
  originalName: string;
  documentType: PDFDocumentType;
  userId?: number;
  chatId?: number;
  metadata?: Record<string, unknown>;
}

