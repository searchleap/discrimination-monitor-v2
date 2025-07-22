import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, FeedCategory, FeedStatus } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in specific conditions
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.INIT_DATABASE_TOKEN || 'dev-init-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting database initialization...')
    
    // Check if tables exist by trying to count feeds
    let tablesExist = false
    try {
      await prisma.feed.count()
      tablesExist = true
      console.log('✅ Database tables already exist')
    } catch (error) {
      console.log('📋 Database tables need to be created')
    }

    // If tables don't exist, we need to create them via Prisma migrate
    if (!tablesExist) {
      return NextResponse.json({
        success: false,
        error: 'Database schema not found. Please run "npx prisma db push" manually.',
        message: 'This endpoint can only seed data after schema is created.'
      }, { status: 500 })
    }

    // Check if data already exists
    const existingFeeds = await prisma.feed.count()
    if (existingFeeds > 0) {
      console.log(`📊 Database already has ${existingFeeds} feeds`)
      return NextResponse.json({
        success: true,
        message: 'Database already initialized',
        stats: {
          feeds: existingFeeds,
          articles: await prisma.article.count()
        }
      })
    }

    // Seed the database with feeds
    console.log('🌱 Seeding database with RSS feeds...')
    
    const feeds = [
      // Civil Rights Organizations
      { name: 'ACLU News', url: 'https://www.aclu.org/news/feed', category: FeedCategory.CIVIL_RIGHTS, priority: 1 },
      { name: 'NAACP Latest News', url: 'https://naacp.org/latest-news/feed/', category: FeedCategory.CIVIL_RIGHTS, priority: 1 },
      { name: 'Southern Poverty Law Center', url: 'https://www.splcenter.org/rss.xml', category: FeedCategory.CIVIL_RIGHTS, priority: 1 },
      { name: 'Anti-Defamation League', url: 'https://www.adl.org/rss-feeds/all-news', category: FeedCategory.CIVIL_RIGHTS, priority: 1 },
      { name: 'Electronic Frontier Foundation', url: 'https://www.eff.org/rss/updates.xml', category: FeedCategory.CIVIL_RIGHTS, priority: 1 },
      
      // Government Sources
      { name: 'EEOC Press Releases', url: 'https://www.eeoc.gov/rss/eeoc-press-releases.xml', category: FeedCategory.GOVERNMENT, priority: 1 },
      { name: 'DOJ Civil Rights Division', url: 'https://www.justice.gov/rss/civil-rights/news.xml', category: FeedCategory.GOVERNMENT, priority: 1 },
      { name: 'FTC Tech News', url: 'https://www.ftc.gov/rss/news/technology', category: FeedCategory.GOVERNMENT, priority: 2 },
      
      // Academic & Research
      { name: 'AI Now Institute', url: 'https://ainowinstitute.org/feed/', category: FeedCategory.ACADEMIC, priority: 1 },
      { name: 'MIT Technology Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', category: FeedCategory.ACADEMIC, priority: 1 },
      { name: 'Stanford HAI News', url: 'https://hai.stanford.edu/news/feed', category: FeedCategory.ACADEMIC, priority: 1 },
      { name: 'Berkeley AI Research', url: 'https://bair.berkeley.edu/blog/feed.xml', category: FeedCategory.ACADEMIC, priority: 2 },
      
      // Technology News
      { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: FeedCategory.TECH_NEWS, priority: 1 },
      { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', category: FeedCategory.TECH_NEWS, priority: 1 },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', category: FeedCategory.TECH_NEWS, priority: 2 },
      { name: 'IEEE Spectrum AI', url: 'https://spectrum.ieee.org/rss/tag/artificial-intelligence', category: FeedCategory.TECH_NEWS, priority: 2 },
      
      // Michigan Local Sources
      { name: 'Detroit Free Press', url: 'https://www.freep.com/rss/', category: FeedCategory.MICHIGAN_LOCAL, priority: 1 },
      { name: 'MLive Michigan News', url: 'https://www.mlive.com/news/index.ssf/rss.xml', category: FeedCategory.MICHIGAN_LOCAL, priority: 1 },
      { name: 'Bridge Michigan', url: 'https://www.bridgemi.com/rss.xml', category: FeedCategory.MICHIGAN_LOCAL, priority: 1 },
      { name: 'Michigan Radio', url: 'https://www.michiganradio.org/rss/', category: FeedCategory.MICHIGAN_LOCAL, priority: 2 },
    ]

    // Create feeds
    let createdCount = 0
    for (const feedData of feeds) {
      try {
        await prisma.feed.create({
          data: {
            ...feedData,
            id: `feed-${createdCount + 1}`,
            isActive: true,
            status: FeedStatus.ACTIVE,
            successRate: 0.0,
          }
        })
        createdCount++
      } catch (error) {
        console.error(`Error creating feed ${feedData.name}:`, error)
      }
    }

    console.log(`✅ Created ${createdCount} RSS feeds`)

    // Create initial system metrics
    try {
      await prisma.systemMetrics.create({
        data: {
          totalFeeds: createdCount,
          activeFeeds: createdCount,
          successfulFeeds: 0,
          failedFeeds: 0,
          totalArticles: 0,
          michiganArticles: 0,
          nationalArticles: 0,
          internationalArticles: 0,
          avgProcessingTime: 0,
        }
      })
      console.log('✅ Created initial system metrics')
    } catch (error) {
      console.error('Error creating system metrics:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      stats: {
        feedsCreated: createdCount,
        totalFeeds: await prisma.feed.count(),
        totalArticles: await prisma.article.count()
      }
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also allow GET to check initialization status
export async function GET() {
  try {
    const feedCount = await prisma.feed.count()
    const articleCount = await prisma.article.count()
    
    return NextResponse.json({
      initialized: feedCount > 0,
      stats: {
        feeds: feedCount,
        articles: articleCount
      }
    })
  } catch (error) {
    return NextResponse.json({
      initialized: false,
      error: 'Cannot check database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}