import { NextRequest, NextResponse } from 'next/server'
import { analyticsEngine } from '@/lib/analytics-engine'

export async function GET() {
  try {
    const health = await analyticsEngine.getSystemHealth()

    return NextResponse.json({
      success: true,
      health
    })
  } catch (error) {
    console.error('Failed to get system health:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get system health' },
      { status: 500 }
    )
  }
}