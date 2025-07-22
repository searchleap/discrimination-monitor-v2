// Debug endpoint - can be removed in production
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [feedCount, articleCount, systemStatus] = await Promise.all([
      prisma.feed.count(),
      prisma.article.count(),
      prisma.$queryRaw`SELECT 1 as test`
    ])

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: 'connected',
      feedCount,
      articleCount
    })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}