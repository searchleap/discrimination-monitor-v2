import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-provider-manager'

export async function GET(request: NextRequest) {
  try {
    const providers = await aiProviderManager.getAllProviders()
    
    const healthStatus = await Promise.all(
      providers.map(async (provider) => {
        try {
          const health = await aiProviderManager.checkProviderHealth(provider.id)
          return {
            id: provider.id,
            name: provider.name,
            type: provider.type,
            enabled: provider.enabled,
            ...health
          }
        } catch (error) {
          return {
            id: provider.id,
            name: provider.name,
            type: provider.type,
            enabled: provider.enabled,
            status: 'down' as const,
            lastChecked: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // Calculate overall health
    const healthyCount = healthStatus.filter(p => p.status === 'healthy').length
    const totalEnabled = healthStatus.filter(p => p.enabled).length
    
    const overallHealth = totalEnabled === 0 ? 'down' : 
      healthyCount === totalEnabled ? 'healthy' :
      healthyCount > 0 ? 'degraded' : 'down'

    return NextResponse.json({
      success: true,
      data: {
        overall: {
          status: overallHealth,
          healthyProviders: healthyCount,
          totalProviders: totalEnabled,
          lastChecked: new Date()
        },
        providers: healthStatus
      }
    })
  } catch (error) {
    console.error('Error checking provider health:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check provider health'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const providers = await aiProviderManager.getEnabledProviders()
    
    // Force health check on all providers
    const healthResults = await Promise.all(
      providers.map(async (provider) => {
        const health = await aiProviderManager.checkProviderHealth(provider.id)
        return {
          id: provider.id,
          name: provider.name,
          ...health
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        message: 'Health check completed for all providers',
        results: healthResults,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Error performing health check:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform health check'
      },
      { status: 500 }
    )
  }
}