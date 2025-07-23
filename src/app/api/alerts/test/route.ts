import { NextRequest, NextResponse } from 'next/server'
import { alertManager } from '@/lib/alert-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, testPayload } = body

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    let success: boolean

    if (testPayload) {
      // Test with custom payload
      await alertManager.triggerAlert(testPayload)
      success = true
    } else {
      // Test the specific alert configuration
      success = await alertManager.testAlert(alertId)
    }

    return NextResponse.json({ 
      success: true,
      testResult: success,
      message: success 
        ? 'Test alert sent successfully' 
        : 'Test alert failed to send'
    })
  } catch (error) {
    console.error('Failed to test alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to test alert' },
      { status: 500 }
    )
  }
}