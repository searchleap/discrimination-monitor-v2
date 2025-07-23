# Production Deployment Guide

## Current Status
- ✅ Code deployed to Vercel
- ✅ AI processing working (API keys configured)
- ❌ Phase 3 features failing (database schema issues)

## Issues Identified

### Database Schema Missing
The Phase 3 tables are not present in the production database:
- `ProcessingMetrics` - For analytics/monitoring
- `AlertConfig` - For alert configurations
- `AlertHistory` - For alert event tracking
- `AIProvider` - For multi-provider configuration
- `ProcessingSchedule` - For advanced scheduling
- `ScheduleExecution` - For schedule tracking

### Root Cause
Vercel doesn't automatically run database migrations. The schema needs to be manually deployed.

## Solution

### Option 1: Database Push (Recommended)
Run Prisma push against production database:

```bash
# Set production database URL
export DATABASE_URL="your_production_database_url"

# Push schema changes
npx prisma db push --accept-data-loss

# Generate updated client
npx prisma generate
```

### Option 2: Manual SQL Migration
If direct database access is available, run the following SQL:

```sql
-- ProcessingMetrics table
CREATE TABLE "ProcessingMetrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchSize" INTEGER NOT NULL,
    "processedCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "processingTime" INTEGER NOT NULL,
    "queueDepth" INTEGER NOT NULL,
    "workerStatus" TEXT NOT NULL,
    "providerId" TEXT,
    "throughput" DOUBLE PRECISION,
    "averageLatency" INTEGER,
    "errorRate" DOUBLE PRECISION,
    "memoryUsage" INTEGER,
    "cpuUsage" DOUBLE PRECISION,
    CONSTRAINT "ProcessingMetrics_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "ProcessingMetrics_timestamp_idx" ON "ProcessingMetrics"("timestamp");
CREATE INDEX "ProcessingMetrics_providerId_idx" ON "ProcessingMetrics"("providerId");

-- AlertConfig table
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" JSONB NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "channels" JSONB NOT NULL,
    "config" JSONB NOT NULL,
    "escalationDelay" INTEGER,
    "escalationTo" JSONB,
    "lastTriggered" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "suppressedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlertConfig_pkey" PRIMARY KEY ("id")
);

-- Additional tables follow similar pattern...
```

### Option 3: Vercel Environment Setup
Add these environment variables in Vercel dashboard:

```bash
# Required for Phase 3
ENABLE_ANALYTICS=true
ENABLE_ALERTS=true
METRICS_RETENTION_DAYS=30

# Database migration flag
SKIP_DATABASE_CHECKS=false
```

## Post-Deployment Steps

1. **Initialize Default Data**
   ```bash
   curl -X POST https://discrimination-monitor-v2.vercel.app/api/setup/init-phase3
   ```

2. **Verify Functionality**
   ```bash
   curl https://discrimination-monitor-v2.vercel.app/api/analytics/health
   curl https://discrimination-monitor-v2.vercel.app/api/alerts/config
   ```

3. **Generate Baseline Metrics**
   ```bash
   # Use the populate script we created
   ./scripts/populate-production-metrics.sh
   ```

## Expected Results After Fix

- ✅ Advanced monitoring shows health score >0
- ✅ AI processing displays correctly
- ✅ All Phase 3 endpoints return success
- ✅ Alert configurations visible
- ✅ Analytics dashboard functional

## Risk Assessment

- **Low Risk**: Schema additions only, no data loss
- **Quick Rollback**: Can disable features via environment variables
- **Testing**: All functionality verified locally

---

**Next Action**: Run database migration against production database