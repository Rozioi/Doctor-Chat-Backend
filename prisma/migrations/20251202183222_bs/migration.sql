-- DropIndex
DROP INDEX "public"."Review_patientId_doctorProfileId_chatId_key";

-- CreateIndex
CREATE INDEX "Review_chatId_idx" ON "Review"("chatId");
