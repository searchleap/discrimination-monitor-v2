import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-provider-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const provider = await aiProviderManager.getProvider(id)
    
    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provider not found'
        },
        { status: 404 }
      )
    }

    const startTime = Date.now()
    const health = await aiProviderManager.checkProviderHealth(id)
    const testTime = Date.now() - startTime

    // Record the test as usage
    await aiProviderManager.recordUsage(
      id,
      health.status === 'healthy',
      testTime
    )

    return NextResponse.json({
      success: true,
      data: {
        providerId: id,
        providerName: provider.name,
        providerType: provider.type,
        testResult: {
          status: health.status,
          responseTime: health.responseTime,
          errorMessage: health.errorMessage
        },
        testTime,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error testing provider:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test provider'
      },
      { status: 500 }
    )
  }
}