import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingWorker } from '@/lib/ai-worker'

export async function GET(request: NextRequest) {
  try {
    const [status, metrics] = await Promise.all([
      aiProcessingWorker.getStatus(),
      aiProcessingWorker.getMetrics()
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
    console.error('Error fetching AI worker status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch worker status' 
      },
      { status: 500 }
    )
  }
}