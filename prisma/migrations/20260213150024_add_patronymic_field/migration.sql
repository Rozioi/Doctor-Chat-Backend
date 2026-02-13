/*
  Warnings:

  - A unique constraint covering the columns `[robokassaInvoiceId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TariffType" AS ENUM ('STANDARD', 'VIP');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'ROBOKASSA';

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "tariffType" "TariffType" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "approbationUrl" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "robokassaInvoiceId" TEXT,
ADD COLUMN     "robokassaOutSum" TEXT,
ADD COLUMN     "robokassaSignature" TEXT,
ADD COLUMN     "splitAmount" DECIMAL(10,2),
ADD COLUMN     "splitMerchantId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "patronymic" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_robokassaInvoiceId_key" ON "Payment"("robokassaInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_robokassaInvoiceId_idx" ON "Payment"("robokassaInvoiceId");
