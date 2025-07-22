import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected'
    let totalFeeds = 0
    let activeFeeds = 0
    
    try {
      await prisma.$queryRaw`SELECT 1`
      databaseStatus = 'connected'
      
      // Get feed statistics only if database is connected
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
      
      totalFeeds = feedStats._count.id
      activeFeeds = activeFeedStats._count.id
    } catch (error) {
      console.error('Database connection failed:', error)
      databaseStatus = 'disconnected'
      // Use mock data when database is unavailable
      totalFeeds = 78
      activeFeeds = 65
    }

    // Mock RSS processing status (would need to track actual processing)
    const rssProcessing: 'running' | 'stopped' | 'error' = databaseStatus === 'connected' ? 'running' : 'stopped'
    
    // Mock AI classification status (would check API keys and service health)
    const aiClassification: 'active' | 'inactive' | 'error' = databaseStatus === 'connected' ? 'active' : 'inactive'

    // Get last processing time (mock - would track actual processing)
    const lastProcessing = databaseStatus === 'connected' ? new Date().toISOString() : null

    // Calculate failed feeds (mock - would need actual error tracking)
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