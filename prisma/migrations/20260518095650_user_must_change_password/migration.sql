-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Memo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorMemo" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "perihal" TEXT NOT NULL DEFAULT '',
    "kepada" TEXT NOT NULL DEFAULT '[]',
    "dari" TEXT NOT NULL DEFAULT '',
    "tanggalMemo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "konten" TEXT NOT NULL DEFAULT '',
    "lampiranList" TEXT NOT NULL DEFAULT '[]',
    "tembusan" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_Memo" ("approvedAt", "approvedBy", "attachments", "category", "createdAt", "createdBy", "dari", "distributedAt", "distributedBy", "distributedTo", "id", "kepada", "konten", "lampiranList", "metadata", "nomorMemo", "notes", "perihal", "reviewedAt", "reviewedBy", "status", "tanggalMemo", "tembusan", "updatedAt") SELECT "approvedAt", "approvedBy", "attachments", "category", "createdAt", "createdBy", "dari", "distributedAt", "distributedBy", "distributedTo", "id", "kepada", "konten", "lampiranList", "metadata", "nomorMemo", "notes", "perihal", "reviewedAt", "reviewedBy", "status", "tanggalMemo", "tembusan", "updatedAt" FROM "Memo";
DROP TABLE "Memo";
ALTER TABLE "new_Memo" RENAME TO "Memo";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "kanwil" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "displayName", "id", "isActive", "kanwil", "passwordHash", "role", "totpEnabled", "totpSecret", "username") SELECT "createdAt", "displayName", "id", "isActive", "kanwil", "passwordHash", "role", "totpEnabled", "totpSecret", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
