# AI Discrimination Monitoring Dashboard v2.0

A modern, scalable real-time monitoring system for tracking AI-related discrimination incidents affecting disability, racial, religious communities, and general AI discrimination concerns. Built for Michigan Department of Civil Rights officials, advocacy organizations, and research institutions.

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- OpenAI/Anthropic API key

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd discrimination-monitor-for-ai
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# Database setup
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 🚀 Production Deployment

### Vercel Deployment

1. **Create Database**: Set up PostgreSQL database (Neon/Supabase/Railway)
2. **Configure Environment**: Set environment variables in Vercel dashboard
3. **Deploy**: Connect GitHub repository to Vercel

#### Environment Variables (Vercel)
```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

#### Build Configuration
The project includes `vercel.json` with optimized settings:
- RSS processing timeout: 60 seconds
- Region: `iad1` (US East)
- Framework: Next.js with automatic optimization

### Health Check
Monitor deployment health at `/api/health`

### Database Migration
```bash
# Production database setup
npx prisma migrate deploy
npx prisma db seed

# Optional: Run performance optimizations
psql $DATABASE_URL < scripts/setup-production-db.sql
```

### Testing RSS Feeds
```bash
# Test RSS feed processing
curl -X POST https://your-domain.vercel.app/api/process/rss

# Check processing logs
curl https://your-domain.vercel.app/api/logs
```

### Production Checklist
- [ ] Database connected and migrated
- [ ] Environment variables configured
- [ ] Health check passing (`/api/health`)
- [ ] RSS processing working
- [ ] All API endpoints responding
- [ ] Dashboard metrics updating

See [Production Setup Guide](docs/progress/production-setup.md) for detailed instructions.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 + App Router + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **State**: TanStack Query + Zustand
- **Charts**: Recharts
- **Deployment**: Vercel

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Main dashboard pages
│   ├── admin/              # Admin panel
│   ├── api/                # API routes
│   └── globals.css         # Global styles
├── components/             # Reusable components
│   ├── ui/                 # shadcn/ui components
│   ├── charts/             # Chart components
│   └── dashboard/          # Dashboard-specific components
├── lib/                    # Utilities and configurations
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
└── types/                  # TypeScript definitions
```

## 📊 Key Features

### Dashboard Views
- **Overview**: High-level metrics and trends with Michigan incidents prominently displayed
- **Article Explorer**: Advanced filtering by location, discrimination type, severity, and date
- **Analytics**: Interactive charts showing trends and patterns
- **Admin Panel**: RSS feed management and system monitoring

### Data Processing
- **78 RSS Feeds**: Daily processing of curated discrimination-related news sources
- **AI Classification**: Automated categorization by location, type, and severity
- **6-Month Rolling Window**: Focused on recent incidents with fallback logic
- **Duplicate Detection**: Smart deduplication across sources

### Smart Filtering
- **Geographic**: Michigan, National, International
- **Discrimination Type**: Racial, Religious, Disability, General AI
- **Severity**: Low, Medium, High impact
- **Date Range**: Custom picker with presets
- **Full-text Search**: Article titles and content

## 🚀 Development

### Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
```

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_discrimination"

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Application
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 🔧 API Endpoints

### Articles
- `GET /api/articles` - List articles with filtering
- `GET /api/articles/[id]` - Get single article
- `GET /api/articles/export` - Export articles as CSV/PDF

### Analytics
- `GET /api/stats/summary` - Dashboard metrics
- `GET /api/analytics/trends` - Trend analysis data

### Admin
- `GET /api/feeds` - List RSS feeds
- `POST /api/feeds` - Add new feed
- `PUT /api/feeds/[id]` - Update feed
- `POST /api/feeds/test` - Test feed connectivity

## 🧪 Testing

### Test Coverage Requirements
- Unit tests: ≥80% coverage
- Integration tests: All API endpoints
- E2E tests: Critical user flows
- Accessibility tests: WCAG 2.1 AA compliance

### Running Tests
```bash
npm run test           # All tests
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e       # End-to-end tests
npm run test:a11y      # Accessibility tests
npm run test:rss       # RSS processing tests
```

### RSS Processing Test
```bash
# Test RSS processing functionality
npm run test:rss

# Expected output:
# ✅ RSS processing successful!
# 📊 Statistics: 2 feeds processed, 25 articles found
# ⚠️ Some feeds may show errors due to CORS/proxy limitations
```

## 📈 Performance Targets

- **Page Load**: < 2 seconds initial load
- **Filter Response**: < 500ms
- **Search**: < 300ms
- **RSS Processing**: < 30 minutes daily
- **Uptime**: 95% across all feeds

## 🛡️ Security

- No personal data collection
- Environment-based API key management
- Role-based access control
- GDPR/CCPA compliance
- Rate limiting on API endpoints

## 🔄 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Environment variables
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
```

### Manual Deployment
```bash
npm run build
npm run start
```

## 📚 Documentation

- [Implementation Plan](docs/progress/ai_discrimination_dashboard_v2_plan.md)
- [API Documentation](docs/api/README.md)
- [Database Schema](docs/database/README.md)
- [Deployment Guide](docs/deployment/README.md)

## 🤝 Contributing

1. Follow conventional commits: `feat:`, `fix:`, `docs:`
2. Write tests for new features
3. Ensure accessibility compliance
4. Run linting and tests before submitting
5. Update documentation as needed

## 📋 Roadmap

### Phase 1: Foundation (Weeks 1-4) ✅ COMPLETED
- [x] Project setup and basic structure
- [x] RSS feed processing pipeline
- [x] Database schema and migrations
- [x] Basic dashboard UI
- [x] AI classification system

### Phase 2: Core Features (Weeks 5-8)
- [ ] Advanced filtering system
- [ ] Interactive charts
- [ ] Admin panel
- [ ] Export functionality
- [ ] Mobile responsive design

### Phase 3: Intelligence (Weeks 9-12)
- [ ] Trend analysis
- [ ] Alert system
- [ ] External API
- [ ] Performance optimization

### Phase 4: Launch (Weeks 13-16)
- [ ] User testing
- [ ] Documentation
- [ ] Training materials
- [ ] Go-live preparation

## 🎯 Success Metrics

- **Technical**: 95% feed uptime, < 2s page loads, 90% classification accuracy
- **User**: < 30s time to insights, > 40% mobile usage
- **Business**: Daily active usage by target stakeholders

## 📞 Support

For questions or issues:
- Review [Documentation](docs/)
- Check [Issues](../../issues)
- Contact: [project-team@example.com](mailto:project-team@example.com)

---

**Status**: Phase 1 Complete - Ready for Phase 2 Development
**Last Updated**: 2025-01-09
**Next Milestone**: Advanced Filtering and Interactive Charts

### Phase 1 Achievements ✅
- **RSS Processing**: 78 feeds operational with retry logic and proxy support
- **AI Classification**: OpenAI/Anthropic integration with keyword fallback
- **API Infrastructure**: Complete RESTful API with comprehensive endpoints
- **Dashboard Foundation**: Hero metrics, basic charts, filters, and article grid
- **Database Schema**: Optimized PostgreSQL schema with proper indexing
- **Testing**: RSS processing verification and build system validation

🤖 Generated with [Memex](https://memex.tech)
Co-Authored-By: Memex <noreply@memex.tech>