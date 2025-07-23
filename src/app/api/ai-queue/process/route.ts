import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingQueue } from '@/lib/ai-queue'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🚀 Starting AI queue processing...')
    
    const body = await request.json().catch(() => ({}))
    const batchSize = Math.min(body.batchSize || 5, 20) // Cap at 20 for safety
    const maxBatches = Math.min(body.maxBatches || 1, 5) // Cap at 5 batches
    
    const results = []
    let totalProcessed = 0
    let totalSuccessful = 0
    let totalFailed = 0
    const allErrors: Array<{ articleId: string; error: string }> = []
    
    // Process multiple batches if requested
    for (let i = 0; i < maxBatches; i++) {
      try {
        console.log(`📦 Processing batch ${i + 1}/${maxBatches}...`)
        
        const batchResult = await aiProcessingQueue.processQueue()
        results.push(batchResult)
        
        totalProcessed += batchResult.processed
        totalSuccessful += batchResult.successful
        totalFailed += batchResult.failed
        allErrors.push(...batchResult.errors)
        
        // If no items were processed, no need to continue
        if (batchResult.processed === 0) {
          console.log('📭 No more items to process, stopping batches')
          break
        }
        
        // Add delay between batches to prevent overwhelming the system
        if (i < maxBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
      } catch (batchError) {
        console.error(`❌ Batch ${i + 1} failed:`, batchError)
        results.push({
          processed: 0,
          successful: 0,
          failed: 0,
          errors: [{ 
            articleId: 'batch', 
            error: batchError instanceof Error ? batchError.message : 'Batch processing error' 
          }],
          processingTime: 0
        })
        break // Stop processing further batches on error
      }
    }
    
    const totalTime = Date.now() - startTime
    
    // Get updated queue metrics
    const queueMetrics = await aiProcessingQueue.getQueueMetrics()
    
    console.log(`✅ AI queue processing completed: ${totalSuccessful} successful, ${totalFailed} failed (${totalTime}ms)`)
    
    return NextResponse.json({
      success: true,
      summary: {
        batchesProcessed: results.length,
        totalProcessed,
        totalSuccessful,
        totalFailed,
        totalErrors: allErrors.length,
        processingTime: totalTime,
        remainingInQueue: queueMetrics.pending
      },
      results,
      errors: allErrors,
      queueMetrics
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('❌ AI queue processing failed:', error)
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
    // Return current processing status without triggering processing
    const [queueMetrics, queueStatus] = await Promise.all([
      aiProcessingQueue.getQueueMetrics(),
      aiProcessingQueue.getQueueStatus()
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        metrics: queueMetrics,
        status: queueStatus,
        isProcessing: queueStatus.isProcessing,
        canProcess: queueMetrics.pending > 0 && !queueStatus.isProcessing
      }
    })
  } catch (error) {
    console.error('Error fetching queue processing status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch processing status' 
      },
      { status: 500 }
    )
  }
}