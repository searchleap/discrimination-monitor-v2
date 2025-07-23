import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingQueue } from '@/lib/ai-queue'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Debug: Processing AI queue directly...')
    
    // Get queue metrics before processing
    const beforeMetrics = await aiProcessingQueue.getQueueMetrics()
    console.log('Queue before processing:', beforeMetrics)
    
    if (beforeMetrics.pending === 0) {
      return NextResponse.json({
        success: true,
        message: 'No items in queue to process',
        data: {
          beforeMetrics,
          afterMetrics: beforeMetrics,
          processed: 0
        }
      })
    }
    
    // Process the queue directly
    const result = await aiProcessingQueue.processQueue()
    
    // Get queue metrics after processing
    const afterMetrics = await aiProcessingQueue.getQueueMetrics()
    console.log('Queue after processing:', afterMetrics)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${result.successful} articles successfully, ${result.failed} failed`,
      data: {
        beforeMetrics,
        afterMetrics,
        result,
        processingTime: result.processingTime
      }
    })
  } catch (error) {
    console.error('❌ Debug queue processing failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Queue processing failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}