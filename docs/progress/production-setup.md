# Production Setup Guide - AI Discrimination Dashboard v2.0

## 🚀 Production Deployment Steps

### 1. Database Setup (PostgreSQL)

#### Option A: Neon (Recommended)
1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project: "AI Discrimination Dashboard"
3. Copy connection string
4. Run database migrations:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

#### Option B: Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create new project
3. Get PostgreSQL connection string
4. Run setup script:
   ```bash
   psql "postgresql://..." < scripts/setup-production-db.sql
   ```

### 2. Environment Variables

Set these in Vercel dashboard:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# AI Services (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.vercel.app"

# RSS Processing (optional)
RSS_PROCESSING_INTERVAL="0 6 * * *"
RSS_BATCH_SIZE="10"
```

### 3. Vercel Deployment

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import Git Repository
   - Select: `discrimination-monitor-for-ai`

2. **Configure Build Settings**:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**:
   - Go to Settings → Environment Variables
   - Add all variables from step 2

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

### 4. Post-Deployment Verification

1. **Health Check**:
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

2. **Database Test**:
   ```bash
   curl https://your-domain.vercel.app/api/articles
   ```

3. **RSS Processing Test**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/process/rss
   ```

### 5. Monitoring Setup

#### Error Monitoring
- Enable Vercel Error Monitoring
- Set up alerts for high error rates

#### Performance Monitoring
- Monitor `/api/health` endpoint
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Track RSS processing success rates

#### Database Monitoring
- Monitor connection pool usage
- Track query performance
- Set up alerts for long-running queries

### 6. Security Considerations

1. **Environment Variables**:
   - Never commit API keys to repository
   - Use different keys for production vs development
   - Rotate keys regularly

2. **Database Security**:
   - Use SSL connections
   - Implement connection pooling
   - Regular backups

3. **API Security**:
   - Implement rate limiting
   - Add CORS restrictions
   - Monitor for unusual traffic patterns

### 7. Scaling Considerations

#### Database Scaling
- Monitor connection count
- Consider read replicas for heavy queries
- Implement caching for frequently accessed data

#### Function Scaling
- RSS processing may need longer timeouts
- Consider background jobs for heavy processing
- Monitor memory usage

### 8. Backup Strategy

1. **Database Backups**:
   - Daily automated backups
   - Point-in-time recovery capability
   - Test restore procedures

2. **Code Backups**:
   - GitHub repository is primary backup
   - Tag releases for easy rollback
   - Document deployment process

### 9. Rollback Plan

1. **Database Rollback**:
   ```bash
   # Rollback to previous migration
   npx prisma migrate reset
   ```

2. **Code Rollback**:
   - Redeploy previous Git tag
   - Verify health endpoints
   - Update environment variables if needed

### 10. Performance Optimization

1. **Database Optimization**:
   - Run `ANALYZE` on tables regularly
   - Monitor slow queries
   - Optimize indexes based on usage patterns

2. **Application Optimization**:
   - Enable Next.js caching
   - Implement Redis for session storage
   - Optimize bundle size

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Check environment variables

2. **Database Connection Issues**:
   - Verify connection string format
   - Check SSL requirements
   - Verify database exists

3. **RSS Processing Issues**:
   - Check network connectivity
   - Verify feed URLs are accessible
   - Monitor timeout settings

### Debug Commands

```bash
# Check build locally
npm run build

# Test database connection
npx prisma db pull

# Test RSS processing
curl -X POST http://localhost:3000/api/process/rss

# Check logs
vercel logs your-deployment-url
```

---
*Created: 2025-01-10*  
*Last Updated: 2025-01-10*