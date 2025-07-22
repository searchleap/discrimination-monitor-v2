# Manual Database Setup - Immediate Fix

## 🚨 Current Issue
The Vercel deployment is working but the **production database tables don't exist**. 

**Error**: `"The table 'public.Feed' does not exist in the current database"`

## 🎯 Immediate Solution

Since the API endpoint isn't deployed yet, we need to manually create the database schema.

### Step 1: Get Production Database URL

The production database URL is configured in Vercel environment variables. You'll need:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Step 2: Run Database Setup Locally

From your local machine, run these commands with the production DATABASE_URL:

```bash
# Export production database URL
export DATABASE_URL="your-production-database-url-here"

# Generate Prisma client
npx prisma generate

# Push schema to production database (creates tables)
npx prisma db push --accept-data-loss

# Seed with RSS feeds
npx prisma db seed

# Verify setup
npx prisma studio  # Optional: view data in browser
```

### Step 3: Alternative - Direct SQL Setup

If you have direct database access, run this SQL:

```sql
-- This will create the basic tables
-- (Generated from prisma/schema.prisma)

-- Create enums
CREATE TYPE "FeedCategory" AS ENUM ('CIVIL_RIGHTS', 'GOVERNMENT', 'ACADEMIC', 'TECH_NEWS', 'LEGAL', 'HEALTHCARE', 'MICHIGAN_LOCAL', 'EMPLOYMENT', 'DATA_ETHICS', 'ADVOCACY');

CREATE TYPE "Location" AS ENUM ('MICHIGAN', 'NATIONAL', 'INTERNATIONAL');

CREATE TYPE "DiscriminationType" AS ENUM ('RACIAL', 'RELIGIOUS', 'DISABILITY', 'GENERAL_AI', 'MULTIPLE');

CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "Status" AS ENUM ('ACTIVE', 'ERROR', 'DISABLED', 'MAINTENANCE');

-- Create main tables
CREATE TABLE "Feed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" "FeedCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetched" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "errorMessage" TEXT,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customHeaders" JSONB,
    "processingRules" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feed_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "location" "Location" NOT NULL DEFAULT 'NATIONAL',
    "discriminationType" "DiscriminationType" NOT NULL DEFAULT 'GENERAL_AI',
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
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

-- Add other tables as needed...
-- (Full schema available in prisma/schema.prisma)
```

## 🔄 Quick Test Method

**Option A**: Use online database manager
1. Login to your database provider (Neon, Supabase, etc.)
2. Run the SQL schema creation commands above
3. Insert a few test feeds manually

**Option B**: Use production environment variable
1. Get `DATABASE_URL` from Vercel settings
2. Set it in your local environment
3. Run `npx prisma db push` locally

## 🎯 Expected Result

After running the setup:
1. **Test**: https://discrimination-monitor-v2.vercel.app/api/debug
   - Should show table counts instead of "does not exist"
2. **Verify**: https://discrimination-monitor-v2.vercel.app/api/feeds
   - Should return feed data instead of error
3. **Check**: https://discrimination-monitor-v2.vercel.app/articles  
   - Should show feed interface instead of "No Articles Found"

## 🚨 Security Note

**Important**: Never commit production database URLs to Git. Use environment variables only.

---

**Status**: Waiting for manual database schema creation
**Priority**: High - this will immediately fix the "No Articles Found" issue