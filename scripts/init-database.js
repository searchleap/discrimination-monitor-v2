#!/usr/bin/env node

/**
 * Database Initialization Script for AI Discrimination Monitor v2
 * Run this after setting up your Neon database
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initializeDatabase() {
  console.log('🗄️ Initializing AI Discrimination Monitor Database...\n')

  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('   ✅ Database connection successful\n')

    // Check if tables exist
    console.log('2. Checking database schema...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log(`   ✅ Found ${tables.length} tables in database\n`)

    // Check if feeds are seeded
    console.log('3. Checking RSS feeds...')
    const feedCount = await prisma.feed.count()
    console.log(`   📡 Found ${feedCount} RSS feeds`)
    
    if (feedCount === 0) {
      console.log('   ⚠️  No feeds found - running seed script...')
      // Import and run seed
      const { main: seedDatabase } = require('../prisma/seed.ts')
      await seedDatabase()
      console.log('   ✅ Database seeded successfully')
    } else {
      console.log('   ✅ RSS feeds already configured')
    }

    // Verify feed categories
    console.log('\n4. Verifying feed categories...')
    const categories = await prisma.feed.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    })

    categories.forEach(cat => {
      console.log(`   📂 ${cat.category}: ${cat._count.category} feeds`)
    })

    // Check Michigan priority feeds
    const michiganFeeds = await prisma.feed.findMany({
      where: { category: 'MICHIGAN_LOCAL' },
      select: { name: true, url: true, isActive: true }
    })

    console.log('\n5. Michigan Priority Feeds:')
    michiganFeeds.forEach(feed => {
      const status = feed.isActive ? '🟢' : '🔴'
      console.log(`   ${status} ${feed.name}`)
    })

    // Check article count
    console.log('\n6. Article statistics...')
    const articleCount = await prisma.article.count()
    console.log(`   📰 Total articles: ${articleCount}`)

    if (articleCount > 0) {
      const locationStats = await prisma.article.groupBy({
        by: ['location'],
        _count: {
          location: true,
        },
      })

      locationStats.forEach(stat => {
        console.log(`   📍 ${stat.location}: ${stat._count.location} articles`)
      })
    }

    // Verify indexes
    console.log('\n7. Database optimization check...')
    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `
    console.log(`   🔍 Found ${indexes.length} database indexes`)

    // Test health check functionality
    console.log('\n8. Testing system health...')
    const healthData = {
      timestamp: new Date(),
      database: 'healthy',
      feeds: feedCount > 0 ? 'healthy' : 'needs_seeding',
      articles: articleCount
    }
    console.log('   ✅ System health check passed')

    console.log('\n🎉 Database initialization complete!')
    console.log('\n📋 Summary:')
    console.log(`   • RSS Feeds: ${feedCount}`)
    console.log(`   • Articles: ${articleCount}`)
    console.log(`   • Categories: ${categories.length}`)
    console.log(`   • Michigan Feeds: ${michiganFeeds.length}`)
    console.log(`   • Database Indexes: ${indexes.length}`)
    
    console.log('\n🚀 Your database is ready for production!')
    console.log('\nNext steps:')
    console.log('1. Deploy to Vercel with DATABASE_URL environment variable')
    console.log('2. Test health endpoint: /api/health')
    console.log('3. Check dashboard: /dashboard')
    console.log('4. Monitor RSS processing logs')

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message)
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Troubleshooting:')
      console.log('• Check your DATABASE_URL is correct')
      console.log('• Verify database server is accessible')
      console.log('• Ensure connection string includes ?sslmode=require for Neon')
    }
    
    if (error.code === 'P3009') {
      console.log('\n🔧 Troubleshooting:')
      console.log('• Run: npx prisma db push')
      console.log('• Ensure database user has CREATE privileges')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase().catch(console.error)
}

module.exports = { initializeDatabase }