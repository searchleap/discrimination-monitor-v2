import { prisma } from '@/lib/prisma'
import { ProviderType, AIProvider } from '@prisma/client'

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  errorRate?: number
  lastChecked: Date
  errorMessage?: string
}

export interface ProviderUsageStats {
  requestCount: number
  successCount: number
  errorCount: number
  averageLatency?: number
  estimatedCost: number
  successRate: number
}

export class AIProviderManager {
  private static instance: AIProviderManager
  private healthCache = new Map<string, ProviderHealth>()
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startHealthMonitoring()
  }

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager()
    }
    return AIProviderManager.instance
  }

  // Provider CRUD operations
  async createProvider(data: {
    name: string
    type: ProviderType
    config: ProviderConfig
    priority?: number
  }): Promise<AIProvider> {
    // Encrypt sensitive data
    const encryptedConfig = {
      ...data.config,
      apiKey: data.config.apiKey ? await this.encryptApiKey(data.config.apiKey) : undefined
    }

    return await prisma.aIProvider.create({
      data: {
        name: data.name,
        type: data.type,
        priority: data.priority || 1,
        config: encryptedConfig as any,
        rateLimits: this.getDefaultRateLimits(data.type) as any
      }
    })
  }

  async updateProvider(id: string, data: Partial<{
    name: string
    enabled: boolean
    priority: number
    config: ProviderConfig
  }>): Promise<AIProvider> {
    const updateData: any = { ...data }
    
    if (data.config) {
      // Encrypt API key if provided
      updateData.config = {
        ...data.config,
        apiKey: data.config.apiKey ? await this.encryptApiKey(data.config.apiKey) : undefined
      }
    }

    return await prisma.aIProvider.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() }
    })
  }

  async deleteProvider(id: string): Promise<void> {
    await prisma.aIProvider.delete({
      where: { id }
    })
  }

  async getProvider(id: string): Promise<AIProvider | null> {
    return await prisma.aIProvider.findUnique({
      where: { id }
    })
  }

  async getAllProviders(): Promise<AIProvider[]> {
    return await prisma.aIProvider.findMany({
      orderBy: [
        { priority: 'desc' },
        { successRate: 'desc' },
        { name: 'asc' }
      ]
    })
  }

  async getEnabledProviders(): Promise<AIProvider[]> {
    return await prisma.aIProvider.findMany({
      where: { enabled: true },
      orderBy: [
        { priority: 'desc' },
        { successRate: 'desc' }
      ]
    })
  }

  // Provider selection and failover
  async getNextAvailableProvider(excludeIds: string[] = []): Promise<AIProvider | null> {
    const providers = await this.getEnabledProviders()
    
    for (const provider of providers) {
      if (excludeIds.includes(provider.id)) continue
      
      const health = await this.checkProviderHealth(provider.id)
      if (health.status === 'healthy') {
        return provider
      }
    }
    
    // If no healthy providers, return the highest priority one
    const available = providers.filter(p => !excludeIds.includes(p.id))
    return available[0] || null
  }

  // Health monitoring
  async checkProviderHealth(providerId: string): Promise<ProviderHealth> {
    const cached = this.healthCache.get(providerId)
    if (cached && Date.now() - cached.lastChecked.getTime() < 30000) {
      return cached
    }

    const provider = await this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    const health = await this.performHealthCheck(provider)
    this.healthCache.set(providerId, health)
    
    return health
  }

  private async performHealthCheck(provider: AIProvider): Promise<ProviderHealth> {
    const startTime = Date.now()
    
    try {
      const config = provider.config as ProviderConfig
      
      if (provider.type === ProviderType.OPENAI) {
        await this.testOpenAIConnection(config)
      } else if (provider.type === ProviderType.ANTHROPIC) {
        await this.testAnthropicConnection(config)
      }
      
      const responseTime = Date.now() - startTime
      
      return {
        status: 'healthy',
        responseTime,
        errorRate: this.calculateErrorRate(provider),
        lastChecked: new Date()
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        errorRate: this.calculateErrorRate(provider),
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testOpenAIConnection(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const decryptedKey = await this.decryptApiKey(config.apiKey)
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${decryptedKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(config.timeout || 5000)
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }
  }

  private async testAnthropicConnection(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const decryptedKey = await this.decryptApiKey(config.apiKey)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': decryptedKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      }),
      signal: AbortSignal.timeout(config.timeout || 5000)
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }
  }

  // Usage tracking
  async recordUsage(providerId: string, success: boolean, latency: number, cost?: number): Promise<void> {
    const provider = await this.getProvider(providerId)
    if (!provider) return

    const updates: any = {
      requestCount: { increment: 1 },
      lastUsed: new Date(),
      updatedAt: new Date()
    }

    if (success) {
      updates.successCount = { increment: 1 }
    } else {
      updates.errorCount = { increment: 1 }
    }

    if (cost) {
      updates.estimatedCost = { increment: cost }
    }

    await prisma.aIProvider.update({
      where: { id: providerId },
      data: updates
    })

    // Update success rate
    const updatedProvider = await this.getProvider(providerId)
    if (updatedProvider) {
      const successRate = updatedProvider.successCount / updatedProvider.requestCount
      await prisma.aIProvider.update({
        where: { id: providerId },
        data: { successRate }
      })
    }

    // Update average latency
    await this.updateAverageLatency(providerId, latency)
  }

  async getUsageStats(providerId: string, days: number = 30): Promise<ProviderUsageStats> {
    const provider = await this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    return {
      requestCount: provider.requestCount,
      successCount: provider.successCount,
      errorCount: provider.errorCount,
      averageLatency: provider.averageLatency || undefined,
      estimatedCost: provider.estimatedCost,
      successRate: provider.successRate
    }
  }

  // Utility methods
  private calculateErrorRate(provider: AIProvider): number {
    if (provider.requestCount === 0) return 0
    return provider.errorCount / provider.requestCount
  }

  private async updateAverageLatency(providerId: string, newLatency: number): Promise<void> {
    const provider = await this.getProvider(providerId)
    if (!provider) return

    const currentAvg = provider.averageLatency || 0
    const totalRequests = provider.requestCount
    const newAvg = ((currentAvg * (totalRequests - 1)) + newLatency) / totalRequests

    await prisma.aIProvider.update({
      where: { id: providerId },
      data: { averageLatency: Math.round(newAvg) }
    })
  }

  private getDefaultRateLimits(type: ProviderType): object {
    switch (type) {
      case ProviderType.OPENAI:
        return { requestsPerMinute: 500, tokensPerMinute: 10000 }
      case ProviderType.ANTHROPIC:
        return { requestsPerMinute: 1000, tokensPerDay: 100000 }
      default:
        return { requestsPerMinute: 100 }
    }
  }

  // Encryption helpers (simplified - use proper encryption in production)
  private async encryptApiKey(apiKey: string): Promise<string> {
    // In production, use proper encryption
    return Buffer.from(apiKey).toString('base64')
  }

  private async decryptApiKey(encryptedKey: string): Promise<string> {
    // In production, use proper decryption
    return Buffer.from(encryptedKey, 'base64').toString('utf-8')
  }

  // Health monitoring
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) return

    this.healthCheckInterval = setInterval(async () => {
      try {
        const providers = await this.getEnabledProviders()
        for (const provider of providers) {
          await this.checkProviderHealth(provider.id)
        }
      } catch (error) {
        console.error('Health monitoring error:', error)
      }
    }, 60000) // Check every minute
  }

  public stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  // Initialize default providers
  async initializeDefaultProviders(): Promise<void> {
    const existingProviders = await this.getAllProviders()
    
    if (existingProviders.length === 0) {
      // Create default OpenAI provider
      if (process.env.OPENAI_API_KEY) {
        await this.createProvider({
          name: 'OpenAI GPT-4',
          type: ProviderType.OPENAI,
          config: {
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-4o-mini',
            maxTokens: 1000,
            temperature: 0.1
          },
          priority: 10
        })
      }

      // Create default Anthropic provider
      if (process.env.ANTHROPIC_API_KEY) {
        await this.createProvider({
          name: 'Anthropic Claude',
          type: ProviderType.ANTHROPIC,
          config: {
            apiKey: process.env.ANTHROPIC_API_KEY,
            model: 'claude-3-haiku-20240307',
            maxTokens: 1000,
            temperature: 0.1
          },
          priority: 8
        })
      }
    }
  }
}

export const aiProviderManager = AIProviderManager.getInstance()

// Auto-initialize on module load
aiProviderManager.initializeDefaultProviders().catch(console.error)