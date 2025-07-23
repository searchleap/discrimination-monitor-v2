import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingQueue } from '@/lib/ai-queue'
import { QueueStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔄 Starting AI queue retry processing...')
    
    const body = await request.json().catch(() => ({}))
    const maxRetries = body.maxRetries || 3
    
    // Get current metrics before retry
    const beforeMetrics = await aiProcessingQueue.getQueueMetrics()
    
    console.log(`📊 Queue status before retry: ${beforeMetrics.failed} failed items`)
    
    if (beforeMetrics.failed === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed items to retry',
        summary: {
          retriedItems: 0,
          successful: 0,
          failed: 0,
          processingTime: Date.now() - startTime
        },
        beforeMetrics,
        afterMetrics: beforeMetrics
      })
    }
    
    // Retry failed items
    const retryResult = await aiProcessingQueue.retryFailed()
    
    // Get updated metrics
    const afterMetrics = await aiProcessingQueue.getQueueMetrics()
    
    const processingTime = Date.now() - startTime
    
    console.log(`✅ Retry completed: ${retryResult.successful} successful, ${retryResult.failed} failed (${processingTime}ms)`)
    
    return NextResponse.json({
      success: true,
      message: `Retry completed: ${retryResult.successful} successful, ${retryResult.failed} failed`,
      summary: {
        retriedItems: beforeMetrics.failed,
        successful: retryResult.successful,
        failed: retryResult.failed,
        processingTime
      },
      beforeMetrics,
      afterMetrics,
      retryResult
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('❌ AI queue retry failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Retry processing failed',
        processingTime
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get information about failed items that can be retried
    const queueMetrics = await aiProcessingQueue.getQueueMetrics()
    const failedItems = await aiProcessingQueue.getQueueItems(QueueStatus.FAILED, 50, 0)
    
    // Categorize failed items by retry count
    const retryableFailed = failedItems.filter(item => item.retryCount < item.maxRetries)
    const permanentlyFailed = failedItems.filter(item => item.retryCount >= item.maxRetries)
    
    // Get error frequency
    const errorFrequency: { [key: string]: number } = {}
    failedItems.forEach(item => {
      if (item.error) {
        const errorKey = item.error.split(':')[0] // Get error type
        errorFrequency[errorKey] = (errorFrequency[errorKey] || 0) + 1
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        metrics: queueMetrics,
        retryable: {
          count: retryableFailed.length,
          items: retryableFailed.slice(0, 10) // Show first 10
        },
        permanentlyFailed: {
          count: permanentlyFailed.length,
          items: permanentlyFailed.slice(0, 10) // Show first 10
        },
        errorFrequency,
        canRetry: retryableFailed.length > 0
      }
    })
  } catch (error) {
    console.error('Error fetching retry information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch retry information' 
      },
      { status: 500 }
    )
  }
}