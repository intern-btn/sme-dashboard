-- Add totpLastVerifiedAt to track 24h TOTP verification window
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "accessScope" TEXT NOT NULL DEFAULT 'national',
    "kanwil" TEXT,
    "cabang" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpLastVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("id", "username", "passwordHash", "displayName", "role", "accessScope", "kanwil", "cabang", "isActive", "mustChangePassword", "totpSecret", "totpEnabled", "createdAt")
  SELECT "id", "username", "passwordHash", "displayName", "role", "accessScope", "kanwil", "cabang", "isActive", "mustChangePassword", "totpSecret", "totpEnabled", "createdAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
