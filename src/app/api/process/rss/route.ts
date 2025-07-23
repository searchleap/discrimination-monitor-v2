import { NextRequest, NextResponse } from 'next/server'
import { rssProcessor } from '@/lib/rss-processor'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timeoutMs = 45000 // 45 second timeout (leave 15s buffer from Vercel's 60s limit)
  
  try {
    console.log('🚀 Starting manual RSS processing...')
    
    const body = await request.json().catch(() => ({}))
    const feedIds = body.feedIds || null
    const maxFeeds = body.maxFeeds || 3 // Conservative limit to prevent timeouts
    
    // Log processing start
    await prisma.processingLog.create({
      data: {
        type: 'RSS_PROCESSING_START',
        status: 'IN_PROGRESS',
        message: `Starting RSS processing for ${feedIds ? feedIds.length : 'all'} feeds`,
        details: { 
          feedIds, 
          maxFeeds,
          requestedAt: new Date().toISOString()
        } as any
      }
    })

    const results: any = {}
    const processedFeeds: string[] = []
    
    if (feedIds && Array.isArray(feedIds)) {
      // Process specific feeds
      for (const feedId of feedIds.slice(0, maxFeeds)) {
        // Check timeout before processing each feed
        if (Date.now() - startTime > timeoutMs) {
          console.warn(`⏰ Processing timeout reached, stopping after ${Object.keys(results).length} feeds`)
          await prisma.processingLog.create({
            data: {
              type: 'RSS_PROCESSING_TIMEOUT',
              status: 'WARNING',
              message: `Processing timeout after ${Object.keys(results).length} feeds`,
              processingTime: Date.now() - startTime
            }
          })
          break
        }
        
        console.log(`📡 Processing feed ${feedId}...`)
        const feedResult = await rssProcessor.processFeed(feedId)
        results[feedId] = feedResult
        processedFeeds.push(feedId)
        
        // Log individual feed processing
        await prisma.processingLog.create({
          data: {
            type: 'RSS_FEED_PROCESSED',
            status: feedResult.success ? 'SUCCESS' : 'ERROR',
            message: `Feed ${feedId}: ${feedResult.newArticles} new articles`,
            details: feedResult as any, // Cast to any for JSON storage
            feedId: feedId,
            processingTime: null
          }
        })
      }
    } else {
      // Process all feeds (with limit for manual processing)
      const activeFeeds = await prisma.feed.findMany({
        where: { 
          isActive: true,
          status: { not: 'MAINTENANCE' }
        },
        take: maxFeeds,
        orderBy: [
          { lastFetched: { sort: 'asc', nulls: 'first' } }, // Process never-fetched feeds first
          { priority: 'asc' }
        ]
      })
      
      console.log(`📋 Found ${activeFeeds.length} active feeds to process`)
      
      for (const feed of activeFeeds) {
        // Check timeout before processing each feed
        if (Date.now() - startTime > timeoutMs) {
          console.warn(`⏰ Processing timeout reached, stopping after ${Object.keys(results).length} feeds`)
          await prisma.processingLog.create({
            data: {
              type: 'RSS_PROCESSING_TIMEOUT',
              status: 'WARNING',
              message: `Processing timeout after ${Object.keys(results).length} feeds`,
              processingTime: Date.now() - startTime
            }
          })
          break
        }
        
        console.log(`📡 Processing feed: ${feed.name}`)
        const feedResult = await rssProcessor.processFeed(feed.id)
        results[feed.id] = feedResult
        processedFeeds.push(feed.id)
        
        // Log individual feed processing
        await prisma.processingLog.create({
          data: {
            type: 'RSS_FEED_PROCESSED',
            status: feedResult.success ? 'SUCCESS' : 'ERROR', 
            message: `${feed.name}: ${feedResult.newArticles} new articles`,
            details: feedResult as any, // Cast to any for JSON storage
            feedId: feed.id,
            processingTime: null
          }
        })
      }
    }
    
    // Calculate summary statistics
    const totalFeeds = Object.keys(results).length
    const successfulFeeds = Object.values(results).filter((r: any) => r.success).length
    const failedFeeds = totalFeeds - successfulFeeds
    const totalNewArticles = Object.values(results).reduce((sum: number, r: any) => sum + (r.newArticles || 0), 0)
    const totalProcessed = Object.values(results).reduce((sum: number, r: any) => sum + (r.articlesProcessed || 0), 0)
    const totalErrors = Object.values(results).reduce((sum: number, r: any) => sum + (r.errors?.length || 0), 0)
    const processingTime = Date.now() - startTime
    
    // Log processing completion
    await prisma.processingLog.create({
      data: {
        type: 'RSS_PROCESSING_COMPLETE',
        status: totalErrors > 0 ? 'WARNING' : 'SUCCESS',
        message: `RSS processing completed: ${totalNewArticles} new articles from ${successfulFeeds}/${totalFeeds} feeds`,
        details: {
          totalFeeds,
          successfulFeeds,
          failedFeeds,
          totalNewArticles,
          totalProcessed,
          totalErrors,
          processedFeeds
        } as any,
        processingTime
      }
    })
    
    console.log(`✅ RSS processing completed: ${totalNewArticles} new articles`)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalFeeds,
        successfulFeeds,
        failedFeeds,
        totalNewArticles,
        totalProcessed,
        totalErrors,
        processingTime
      },
      results,
      processedFeeds
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // Log processing error
    await prisma.processingLog.create({
      data: {
        type: 'RSS_PROCESSING_ERROR',
        status: 'ERROR',
        message: `RSS processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null
        } as any,
        processingTime
      }
    }).catch(console.error) // Don't fail if logging fails
    
    console.error('❌ RSS processing failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
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
      select: {
        id: true,
        type: true,
        status: true,
        message: true,
        processingTime: true,
        feedId: true,
        createdAt: true
      }
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