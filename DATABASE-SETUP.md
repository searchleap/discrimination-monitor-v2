# Database Setup for AI Discrimination Monitor v2

## 🗄️ Neon PostgreSQL Database Setup

### Step 1: Create Database
1. Visit [neon.tech](https://neon.tech) and sign up/login
2. Create new project:
   - **Name**: `ai-discrimination-dashboard-v2`
   - **Database**: `ai_discrimination`  
   - **Region**: `us-east-1` (or closest to your users)

### Step 2: Copy Connection String
From your Neon dashboard, copy the connection string that looks like:
```
postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/ai_discrimination?sslmode=require
```

### Step 3: Update Environment Variables
In your Vercel project dashboard, set:
```
DATABASE_URL = [paste your connection string here]
```

### Step 4: Initialize Database Schema

After deployment, run these commands to set up the database:

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login and link to project
vercel login
vercel link

# Pull environment variables
vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# Seed initial data
npx prisma db seed
```

### Step 5: Verify Database Setup

Check these in your database after setup:

#### Expected Tables:
- `Feed` - RSS feed configurations (78 feeds)
- `Article` - Discrimination articles from feeds  
- `ProcessingLog` - System processing logs
- `SystemMetrics` - Daily analytics data

#### Sample Data Check:
```sql
-- Check if feeds were seeded
SELECT COUNT(*) as feed_count FROM "Feed";
-- Should return ~78 feeds

-- Check categories
SELECT category, COUNT(*) FROM "Feed" GROUP BY category;

-- Check Michigan priority feeds
SELECT name, url FROM "Feed" WHERE category = 'MICHIGAN_LOCAL';
```

### Step 6: Database Monitoring

Monitor your database health:
- **Connection Status**: Via `/api/health` endpoint
- **Usage Metrics**: Neon dashboard  
- **Query Performance**: Prisma logs
- **Data Growth**: Article count over time

## 🔧 Database Configuration Details

### Connection Pool Settings
Neon automatically manages connection pooling. Recommended settings in your app:

```env
# Connection pool limits for Vercel functions
DATABASE_URL="postgresql://...?connection_limit=1&pool_timeout=0"
```

### Performance Optimization
The database includes optimized indexes for:
- Article location and date queries
- Feed status monitoring
- Discrimination type filtering
- Geographic filtering (Michigan priority)

### Backup Strategy
Neon provides:
- **Automatic backups** every 24 hours
- **Point-in-time recovery** for paid plans
- **Branch databases** for testing

## 📊 Initial Data Structure

### RSS Feeds (78 total):
- **Civil Rights**: ACLU, NAACP, SPLC, ADL, EFF
- **Michigan Local**: MI Dept Civil Rights, Detroit Free Press, MLive
- **Government**: EEOC, DOJ Civil Rights, HUD
- **Academic**: Research institutions, university bias labs  
- **Tech News**: AI ethics, bias in technology
- **Healthcare**: Medical discrimination monitoring
- **Employment**: Workplace discrimination sources
- **Legal**: Court decisions, legal analysis

### Article Classifications:
- **Location**: Michigan, National, International
- **Type**: Racial, Religious, Disability, General AI
- **Severity**: Low, Medium, High impact

### Processing Pipeline:
1. **RSS Fetch**: Daily at 6 AM EST
2. **AI Classification**: OpenAI/Anthropic analysis
3. **Deduplication**: Cross-source duplicate detection
4. **Geographic Tagging**: Michigan priority identification
5. **Severity Assessment**: Impact level analysis

## 🚨 Troubleshooting

### Common Connection Issues:
```
Error: P1001: Can't reach database server
```
**Solution**: Check connection string format and network access

```
Error: P3009: migrate failed to create
```
**Solution**: Ensure database exists and user has CREATE privileges

```
Error: P2021: table does not exist
```
**Solution**: Run `npx prisma db push` to create schema

### Performance Issues:
- **Slow queries**: Check database indexes are created
- **Connection timeouts**: Verify connection pool settings  
- **High CPU usage**: Monitor for expensive RSS processing queries

---
**Database URL**: Set in Vercel environment variables
**Schema Version**: Latest (via Prisma migrations)
**Status**: Ready for production deployment