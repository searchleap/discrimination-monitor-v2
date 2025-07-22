#!/usr/bin/env node

/**
 * Clean Articles Script
 * 
 * This script checks for and removes any synthetic/mock articles from the database
 * to ensure only real RSS-processed articles are displayed.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanArticles() {
  console.log('🧹 Cleaning synthetic articles from database...')
  
  try {
    // First, let's see what articles exist
    const existingArticles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        source: true,
        publishedAt: true,
        createdAt: true,
        url: true
      },
      take: 10
    })
    
    console.log(`\n📊 Found ${existingArticles.length} sample articles:`)
    existingArticles.forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}"`)
      console.log(`   Source: ${article.source}`)
      console.log(`   Published: ${article.publishedAt}`)
      console.log(`   URL: ${article.url}`)
      console.log(`   Created: ${article.createdAt}`)
      console.log('')
    })
    
    // Get total count
    const totalArticles = await prisma.article.count()
    console.log(`📈 Total articles in database: ${totalArticles}`)
    
    // Check if these look like synthetic articles (future dates, generic URLs, etc.)
    const currentDate = new Date()
    const futureArticles = existingArticles.filter(article => 
      new Date(article.publishedAt) > currentDate
    )
    
    if (futureArticles.length > 0) {
      console.log(`\n⚠️  Found ${futureArticles.length} articles with future dates (likely synthetic)`)
      console.log('These articles will be removed...')
      
      // Remove articles with future publication dates
      const deleteResult = await prisma.article.deleteMany({
        where: {
          publishedAt: {
            gt: currentDate
          }
        }
      })
      
      console.log(`✅ Deleted ${deleteResult.count} synthetic articles`)
    }
    
    // Check for articles with generic/mock URLs
    const mockArticles = await prisma.article.findMany({
      where: {
        OR: [
          { url: { contains: 'example.com' } },
          { url: { contains: 'mock' } },
          { url: { contains: 'test' } },
          { url: { contains: 'sample' } },
          { source: { contains: 'Mock' } },
          { source: { contains: 'Sample' } },
          { source: { contains: 'Test' } }
        ]
      },
      select: { id: true, title: true, url: true, source: true }
    })
    
    if (mockArticles.length > 0) {
      console.log(`\n🎭 Found ${mockArticles.length} articles with mock/test indicators:`)
      mockArticles.forEach(article => {
        console.log(`- "${article.title}" from ${article.source} (${article.url})`)
      })
      
      const deleteMockResult = await prisma.article.deleteMany({
        where: {
          OR: [
            { url: { contains: 'example.com' } },
            { url: { contains: 'mock' } },
            { url: { contains: 'test' } },
            { url: { contains: 'sample' } },
            { source: { contains: 'Mock' } },
            { source: { contains: 'Sample' } },
            { source: { contains: 'Test' } }
          ]
        }
      })
      
      console.log(`✅ Deleted ${deleteMockResult.count} mock articles`)
    }
    
    // Final count
    const finalCount = await prisma.article.count()
    console.log(`\n📊 Final article count: ${finalCount}`)
    
    if (finalCount === 0) {
      console.log('✨ Database is clean! Ready for real RSS processing.')
    } else {
      console.log(`📰 ${finalCount} articles remaining - reviewing...`)
      
      // Show remaining articles
      const remaining = await prisma.article.findMany({
        select: {
          title: true,
          source: true,
          publishedAt: true,
          url: true
        },
        take: 5
      })
      
      console.log('\nRemaining articles:')
      remaining.forEach((article, index) => {
        console.log(`${index + 1}. "${article.title}" - ${article.source}`)
        console.log(`   ${article.url}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error cleaning articles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanArticles().catch(console.error)