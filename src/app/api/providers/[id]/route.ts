import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-provider-manager'

export async function GET(
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

    const health = await aiProviderManager.checkProviderHealth(id)
    const usage = await aiProviderManager.getUsageStats(id)

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const provider = await aiProviderManager.updateProvider(id, body)

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await aiProviderManager.deleteProvider(id)

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