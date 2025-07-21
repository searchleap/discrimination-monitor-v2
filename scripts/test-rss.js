#!/usr/bin/env node

/**
 * Test RSS processing functionality
 * Usage: node scripts/test-rss.js
 */

const BASE_URL = 'http://localhost:3000'

async function testRSSProcessing() {
  console.log('🔄 Testing RSS processing...\n')

  try {
    // Test RSS feed processing
    const response = await fetch(`${BASE_URL}/api/process/rss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classify: true,
        maxFeeds: 2
      })
    })

    const data = await response.json()

    if (data.success) {
      console.log('✅ RSS processing successful!')
      console.log('📊 Statistics:')
      console.log(`   • Total feeds processed: ${data.data.stats.totalFeeds}`)
      console.log(`   • Successful feeds: ${data.data.stats.successfulFeeds}`)
      console.log(`   • Total articles: ${data.data.stats.totalArticles}`)
      console.log(`   • Michigan articles: ${data.data.stats.michiganArticles}`)
      console.log(`   • National articles: ${data.data.stats.nationalArticles}`)
      console.log(`   • International articles: ${data.data.stats.internationalArticles}`)
      console.log(`   • High severity: ${data.data.stats.highSeverityArticles}`)
      console.log(`   • Processing time: ${data.data.stats.processingTime}ms`)
      console.log(`   • Errors: ${data.data.stats.errors}`)

      if (data.data.articles.length > 0) {
        console.log('\n📰 Sample articles:')
        data.data.articles.slice(0, 3).forEach((article, index) => {
          console.log(`   ${index + 1}. ${article.title}`)
          console.log(`      Location: ${article.location} | Type: ${article.discriminationType} | Severity: ${article.severity}`)
          console.log(`      Source: ${article.source}`)
          console.log(`      URL: ${article.url}`)
          console.log('')
        })
      }

      if (data.data.errors.length > 0) {
        console.log('⚠️  Errors encountered:')
        data.data.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      }
    } else {
      console.log('❌ RSS processing failed:', data.error)
      if (data.details) {
        console.log('   Details:', data.details)
      }
    }
  } catch (error) {
    console.error('❌ Error testing RSS processing:', error.message)
  }
}

async function testFeedValidation() {
  console.log('\n🔄 Testing feed validation...\n')

  const testFeeds = [
    'https://feeds.feedburner.com/TechCrunch',
    'https://rss.cnn.com/rss/edition.rss',
    'https://invalid-url-test.com/rss'
  ]

  for (const feedUrl of testFeeds) {
    try {
      console.log(`Testing feed: ${feedUrl}`)
      
      const response = await fetch(`${BASE_URL}/api/feeds/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: feedUrl })
      })

      const data = await response.json()

      if (data.success) {
        console.log(`✅ Feed valid - Status: ${data.data.status}`)
        console.log(`   Articles found: ${data.data.articlesFound}`)
        console.log(`   Processing time: ${data.data.processingTime}ms`)
        
        if (data.data.sampleArticles.length > 0) {
          console.log('   Sample articles:')
          data.data.sampleArticles.forEach((article, index) => {
            console.log(`     ${index + 1}. ${article.title}`)
          })
        }
      } else {
        console.log(`❌ Feed invalid: ${data.error}`)
        if (data.details) {
          console.log(`   Details: ${data.details}`)
        }
      }
    } catch (error) {
      console.log(`❌ Error testing feed: ${error.message}`)
    }
    console.log('')
  }
}

async function main() {
  console.log('🚀 AI Discrimination Dashboard - RSS Processing Test\n')
  console.log('=' .repeat(60))
  
  await testRSSProcessing()
  await testFeedValidation()
  
  console.log('=' .repeat(60))
  console.log('✨ Testing completed!')
}

// Run the test
main().catch(console.error)