-- CreateEnum
CREATE TYPE "FilterMode" AS ENUM ('OR', 'AND');

-- CreateTable
CREATE TABLE "ContentFilter" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "description" TEXT,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ContentFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilteringConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "filterMode" "FilterMode" NOT NULL DEFAULT 'OR',
    "minTermLength" INTEGER NOT NULL DEFAULT 3,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "articlesFiltered" INTEGER NOT NULL DEFAULT 0,
    "articlesAccepted" INTEGER NOT NULL DEFAULT 0,
    "lastApplied" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilteringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentFilter_isActive_idx" ON "ContentFilter"("isActive");

-- CreateIndex
CREATE INDEX "ContentFilter_category_idx" ON "ContentFilter"("category");

-- CreateIndex
CREATE INDEX "ContentFilter_term_idx" ON "ContentFilter"("term");

-- CreateIndex
CREATE INDEX "FilteringConfig_isActive_idx" ON "FilteringConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FilteringConfig_name_key" ON "FilteringConfig"("name");

-- Insert default configuration
INSERT INTO "FilteringConfig" ("id", "name", "isActive", "filterMode", "minTermLength", "caseSensitive", "updatedAt")
VALUES ('default-config', 'Default Filtering', false, 'OR', 3, false, CURRENT_TIMESTAMP);