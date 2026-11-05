/*
  Warnings:

  - Added the required column `title` to the `DiaryNote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiaryNote" ADD COLUMN     "title" TEXT NOT NULL;
