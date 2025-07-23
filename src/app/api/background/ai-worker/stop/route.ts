import { NextRequest, NextResponse } from 'next/server'
import { serverlessAIWorker } from '@/lib/serverless-ai-worker'

export async function POST(request: NextRequest) {
  try {
    console.log('🛑 Force stopping serverless AI processing worker via API...')
    
    // Force stop the worker (in case it's stuck)
    await serverlessAIWorker.forceStop()
    
    // Get updated status
    const status = await serverlessAIWorker.getStatus()
    
    return NextResponse.json({
      success: true,
      message: 'AI processing worker stopped successfully',
      data: {
        status,
        stoppedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Failed to stop serverless AI worker:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to stop worker'
      },
      { status: 500 }
    )
  }
}