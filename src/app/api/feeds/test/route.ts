import { NextRequest, NextResponse } from 'next/server'
import { RSSProcessor } from '@/lib/rss-processor'
import { FeedCategory } from '@prisma/client'

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
    const testFeedData = {
      id: 'test-feed-' + Date.now(),
      name: 'Test Feed',
      url: body.url,
      category: FeedCategory.TECH_NEWS,
      isActive: true,
      status: 'ACTIVE' as const,
      successRate: 1.0,
      priority: 1,
      ...(body.customHeaders && { customHeaders: body.customHeaders })
    }

    // For testing, we'll use a simpler approach without database persistence
    const processor = new RSSProcessor()
    
    // First create the test feed in database temporarily for testing
    const { prisma } = await import('@/lib/prisma')
    const createdFeed = await prisma.feed.create({
      data: testFeedData
    })
    
    try {
      const result = await processor.processFeed(createdFeed.id)

      return NextResponse.json({
        success: true,
        data: {
          feedUrl: body.url,
          status: result.success ? 'ACTIVE' : 'ERROR',
          errorMessage: result.errors.length > 0 ? result.errors[0] : null,
          articlesFound: result.articlesProcessed,
          newArticles: result.newArticles,
          duplicates: result.duplicates,
          errors: result.errors
        }
      })
    } finally {
      // Clean up test feed
      await prisma.feed.delete({
        where: { id: createdFeed.id }
      }).catch(() => {}) // Ignore errors during cleanup
    }
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