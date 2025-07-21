# AI Discrimination Dashboard - Deployment Guide

## Overview

This guide covers the deployment of the AI Discrimination Monitoring Dashboard v2.0 from development environment to production.

## Prerequisites

### Required Services
- **Database**: PostgreSQL 14+ (Supabase, PlanetScale, or self-hosted)
- **AI Services**: OpenAI API key or Anthropic API key
- **Hosting**: Vercel (recommended) or any Node.js hosting platform
- **Domain**: Custom domain for production use

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# AI Services (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Application
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# RSS Processing
RSS_PROCESSING_INTERVAL="0 6 * * *"  # Daily at 6 AM
RSS_BATCH_SIZE="10"

# Features
ENABLE_ANALYTICS="true"
ENABLE_EXPORTS="true"
ENABLE_ALERTS="true"
```

## Database Setup

### 1. Choose Database Provider

#### Option A: Supabase (Recommended)
```bash
# Create project at https://supabase.com
# Get connection string from Settings > Database
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

#### Option B: PlanetScale
```bash
# Create database at https://planetscale.com
# Get connection string from Connect section
DATABASE_URL="mysql://[username]:[password]@[host]/[database]?sslaccept=strict"
```

#### Option C: Railway
```bash
# Create PostgreSQL database at https://railway.app
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/railway"
```

### 2. Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with RSS feeds
npx prisma db seed
```

### 3. Verify Database
```bash
# Open Prisma Studio to verify
npx prisma studio
```

## Vercel Deployment

### 1. Prepare for Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Build locally to test
npm run build
```

### 2. Deploy to Vercel
```bash
# Deploy from project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set up production domain
# - Configure environment variables
```

### 3. Configure Environment Variables
```bash
# Add environment variables via Vercel dashboard
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Or via CLI
vercel env add DATABASE_URL production
# Enter value when prompted
```

### 4. Deploy with Environment Variables
```bash
# Redeploy to apply environment variables
vercel --prod
```

## Alternative Deployment Options

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ai-discrimination-dashboard .
docker run -p 3000:3000 --env-file .env ai-discrimination-dashboard
```

### AWS Deployment
```bash
# Using AWS Amplify
amplify init
amplify add hosting
amplify publish
```

### Self-Hosted VPS
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Deploy application
git clone [repository]
cd discrimination-monitor-for-ai
npm install
npm run build

# Start with PM2
pm2 start npm --name "ai-dashboard" -- start
pm2 startup
pm2 save
```

## RSS Processing Automation

### Vercel Cron Jobs
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/process/rss",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### External Cron Service
```bash
# Using GitHub Actions (recommended for reliability)
# See .github/workflows/rss-processing.yml
curl -X POST "https://yourdomain.com/api/process/rss" \
     -H "Content-Type: application/json" \
     -d '{"classify": true, "maxFeeds": 78}'
```

## Monitoring and Health Checks

### Health Check Endpoint
```bash
# Test application health
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "services": {
    "database": "healthy",
    "ai": "healthy"
  }
}
```

### Monitoring Setup
```bash
# Vercel Analytics (automatic)
# Custom monitoring with Sentry
npm install @sentry/nextjs

# Environment monitoring
npm install @vercel/analytics
```

## Security Configuration

### Content Security Policy
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

### API Rate Limiting
```javascript
// Implement rate limiting for production
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

## Performance Optimization

### CDN Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['images.unsplash.com'],
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
}
```

### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_articles_location_date ON articles(location, published_at);
CREATE INDEX idx_articles_severity_date ON articles(severity, published_at);
CREATE INDEX idx_articles_discrimination_type ON articles(discrimination_type);
CREATE INDEX idx_feeds_active_status ON feeds(is_active, status);
```

## Backup and Recovery

### Database Backups
```bash
# Automated backups (Supabase/PlanetScale handle this)
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250109.sql
```

### Application Backups
```bash
# Code backup via Git
git push origin main

# Environment variables backup
vercel env ls > env-backup.txt
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Test connection
   npx prisma db push
   # Check environment variables
   echo $DATABASE_URL
   ```

2. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next
   npm run build
   ```

3. **RSS Processing Errors**
   ```bash
   # Test RSS endpoint
   curl -X POST https://yourdomain.com/api/process/rss
   # Check logs in Vercel dashboard
   ```

4. **AI Classification Failures**
   ```bash
   # Verify API keys
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

### Performance Issues
```bash
# Monitor database performance
# Check slow queries
# Optimize API response times
# Review Vercel function logs
```

## Post-Deployment Checklist

- [ ] Database schema deployed and seeded
- [ ] All environment variables configured
- [ ] RSS processing job scheduled and tested
- [ ] Health checks passing
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented
- [ ] Performance baseline established
- [ ] Security headers configured
- [ ] API rate limiting enabled
- [ ] Documentation updated

## Support and Maintenance

### Regular Tasks
- Monitor RSS feed health (weekly)
- Review AI classification accuracy (weekly)
- Database maintenance (monthly)
- Security updates (as needed)
- Performance optimization (quarterly)

### Scaling Considerations
- Database read replicas for high traffic
- CDN configuration for static assets
- API caching for frequently accessed data
- Horizontal scaling for RSS processing

---

**Last Updated**: 2025-01-09
**Version**: 2.0.0
**Environment**: Production Ready