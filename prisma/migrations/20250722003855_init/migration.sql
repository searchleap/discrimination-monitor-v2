-- CreateEnum
CREATE TYPE "FeedCategory" AS ENUM ('CIVIL_RIGHTS', 'GOVERNMENT', 'ACADEMIC', 'TECH_NEWS', 'LEGAL', 'HEALTHCARE', 'MICHIGAN_LOCAL', 'EMPLOYMENT', 'DATA_ETHICS', 'ADVOCACY');

-- CreateEnum
CREATE TYPE "FeedStatus" AS ENUM ('ACTIVE', 'ERROR', 'DISABLED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ArticleLocation" AS ENUM ('MICHIGAN', 'NATIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "DiscriminationType" AS ENUM ('RACIAL', 'RELIGIOUS', 'DISABILITY', 'GENERAL_AI', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Feed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" "FeedCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetched" TIMESTAMP(3),
    "status" "FeedStatus" NOT NULL DEFAULT 'ACTIVE',
    "errorMessage" TEXT,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "customHeaders" JSONB,
    "processingRules" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "location" "ArticleLocation" NOT NULL,
    "discriminationType" "DiscriminationType" NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "organizations" TEXT[],
    "keywords" TEXT[],
    "entities" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "aiClassification" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "details" JSONB,
    "processingTime" INTEGER,
    "feedId" TEXT,
    "articleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalFeeds" INTEGER NOT NULL,
    "activeFeeds" INTEGER NOT NULL,
    "successfulFeeds" INTEGER NOT NULL,
    "failedFeeds" INTEGER NOT NULL,
    "totalArticles" INTEGER NOT NULL,
    "michiganArticles" INTEGER NOT NULL,
    "nationalArticles" INTEGER NOT NULL,
    "internationalArticles" INTEGER NOT NULL,
    "avgProcessingTime" INTEGER NOT NULL,
    "classificationAccuracy" DOUBLE PRECISION,
    "duplicateDetectionRate" DOUBLE PRECISION,
    "dailyActiveUsers" INTEGER,
    "exportDownloads" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feed_url_key" ON "Feed"("url");

-- CreateIndex
CREATE INDEX "Feed_category_idx" ON "Feed"("category");

-- CreateIndex
CREATE INDEX "Feed_status_idx" ON "Feed"("status");

-- CreateIndex
CREATE INDEX "Feed_isActive_idx" ON "Feed"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE INDEX "Article_location_publishedAt_idx" ON "Article"("location", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_discriminationType_idx" ON "Article"("discriminationType");

-- CreateIndex
CREATE INDEX "Article_severity_publishedAt_idx" ON "Article"("severity", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_source_publishedAt_idx" ON "Article"("source", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_processed_idx" ON "Article"("processed");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "ProcessingLog_type_status_idx" ON "ProcessingLog"("type", "status");

-- CreateIndex
CREATE INDEX "ProcessingLog_createdAt_idx" ON "ProcessingLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemMetrics_date_key" ON "SystemMetrics"("date");

-- CreateIndex
CREATE INDEX "SystemMetrics_date_idx" ON "SystemMetrics"("date");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
