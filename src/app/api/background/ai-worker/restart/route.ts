import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingWorker } from '@/lib/ai-worker'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Restarting AI processing worker via API...')
    
    const body = await request.json().catch(() => ({}))
    const { config } = body
    
    // Update configuration if provided
    if (config) {
      aiProcessingWorker.updateConfig(config)
    }
    
    // Restart the worker
    await aiProcessingWorker.restart()
    
    // Get updated status
    const [status, metrics] = await Promise.all([
      aiProcessingWorker.getStatus(),
      aiProcessingWorker.getMetrics()
    ])
    
    return NextResponse.json({
      success: true,
      message: 'AI processing worker restarted successfully',
      data: {
        status,
        metrics,
        restartedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Failed to restart AI worker:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restart worker'
      },
      { status: 500 }
    )
  }
}