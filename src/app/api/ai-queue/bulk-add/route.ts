import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingQueue } from '@/lib/ai-queue'
import { prisma } from '@/lib/prisma'
import { QueuePriority } from '@prisma/client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { 
      articleIds, 
      priority = 'MEDIUM',
      filters 
    } = body
    
    let targetArticleIds: string[] = []
    
    // If specific article IDs provided, use them
    if (articleIds && Array.isArray(articleIds)) {
      targetArticleIds = articleIds
      console.log(`📝 Bulk adding ${articleIds.length} specific articles to AI queue...`)
    }
    // If filters provided, find articles matching filters
    else if (filters) {
      console.log('🔍 Finding articles matching filters for bulk queue addition...')
      
      const whereClause: any = {}
      
      // Only include unprocessed articles
      whereClause.processed = false
      
      // Apply filters
      if (filters.feedIds && filters.feedIds.length > 0) {
        whereClause.feedId = { in: filters.feedIds }
      }
      
      if (filters.location && filters.location.length > 0) {
        whereClause.location = { in: filters.location }
      }
      
      if (filters.severity && filters.severity.length > 0) {
        whereClause.severity = { in: filters.severity }
      }
      
      if (filters.publishedAfter) {
        whereClause.publishedAt = { gte: new Date(filters.publishedAfter) }
      }
      
      if (filters.publishedBefore) {
        whereClause.publishedAt = { 
          ...whereClause.publishedAt, 
          lte: new Date(filters.publishedBefore) 
        }
      }
      
      // Exclude articles already in queue
      whereClause.processingQueue = null
      
      const articles = await prisma.article.findMany({
        where: whereClause,
        select: { id: true },
        take: filters.limit || 1000 // Safety limit
      })
      
      targetArticleIds = articles.map(a => a.id)
      console.log(`📊 Found ${targetArticleIds.length} articles matching filters`)
    }
    // If no specific criteria, add all unprocessed articles
    else {
      console.log('📋 Adding all unprocessed articles to AI queue...')
      
      const articles = await prisma.article.findMany({
        where: {
          processed: false,
          processingQueue: null // Not already in queue
        },
        select: { id: true },
        take: 1000 // Safety limit
      })
      
      targetArticleIds = articles.map(a => a.id)
      console.log(`📊 Found ${targetArticleIds.length} unprocessed articles`)
    }
    
    if (targetArticleIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles found matching criteria',
        summary: {
          attempted: 0,
          added: 0,
          skipped: 0,
          errors: 0,
          processingTime: Date.now() - startTime
        }
      })
    }
    
    // Validate priority
    const validPriority = ['HIGH', 'MEDIUM', 'LOW'].includes(priority) 
      ? priority as QueuePriority 
      : QueuePriority.MEDIUM
    
    // Bulk add to queue
    console.log(`⚡ Bulk adding ${targetArticleIds.length} articles with priority ${validPriority}...`)
    
    const result = await aiProcessingQueue.bulkAddToQueue(targetArticleIds, validPriority)
    
    // Get updated queue metrics
    const queueMetrics = await aiProcessingQueue.getQueueMetrics()
    
    const processingTime = Date.now() - startTime
    
    console.log(`✅ Bulk add completed: ${result.added} added, ${result.skipped} skipped, ${result.errors.length} errors (${processingTime}ms)`)
    
    return NextResponse.json({
      success: true,
      message: `Bulk add completed: ${result.added} articles added to queue`,
      summary: {
        attempted: targetArticleIds.length,
        added: result.added,
        skipped: result.skipped,
        errors: result.errors.length,
        processingTime
      },
      result,
      queueMetrics
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('❌ Bulk add to AI queue failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bulk add failed',
        processingTime
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get information about articles that can be bulk added
    const [unprocessedCount, queueMetrics, feedStats] = await Promise.all([
      // Count unprocessed articles not in queue
      prisma.article.count({
        where: {
          processed: false,
          processingQueue: null
        }
      }),
      
      // Current queue metrics
      aiProcessingQueue.getQueueMetrics(),
      
      // Feed breakdown of unprocessed articles
      prisma.article.groupBy({
        by: ['feedId'],
        where: {
          processed: false,
          processingQueue: null
        },
        _count: { feedId: true }
      })
    ])
    
    // Get feed names for the stats
    const feedIds = feedStats.map(stat => stat.feedId)
    const feeds = await prisma.feed.findMany({
      where: { id: { in: feedIds } },
      select: { id: true, name: true }
    })
    
    const feedMap = new Map(feeds.map(f => [f.id, f.name]))
    
    const feedBreakdown = feedStats.map(stat => ({
      feedId: stat.feedId,
      feedName: feedMap.get(stat.feedId) || 'Unknown Feed',
      count: stat._count.feedId
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        availableForQueue: unprocessedCount,
        currentQueueMetrics: queueMetrics,
        feedBreakdown,
        canBulkAdd: unprocessedCount > 0,
        recommendations: {
          priority: unprocessedCount > 100 ? 'HIGH' : 'MEDIUM',
          batchSize: Math.min(unprocessedCount, 50),
          estimatedTime: `${Math.ceil(unprocessedCount / 10)} minutes`
        }
      }
    })
  } catch (error) {
    console.error('Error fetching bulk add information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch bulk add information' 
      },
      { status: 500 }
    )
  }
}