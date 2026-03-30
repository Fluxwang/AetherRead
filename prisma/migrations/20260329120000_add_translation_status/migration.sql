-- Add independent translation lifecycle fields
ALTER TABLE "Article" ADD COLUMN "translationStatus" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "Article" ADD COLUMN "translationError" TEXT;

UPDATE "Article"
SET "translationStatus" = 'ready'
WHERE "translatedText" IS NOT NULL
  AND TRIM("translatedText") <> '';

CREATE INDEX "Article_translationStatus_idx" ON "Article"("translationStatus");
