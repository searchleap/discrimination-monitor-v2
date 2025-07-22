#!/usr/bin/env node

/**
 * Test Articles API
 * 
 * Debug the articles API to see what's causing the failure
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testArticlesAPI() {
  console.log('🧪 Testing Articles API logic...')
  
  try {
    // Test the same query as the API route
    console.log('1. Testing basic article count...')
    const total = await prisma.article.count()
    console.log(`✅ Total articles: ${total}`)
    
    console.log('\n2. Testing article fetch with pagination...')
    const articles = await prisma.article.findMany({
      take: 20,
      skip: 0,
      orderBy: {
        publishedAt: 'desc'
      },
      include: {
        feed: {
          select: {
            name: true,
            category: true
          }
        }
      }
    })
    
    console.log(`✅ Found ${articles.length} articles`)
    
    if (articles.length > 0) {
      console.log('\n3. Sample article data:')
      const sample = articles[0]
      console.log(`Title: ${sample.title}`)
      console.log(`Source: ${sample.source}`)
      console.log(`Published: ${sample.publishedAt}`)
      console.log(`URL: ${sample.url}`)
      console.log(`Feed: ${sample.feed?.name} (${sample.feed?.category})`)
      console.log(`Location: ${sample.location}`)
      console.log(`Type: ${sample.discriminationType}`)
      console.log(`Severity: ${sample.severity}`)
    }
    
    console.log('\n4. Testing filtered queries...')
    
    // Test location filter
    const michiganArticles = await prisma.article.count({
      where: { location: 'MICHIGAN' }
    })
    console.log(`📍 Michigan articles: ${michiganArticles}`)
    
    const nationalArticles = await prisma.article.count({
      where: { location: 'NATIONAL' }
    })
    console.log(`🇺🇸 National articles: ${nationalArticles}`)
    
    const internationalArticles = await prisma.article.count({
      where: { location: 'INTERNATIONAL' }
    })
    console.log(`🌍 International articles: ${internationalArticles}`)
    
    // Test search
    console.log('\n5. Testing search functionality...')
    const searchResults = await prisma.article.count({
      where: {
        OR: [
          { title: { contains: 'privacy', mode: 'insensitive' } },
          { content: { contains: 'privacy', mode: 'insensitive' } }
        ]
      }
    })
    console.log(`🔍 Articles mentioning 'privacy': ${searchResults}`)
    
    console.log('\n✅ All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during testing:', error)
    console.error('Stack trace:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testArticlesAPI().catch(console.error)