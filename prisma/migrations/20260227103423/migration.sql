-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'FREEDOMPAY';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "freedompayOrderId" TEXT,
ADD COLUMN     "freedompayPaymentId" TEXT,
ADD COLUMN     "freedompayRedirectUrl" TEXT;

-- CreateIndex
CREATE INDEX "Payment_freedompayPaymentId_idx" ON "Payment"("freedompayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_freedompayOrderId_idx" ON "Payment"("freedompayOrderId");
