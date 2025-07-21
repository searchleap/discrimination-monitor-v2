import { NextRequest, NextResponse } from 'next/server'
import { RSSProcessor } from '@/lib/rss-processor'
import { Feed } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    // Create a temporary feed for testing
    const testFeed: Feed = {
      id: 'test-feed',
      name: 'Test Feed',
      url: body.url,
      category: 'TECH_NEWS',
      isActive: true,
      lastFetched: null,
      status: 'ACTIVE',
      errorMessage: null,
      successRate: 1.0,
      customHeaders: body.customHeaders || null,
      processingRules: null,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const processor = new RSSProcessor()
    const result = await processor.processFeed(testFeed)

    return NextResponse.json({
      success: true,
      data: {
        feedUrl: body.url,
        status: result.feed.status,
        errorMessage: result.feed.errorMessage,
        articlesFound: result.articles.length,
        processingTime: result.processingTime,
        errors: result.errors,
        sampleArticles: result.articles.slice(0, 3).map(article => ({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source
        }))
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error testing feed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test feed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}