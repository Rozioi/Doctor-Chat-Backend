/*
  Warnings:

  - A unique constraint covering the columns `[anonymousId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "anonymousId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_anonymousId_key" ON "Chat"("anonymousId");
