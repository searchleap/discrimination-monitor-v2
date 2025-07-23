import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-provider-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = await aiProviderManager.getProvider(params.id)
    
    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provider not found'
        },
        { status: 404 }
      )
    }

    const health = await aiProviderManager.checkProviderHealth(params.id)
    const usage = await aiProviderManager.getUsageStats(params.id)

    // Don't expose encrypted API keys
    const safeConfig = { ...provider.config as any }
    if (safeConfig.apiKey) {
      safeConfig.apiKey = '***ENCRYPTED***'
    }

    return NextResponse.json({
      success: true,
      data: {
        ...provider,
        config: safeConfig,
        health,
        usage
      }
    })
  } catch (error) {
    console.error('Error fetching provider:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch provider'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const provider = await aiProviderManager.updateProvider(params.id, body)

    // Don't expose encrypted API keys in response
    const safeConfig = { ...provider.config as any }
    if (safeConfig.apiKey) {
      safeConfig.apiKey = '***ENCRYPTED***'
    }

    return NextResponse.json({
      success: true,
      data: {
        ...provider,
        config: safeConfig
      }
    })
  } catch (error) {
    console.error('Error updating provider:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update provider'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await aiProviderManager.deleteProvider(params.id)

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete provider'
      },
      { status: 500 }
    )
  }
}