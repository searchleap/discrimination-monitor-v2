import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    let databaseStatus: 'connected' | 'disconnected' = 'connected'
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      databaseStatus = 'disconnected'
    }

    // Get feed statistics
    const feedStats = await prisma.feed.aggregate({
      _count: {
        id: true
      }
    })

    const activeFeedStats = await prisma.feed.aggregate({
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    })

    // Mock RSS processing status (would need to track actual processing)
    const rssProcessing: 'running' | 'stopped' | 'error' = 'running'
    
    // Mock AI classification status (would check API keys and service health)
    const aiClassification: 'active' | 'inactive' | 'error' = 'active'

    // Get last processing time (mock - would track actual processing)
    const lastProcessing = new Date().toISOString()

    // Calculate failed feeds (mock - would need actual error tracking)
    const totalFeeds = feedStats._count.id
    const activeFeeds = activeFeedStats._count.id
    const failedFeeds = Math.max(0, totalFeeds - activeFeeds)

    const systemStatus = {
      database: databaseStatus,
      rssProcessing,
      aiClassification,
      lastProcessing,
      totalFeeds,
      activeFeeds,
      failedFeeds
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error('Admin status API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    )
  }
}