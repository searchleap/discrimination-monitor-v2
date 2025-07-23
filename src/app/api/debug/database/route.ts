import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Test basic database connectivity
    await prisma.$connect()
    
    // Test each table that the AI processing system needs
    const [
      articleCount,
      feedCount,
      processingQueueCount,
      processingLogCount,
      aiProviderCount,
      processingMetricsCount
    ] = await Promise.all([
      prisma.article.count().catch(() => 'Table missing or error'),
      prisma.feed.count().catch(() => 'Table missing or error'),
      prisma.processingQueue.count().catch(() => 'Table missing or error'),
      prisma.processingLog.count().catch(() => 'Table missing or error'),
      prisma.aIProvider.count().catch(() => 'Table missing or error'),
      prisma.processingMetrics.count().catch(() => 'Table missing or error')
    ])
    
    const tableStatus = {
      Article: articleCount,
      Feed: feedCount,
      ProcessingQueue: processingQueueCount,
      ProcessingLog: processingLogCount,
      AIProvider: aiProviderCount,
      ProcessingMetrics: processingMetricsCount
    }
    
    // Test a simple query
    const recentArticles = await prisma.article.findMany({
      take: 3,
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    }).catch(err => `Query error: ${err.message}`)
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      data: {
        databaseConnected: true,
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
        tableStatus,
        recentArticles,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database test failed',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}