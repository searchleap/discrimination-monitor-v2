import { NextRequest, NextResponse } from 'next/server'
import { serverlessAIWorker } from '@/lib/serverless-ai-worker'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Restarting serverless AI processing worker via API...')
    
    const body = await request.json().catch(() => ({}))
    const { config } = body
    
    // Update configuration if provided
    if (config) {
      serverlessAIWorker.updateConfig(config)
    }
    
    // For serverless worker, "restart" means force stop and then start processing
    await serverlessAIWorker.forceStop()
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Start processing
    const result = await serverlessAIWorker.startProcessing()
    
    // Get updated status
    const [status, metrics] = await Promise.all([
      serverlessAIWorker.getStatus(),
      serverlessAIWorker.getMetrics()
    ])
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'AI processing worker restarted and processing completed successfully'
        : `AI processing worker restart failed: ${result.message}`,
      data: {
        status,
        metrics,
        results: result.results,
        summary: result.summary,
        restartedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Failed to restart serverless AI worker:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restart worker'
      },
      { status: 500 }
    )
  }
}