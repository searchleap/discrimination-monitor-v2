#!/bin/bash

# AI Discrimination Dashboard v2.0 - Production Deployment Script

set -e

echo "🚀 AI Discrimination Dashboard v2.0 - Production Deployment"
echo "=========================================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from project root directory"
    exit 1
fi

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Make sure environment variables are set in Vercel."
fi

# Run type check
echo "📝 Running TypeScript checks..."
npm run type-check

# Run lint
echo "🔧 Running ESLint..."
npm run lint

# Run build test
echo "🏗️  Testing production build..."
npm run build

# Check if build artifacts exist
if [ ! -d ".next" ]; then
    echo "❌ Error: Build failed - .next directory not found"
    exit 1
fi

echo "✅ Pre-deployment checks passed!"

# Database migration check
echo "🗄️  Database migration check..."
if [ -f ".env.local" ]; then
    echo "Running database migration..."
    npx prisma migrate deploy
    echo "Seeding database..."
    npx prisma db seed
else
    echo "⚠️  Skipping database migration (no .env.local found)"
fi

# Commit changes
echo "📝 Committing deployment-ready changes..."
git add -A
git commit -m "feat: production deployment configuration

- Add Vercel configuration with optimized settings
- Create health check endpoint for monitoring
- Update README with deployment instructions
- Add deployment script for automation
- Configure RSS processing timeout for production

🤖 Generated with [Memex](https://memex.tech)
Co-Authored-By: Memex <noreply@memex.tech>" || echo "No changes to commit"

echo "🏷️  Tagging release..."
git tag -a "v2.0.0-production" -m "Production deployment ready - v2.0.0"

echo "📋 Deployment checklist:"
echo "========================"
echo "1. ✅ Code committed and tagged"
echo "2. ⏳ Push to GitHub: git push origin main --tags"
echo "3. ⏳ Connect repository to Vercel"
echo "4. ⏳ Configure environment variables in Vercel:"
echo "   - DATABASE_URL"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL"
echo "5. ⏳ Deploy and test /api/health endpoint"
echo "6. ⏳ Test RSS processing: /api/process/rss"

echo ""
echo "🚀 Ready for production deployment!"
echo "Next steps: Push to GitHub and configure Vercel"