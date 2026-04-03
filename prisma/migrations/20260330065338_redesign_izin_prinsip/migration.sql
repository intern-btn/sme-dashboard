/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `IzinPrinsip` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `IzinPrinsip` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiPermohonan` on the `IzinPrinsip` table. All the data in the column will be lost.
  - You are about to drop the column `nomorPermohonan` on the `IzinPrinsip` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalPengajuan` on the `IzinPrinsip` table. All the data in the column will be lost.
  - Added the required column `jenisIzinPrinsip` to the `IzinPrinsip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorTicket` to the `IzinPrinsip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perihal` to the `IzinPrinsip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submittedBy` to the `IzinPrinsip` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IzinPrinsip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorTicket" TEXT NOT NULL,
    "nomorMemoKC" TEXT,
    "nomorMemoResponse" TEXT,
    "kanwil" TEXT NOT NULL,
    "cabang" TEXT NOT NULL,
    "namaDebitur" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "jenisIzinPrinsip" TEXT NOT NULL,
    "jenisKredit" TEXT NOT NULL,
    "plafond" REAL,
    "jangkaWaktu" INTEGER,
    "keputusan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "submittedBy" TEXT NOT NULL,
    "handledBy" TEXT,
    "tanggalMemoKC" DATETIME,
    "tanggalResponse" DATETIME,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_IzinPrinsip" ("cabang", "createdAt", "id", "jenisKredit", "kanwil", "namaDebitur", "notes", "status", "updatedAt") SELECT "cabang", "createdAt", "id", "jenisKredit", "kanwil", "namaDebitur", "notes", "status", "updatedAt" FROM "IzinPrinsip";
DROP TABLE "IzinPrinsip";
ALTER TABLE "new_IzinPrinsip" RENAME TO "IzinPrinsip";
CREATE UNIQUE INDEX "IzinPrinsip_nomorTicket_key" ON "IzinPrinsip"("nomorTicket");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
