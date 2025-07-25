import { NextRequest, NextResponse } from 'next/server'
import { serverlessAIWorker } from '@/lib/serverless-ai-worker'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting serverless AI processing worker via API...')
    
    const body = await request.json().catch(() => ({}))
    const { config } = body
    
    // Update configuration if provided
    if (config) {
      serverlessAIWorker.updateConfig(config)
    }
    
    // Check if worker can start
    if (!serverlessAIWorker.canStartProcessing()) {
      const status = await serverlessAIWorker.getStatus()
      return NextResponse.json({
        success: false,
        message: status.isProcessing 
          ? 'Worker is already processing' 
          : 'Worker is disabled or cannot start',
        data: { status }
      }, { status: 409 })
    }
    
    // Start processing
    const result = await serverlessAIWorker.startProcessing()
    
    // Get updated status
    const status = await serverlessAIWorker.getStatus()
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        status,
        results: result.results,
        summary: result.summary,
        startedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Failed to start serverless AI worker:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start worker'
      },
      { status: 500 }
    )
  }
}