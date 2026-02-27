-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "doctorId" INTEGER,
ADD COLUMN     "serviceType" TEXT;

-- CreateIndex
CREATE INDEX "Payment_doctorId_idx" ON "Payment"("doctorId");

-- CreateIndex
CREATE INDEX "Payment_serviceType_idx" ON "Payment"("serviceType");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
