import { NextRequest, NextResponse } from 'next/server'
import { serverlessAIWorker } from '@/lib/serverless-ai-worker'

export async function GET(request: NextRequest) {
  try {
    const [status, metrics] = await Promise.all([
      serverlessAIWorker.getStatus(),
      serverlessAIWorker.getMetrics()
    ])

    return NextResponse.json({
      success: true,
      data: {
        status,
        metrics,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching serverless AI worker status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch worker status' 
      },
      { status: 500 }
    )
  }
}