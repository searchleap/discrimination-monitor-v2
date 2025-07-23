import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get feed status overview  
    const totalFeeds = await prisma.feed.count()
    const activeFeeds = await prisma.feed.count({
      where: { isActive: true }
    })

    // Get feeds that have never been fetched
    const neverFetchedFeeds = await prisma.feed.findMany({
      where: { 
        lastFetched: null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        url: true,
        category: true,
        status: true,
        errorMessage: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get feeds with recent fetch errors
    const errorFeeds = await prisma.feed.findMany({
      where: { 
        status: 'ERROR',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        url: true,
        category: true,
        status: true,
        errorMessage: true,
        lastFetched: true
      },
      orderBy: { lastFetched: 'desc' },
      take: 10
    })

    // Get recent processing activity
    const recentLogs = await prisma.processingLog.findMany({
      where: { 
        type: { in: ['RSS_FETCH', 'FEED_PROCESSING'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
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

    // Get feeds sorted by last fetch time
    const feedStatus = await prisma.feed.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        url: true,
        category: true,
        status: true,
        lastFetched: true,
        errorMessage: true,
        successRate: true,
        _count: {
          select: {
            articles: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
              }
            }
          }
        }
      },
      orderBy: [
        { lastFetched: { sort: 'asc', nulls: 'first' } },
        { name: 'asc' }
      ]
    })

    // Calculate stats
    const stats = {
      totalFeeds,
      activeFeeds,
      neverFetchedCount: neverFetchedFeeds.length,
      errorFeedsCount: errorFeeds.length,
      lastProcessingTime: recentLogs[0]?.createdAt || null,
      avgSuccessRate: feedStatus.reduce((sum, feed) => sum + feed.successRate, 0) / Math.max(feedStatus.length, 1)
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        neverFetchedFeeds,
        errorFeeds,
        recentLogs: recentLogs.map(log => ({
          id: log.id,
          type: log.type,
          status: log.status,
          message: log.message,
          processingTime: log.processingTime,
          feedId: log.feedId,
          createdAt: log.createdAt
        })),
        feedStatus: feedStatus.map(feed => ({
          ...feed,
          articlesThisWeek: feed._count.articles,
          needsAttention: !feed.lastFetched || feed.status === 'ERROR' || feed.successRate < 0.5
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching RSS status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RSS status' },
      { status: 500 }
    )
  }
}