-- Create Partnership table
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "lastUpdateStatus" TEXT NOT NULL DEFAULT '',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "lastUpdateDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT NOT NULL DEFAULT '',
    "tasks" TEXT NOT NULL DEFAULT '[]',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
