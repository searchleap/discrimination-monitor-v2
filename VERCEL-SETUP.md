# Vercel Deployment Setup Guide

## 🚀 Quick Deployment Steps

### 1. Import Repository to Vercel
- Go to [Vercel Dashboard](https://vercel.com/new)
- Import: `https://github.com/searchleap/discrimination-monitor-v2`
- Vercel will auto-detect Next.js framework

### 2. Set Environment Variables
In your Vercel project dashboard, add these environment variables:

#### Required Variables:
```env
DATABASE_URL=postgresql://user:password@host:5432/database_name
OPENAI_API_KEY=sk-proj-...
NEXTAUTH_SECRET=your-secure-random-32-character-string
NEXTAUTH_URL=https://your-project-name.vercel.app
```

#### Optional Variables:
```env
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://localhost:6379
RSS_PROCESSING_INTERVAL=0 6 * * *
RSS_BATCH_SIZE=10
ENABLE_ANALYTICS=true
ENABLE_EXPORTS=true
ENABLE_ALERTS=true
```

### 3. Database Setup Options

#### Option A: Neon (Recommended)
1. Go to [Neon](https://neon.tech)
2. Create new project: `ai-discrimination-dashboard`
3. Copy connection string to `DATABASE_URL`

#### Option B: Supabase
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database

#### Option C: Railway
1. Go to [Railway](https://railway.app)
2. Deploy PostgreSQL template
3. Use provided connection string

### 4. Generate NEXTAUTH_SECRET
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```
Or use this online generator: https://generate-secret.vercel.app/32

### 5. Deploy
- Click "Deploy" in Vercel
- Wait for build to complete (2-3 minutes)
- Visit your deployed app

### 6. Post-Deployment Setup

#### Initialize Database:
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run database migrations
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

### 7. Verify Deployment

Check these endpoints after deployment:

- **Health Check**: `https://your-app.vercel.app/api/health`
- **Dashboard**: `https://your-app.vercel.app/dashboard`
- **API Status**: `https://your-app.vercel.app/api/stats/summary`

Expected health check response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-21T...",
  "version": "2.0.0",
  "services": {
    "database": "healthy",
    "ai": "healthy", 
    "rss": "healthy"
  }
}
```

## 🔧 Troubleshooting

### Database Connection Issues:
- Ensure `DATABASE_URL` is properly formatted
- Check database server allows connections from `0.0.0.0/0` (Vercel IPs)
- Verify database exists and credentials are correct

### Build Failures:
- Check Vercel build logs for specific errors
- Ensure all required environment variables are set
- Verify Node.js version compatibility

### API Errors:
- Check Vercel function logs
- Verify API keys are valid and have required permissions
- Ensure CORS settings allow your domain

## 📊 Performance Monitoring

After deployment, monitor:
- **Health endpoint**: Should return 200 status
- **RSS processing**: Check logs for successful feed processing
- **Database performance**: Monitor connection pool usage
- **API response times**: Should be under 2 seconds

## 🔒 Security Checklist

- [ ] Database credentials secure
- [ ] API keys properly configured
- [ ] NEXTAUTH_SECRET is random and secure
- [ ] No sensitive data in public repository
- [ ] Database accepts only encrypted connections

---
**Repository**: https://github.com/searchleap/discrimination-monitor-v2
**Status**: Ready for Production Deployment