import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test basic API functionality
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
      openaiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Missing',
      anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing'
    }

    // Test database connection
    let databaseStatus = 'Unknown'
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$connect()
      const articleCount = await prisma.article.count()
      databaseStatus = `Connected (${articleCount} articles)`
      await prisma.$disconnect()
    } catch (dbError) {
      databaseStatus = `Error: ${dbError}`
    }

    // Test AI queue initialization
    let queueStatus = 'Unknown'
    try {
      const { aiProcessingQueue } = await import('@/lib/ai-queue')
      const metrics = await aiProcessingQueue.getQueueMetrics()
      queueStatus = `Initialized (${metrics.pending} pending)`
    } catch (queueError) {
      queueStatus = `Error: ${queueError}`
    }

    // Test AI provider manager
    let providerStatus = 'Unknown'
    try {
      const { aiProviderManager } = await import('@/lib/ai-provider-manager')
      const providers = await aiProviderManager.getAllProviders()
      providerStatus = `Initialized (${providers.length} providers)`
    } catch (providerError) {
      providerStatus = `Error: ${providerError}`
    }

    return NextResponse.json({
      success: true,
      data: {
        ...testResults,
        databaseStatus,
        queueStatus,
        providerStatus
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Debug test failed',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}