-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "kanwil" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorMemo" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "approvedBy" TEXT,
    "distributedBy" TEXT,
    "distributedTo" TEXT NOT NULL DEFAULT '[]',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewedAt" DATETIME,
    "approvedAt" DATETIME,
    "distributedAt" DATETIME
);

-- CreateTable
CREATE TABLE "IzinPrinsip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorPermohonan" TEXT NOT NULL,
    "namaDebitur" TEXT NOT NULL,
    "kanwil" TEXT NOT NULL,
    "cabang" TEXT NOT NULL,
    "jenisKredit" TEXT NOT NULL,
    "nilaiPermohonan" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tanggalPengajuan" DATETIME NOT NULL,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Memo_nomorMemo_key" ON "Memo"("nomorMemo");

-- CreateIndex
CREATE UNIQUE INDEX "IzinPrinsip_nomorPermohonan_key" ON "IzinPrinsip"("nomorPermohonan");
