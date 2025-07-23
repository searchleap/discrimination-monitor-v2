import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingWorker } from '@/lib/ai-worker'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting AI processing worker via API...')
    
    const body = await request.json().catch(() => ({}))
    const { config } = body
    
    // Update configuration if provided
    if (config) {
      aiProcessingWorker.updateConfig(config)
    }
    
    // Start the worker
    await aiProcessingWorker.start()
    
    // Get updated status
    const status = aiProcessingWorker.getStatus()
    
    return NextResponse.json({
      success: true,
      message: 'AI processing worker started successfully',
      data: {
        status,
        startedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Failed to start AI worker:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start worker'
      },
      { status: 500 }
    )
  }
}