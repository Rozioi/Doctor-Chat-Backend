-- CreateEnum
CREATE TYPE "PDFDocumentType" AS ENUM ('ANALYSIS_RESULT', 'CONSULTATION_REPORT', 'PRESCRIPTION', 'MEDICAL_CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "PDFDocument" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "documentType" "PDFDocumentType" NOT NULL,
    "userId" INTEGER,
    "chatId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PDFDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PDFDocument_userId_idx" ON "PDFDocument"("userId");

-- CreateIndex
CREATE INDEX "PDFDocument_chatId_idx" ON "PDFDocument"("chatId");

-- CreateIndex
CREATE INDEX "PDFDocument_documentType_idx" ON "PDFDocument"("documentType");

-- AddForeignKey
ALTER TABLE "PDFDocument" ADD CONSTRAINT "PDFDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDFDocument" ADD CONSTRAINT "PDFDocument_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
