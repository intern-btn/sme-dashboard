-- Drop IzinPrinsip table (superseded by Memo with category field)
DROP TABLE IF EXISTS "IzinPrinsip";

-- Drop old unique index on nomorMemo
DROP INDEX IF EXISTS "Memo_nomorMemo_key";

-- Rebuild Memo table with new unified schema
-- (SQLite requires table rebuild to drop/rename columns)
CREATE TABLE "Memo_new" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "approvedAt" DATETIME,
    "distributedAt" DATETIME
);

-- Migrate existing Memo rows (judul → perihal, keep rest)
INSERT INTO "Memo_new" (
    "id", "nomorMemo", "perihal", "konten", "status",
    "createdBy", "reviewedBy", "approvedBy", "distributedBy",
    "distributedTo", "attachments", "notes",
    "createdAt", "updatedAt", "reviewedAt", "approvedAt", "distributedAt"
)
SELECT
    "id", "nomorMemo", "judul", "konten", "status",
    "createdBy", "reviewedBy", "approvedBy", "distributedBy",
    "distributedTo", "attachments", "notes",
    "createdAt", "updatedAt", "reviewedAt", "approvedAt", "distributedAt"
FROM "Memo";

DROP TABLE "Memo";
ALTER TABLE "Memo_new" RENAME TO "Memo";
