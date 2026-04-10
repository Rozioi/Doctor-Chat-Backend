/*
  Warnings:

  - You are about to drop the column `anonymousId` on the `Chat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kaspiInvoiceId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'KASPI';

-- DropIndex
DROP INDEX "public"."Chat_anonymousId_key";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "anonymousId";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "kaspiExternalId" TEXT,
ADD COLUMN     "kaspiInvoiceId" TEXT,
ADD COLUMN     "kaspiPhone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_kaspiInvoiceId_key" ON "Payment"("kaspiInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_kaspiInvoiceId_idx" ON "Payment"("kaspiInvoiceId");
