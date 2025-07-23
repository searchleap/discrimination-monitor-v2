import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingWorker } from '@/lib/ai-worker'

export async function POST(request: NextRequest) {
  try {
    console.log('🛑 Stopping AI processing worker via API...')
    
    // Stop the worker
    await aiProcessingWorker.stop()
    
    // Get updated status
    const status = aiProcessingWorker.getStatus()
    
    return NextResponse.json({
      success: true,
      message: 'AI processing worker stopped successfully',
      data: {
        status,
        stoppedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Failed to stop AI worker:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to stop worker'
      },
      { status: 500 }
    )
  }
}