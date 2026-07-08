/*
  Warnings:

  - You are about to drop the column `imagePath` on the `Scan` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `Scan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Scan" DROP CONSTRAINT "Scan_userId_fkey";

-- AlterTable
ALTER TABLE "Scan" DROP COLUMN "imagePath",
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
