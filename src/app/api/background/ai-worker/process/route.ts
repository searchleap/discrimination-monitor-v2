import { NextRequest, NextResponse } from 'next/server'
import { serverlessAIWorker } from '@/lib/serverless-ai-worker'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Triggering AI queue processing...')
    
    // Check if worker can start
    if (!serverlessAIWorker.canStartProcessing()) {
      const status = await serverlessAIWorker.getStatus()
      return NextResponse.json({
        success: false,
        message: status.isProcessing 
          ? 'Worker is already processing' 
          : 'Worker is disabled',
        data: { status }
      }, { status: 409 })
    }
    
    // Start processing
    const result = await serverlessAIWorker.startProcessing()
    
    // Get final status and metrics
    const [status, metrics] = await Promise.all([
      serverlessAIWorker.getStatus(),
      serverlessAIWorker.getMetrics()
    ])
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        status,
        metrics,
        results: result.results,
        summary: result.summary,
        completedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Failed to process AI queue:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process queue'
      },
      { status: 500 }
    )
  }
}

// Allow GET for easy triggering (useful for webhooks/cron)
export async function GET(request: NextRequest) {
  return POST(request)
}