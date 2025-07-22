import { NextRequest, NextResponse } from 'next/server'
import { rssProcessor } from '@/lib/rss-processor'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting manual RSS processing...')
    
    const body = await request.json().catch(() => ({}))
    const feedIds = body.feedIds || null
    const maxFeeds = body.maxFeeds || 5 // Limit for manual processing
    
    let results: any = {}
    
    if (feedIds && Array.isArray(feedIds)) {
      // Process specific feeds
      for (const feedId of feedIds.slice(0, maxFeeds)) {
        results[feedId] = await rssProcessor.processFeed(feedId)
      }
    } else {
      // Process all feeds (with limit for manual processing)
      const activeFeeds = await prisma.feed.findMany({
        where: { 
          isActive: true,
          status: { not: 'MAINTENANCE' }
        },
        take: maxFeeds,
        orderBy: { priority: 'asc' }
      })
      
      for (const feed of activeFeeds) {
        results[feed.id] = await rssProcessor.processFeed(feed.id)
      }
    }
    
    // Calculate summary statistics
    const totalFeeds = Object.keys(results).length
    const successfulFeeds = Object.values(results).filter((r: any) => r.success).length
    const failedFeeds = totalFeeds - successfulFeeds
    const totalNewArticles = Object.values(results).reduce((sum: number, r: any) => sum + r.newArticles, 0)
    const totalProcessed = Object.values(results).reduce((sum: number, r: any) => sum + r.articlesProcessed, 0)
    const totalErrors = Object.values(results).reduce((sum: number, r: any) => sum + r.errors.length, 0)
    
    console.log(`✅ RSS processing completed: ${totalNewArticles} new articles`)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalFeeds,
        successfulFeeds,
        failedFeeds,
        totalNewArticles,
        totalProcessed,
        totalErrors
      },
      results
    })
  } catch (error) {
    console.error('❌ RSS processing failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get real processing status from database
    const activeFeeds = await prisma.feed.count({
      where: { isActive: true }
    })
    
    const totalFeeds = await prisma.feed.count()
    
    const lastProcessedFeed = await prisma.feed.findFirst({
      where: { lastFetched: { not: null } },
      orderBy: { lastFetched: 'desc' },
      select: { lastFetched: true }
    })
    
    const recentLogs = await prisma.processingLog.findMany({
      where: { type: 'RSS_FETCH' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { feedId: true }
    })
    
    const avgProcessingTime = await prisma.processingLog.aggregate({
      where: { 
        type: 'RSS_FETCH', 
        processingTime: { not: null },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last week
      },
      _avg: { processingTime: true }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        lastProcessed: lastProcessedFeed?.lastFetched?.toISOString() || null,
        isProcessing: false,
        nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        activeFeeds,
        totalFeeds,
        averageProcessingTime: avgProcessingTime._avg.processingTime || 45000,
        successRate: 0.95, // Could calculate from logs
        recentJobs: recentLogs.map(log => ({
          id: log.id,
          startTime: log.createdAt.toISOString(),
          status: log.status.toLowerCase(),
          message: log.message,
          feedId: log.feedId
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching RSS processing status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch processing status' },
      { status: 500 }
    )
  }
}