import { NextRequest, NextResponse } from 'next/server'
import { aiProviderManager } from '@/lib/ai-provider-manager'
import { ProviderType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const providers = await aiProviderManager.getAllProviders()
    
    // Get health status for each provider
    const providersWithHealth = await Promise.all(
      providers.map(async (provider) => {
        try {
          const health = await aiProviderManager.checkProviderHealth(provider.id)
          const usage = await aiProviderManager.getUsageStats(provider.id)
          
          // Don't expose encrypted API keys
          const safeConfig = { ...provider.config as any }
          if (safeConfig.apiKey) {
            safeConfig.apiKey = '***ENCRYPTED***'
          }
          
          return {
            ...provider,
            config: safeConfig,
            health,
            usage
          }
        } catch (error) {
          return {
            ...provider,
            config: { ...provider.config as any, apiKey: '***ENCRYPTED***' },
            health: {
              status: 'down',
              lastChecked: new Date(),
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            },
            usage: {
              requestCount: provider.requestCount,
              successCount: provider.successCount,
              errorCount: provider.errorCount,
              estimatedCost: provider.estimatedCost,
              successRate: provider.successRate
            }
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: providersWithHealth
    })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch providers'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, config, priority } = body

    // Validate required fields
    if (!name || !type || !config) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, type, config'
        },
        { status: 400 }
      )
    }

    // Validate provider type
    if (!Object.values(ProviderType).includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid provider type. Must be one of: ${Object.values(ProviderType).join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validate configuration based on type
    const validationError = validateProviderConfig(type, config)
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError
        },
        { status: 400 }
      )
    }

    const provider = await aiProviderManager.createProvider({
      name,
      type,
      config,
      priority
    })

    return NextResponse.json({
      success: true,
      data: {
        ...provider,
        config: { ...config, apiKey: config.apiKey ? '***ENCRYPTED***' : undefined }
      }
    })
  } catch (error) {
    console.error('Error creating provider:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create provider'
      },
      { status: 500 }
    )
  }
}

function validateProviderConfig(type: ProviderType, config: any): string | null {
  if (!config.apiKey) {
    return 'API key is required'
  }

  switch (type) {
    case ProviderType.OPENAI:
      if (!config.apiKey.startsWith('sk-')) {
        return 'Invalid OpenAI API key format'
      }
      break
    case ProviderType.ANTHROPIC:
      if (!config.apiKey.startsWith('sk-ant-')) {
        return 'Invalid Anthropic API key format'
      }
      break
  }

  if (config.maxTokens && (config.maxTokens < 1 || config.maxTokens > 100000)) {
    return 'maxTokens must be between 1 and 100000'
  }

  if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
    return 'temperature must be between 0 and 2'
  }

  return null
}