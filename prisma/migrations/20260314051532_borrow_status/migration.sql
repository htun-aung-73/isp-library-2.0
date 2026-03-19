/*
  Warnings:

  - The `status` column on the `borrowed_books` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('borrowed', 'returned', 'overdue');

-- AlterTable
ALTER TABLE "borrowed_books" DROP COLUMN "status",
ADD COLUMN     "status" "BorrowStatus" NOT NULL DEFAULT 'borrowed';
