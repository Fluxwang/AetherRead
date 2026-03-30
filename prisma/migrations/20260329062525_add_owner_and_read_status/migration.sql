-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "originalUrl" TEXT,
    "sourceType" TEXT NOT NULL,
    "ownerTag" TEXT NOT NULL DEFAULT 'Wang',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "originalContent" TEXT NOT NULL,
    "summary" TEXT,
    "translatedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Article" ("createdAt", "id", "originalContent", "originalUrl", "sourceType", "status", "summary", "title", "translatedText", "updatedAt") SELECT "createdAt", "id", "originalContent", "originalUrl", "sourceType", "status", "summary", "title", "translatedText", "updatedAt" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE INDEX "Article_status_idx" ON "Article"("status");
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");
CREATE INDEX "Article_ownerTag_createdAt_idx" ON "Article"("ownerTag", "createdAt");
CREATE INDEX "Article_ownerTag_isRead_createdAt_idx" ON "Article"("ownerTag", "isRead", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
