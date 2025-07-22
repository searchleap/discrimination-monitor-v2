# Production Database Fix - Complete Setup Guide

## 🔍 Issue Identified

**Current Status**: Vercel app deployed but database tables don't exist
- ✅ Database connection: Working
- ❌ Database schema: Missing (tables not created)
- ❌ Seed data: Missing (no feeds or articles)

**Root Cause**: Production database needs schema creation and data seeding

## 🎯 Solution Options

### Option 1: One-Click API Initialization (Recommended)

**Step 1**: Add environment variable to Vercel:
```env
INIT_DATABASE_TOKEN=your-secure-token-here-123
```

**Step 2**: Trigger database initialization via API:
```bash
curl -X POST https://discrimination-monitor-v2.vercel.app/api/admin/init-database \
  -H "Authorization: Bearer your-secure-token-here-123" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Database initialized successfully", 
  "stats": {
    "feedsCreated": 20,
    "totalFeeds": 20,
    "totalArticles": 0
  }
}
```

### Option 2: Manual Database Setup

If you have access to your production database directly:

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Run database setup
npm run db:setup
# OR individually:
npx prisma db push --accept-data-loss
npx prisma db seed
```

### Option 3: Updated Deployment (Automated)

I've updated the build process to automatically create schema:

**Changes Made**:
1. Updated `postinstall` script to run `prisma db push` in production
2. Added production build command with database setup
3. Created initialization API endpoint

**Deployment**:
```bash
# The updated code will automatically:
# 1. Generate Prisma client
# 2. Create database schema (in production)
# 3. Build the application
```

## 🚀 Quick Fix Steps

### Immediate Action (5 minutes):

1. **Add Environment Variable in Vercel**:
   - Go to your Vercel dashboard
   - Navigate to Settings > Environment Variables  
   - Add: `INIT_DATABASE_TOKEN` = `discrimination-init-2025`

2. **Trigger Database Setup**:
   ```bash
   curl -X POST https://discrimination-monitor-v2.vercel.app/api/admin/init-database \
     -H "Authorization: Bearer discrimination-init-2025" \
     -H "Content-Type: application/json"
   ```

3. **Verify Setup**:
   - Visit: https://discrimination-monitor-v2.vercel.app/api/debug
   - Should show table counts instead of "table does not exist"
   - Visit: https://discrimination-monitor-v2.vercel.app/articles
   - Should show feed data instead of "No Articles Found"

## 📊 Post-Setup Verification

### Check These Endpoints:

1. **Health Check**: `/api/health` ✅
   ```json
   {"status":"healthy","database":"healthy"}
   ```

2. **Admin Status**: `/api/admin/status` ✅  
   ```json
   {"database":"connected","totalFeeds":20,"activeFeeds":20}
   ```

3. **Debug Info**: `/api/debug` ✅
   ```json
   {"database":"connected","feedCount":20,"articleCount":0}
   ```

4. **Feeds List**: `/api/feeds` ✅
   ```json
   {"success":true,"feeds":[...20 feeds...]}
   ```

5. **Articles**: `/articles` page ✅
   - Should show feed data and processing interface

## 🔄 Process RSS Feeds (Post-Setup)

After database initialization, trigger RSS processing:

1. **Via Admin Panel**:
   - Visit: `/admin`
   - Click "Process RSS Feeds" button

2. **Via API**:
   ```bash
   curl -X POST https://discrimination-monitor-v2.vercel.app/api/process/rss \
     -H "Content-Type: application/json" \
     -d '{"maxFeeds": 5}'
   ```

## 🎯 Expected Results

After successful setup:
- ✅ **Database**: Connected with 20+ RSS feeds
- ✅ **Admin Panel**: Shows active status
- ✅ **Articles Page**: Displays available feeds
- ✅ **RSS Processing**: Can fetch and process articles
- ✅ **All APIs**: Return data instead of errors

## 🚨 Troubleshooting

**If initialization fails**:
1. Check Vercel function logs
2. Verify DATABASE_URL is correct
3. Ensure database allows connections from Vercel
4. Check if database service is running

**If "table does not exist" persists**:
- The database schema creation may have failed
- May need manual `prisma db push` from local environment
- Contact database provider support

---

**Current Status**: Ready to execute database initialization
**Next Action**: Choose Option 1 (API initialization) for quickest fix