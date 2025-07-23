import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingWorker } from '@/lib/ai-worker'

export async function GET(request: NextRequest) {
  try {
    const status = aiProcessingWorker.getStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        workerStatus: status,
        environmentConfig: {
          enabled: process.env.AI_WORKER_ENABLED,
          batchSize: process.env.AI_WORKER_BATCH_SIZE,
          interval: process.env.AI_WORKER_INTERVAL,
          maxConcurrent: process.env.AI_WORKER_MAX_CONCURRENT,
          autoStart: process.env.AI_WORKER_AUTO_START,
          healthCheckInterval: process.env.AI_WORKER_HEALTH_CHECK
        }
      }
    })
  } catch (error) {
    console.error('Error fetching AI worker configuration:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch worker configuration' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body
    
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration provided' },
        { status: 400 }
      )
    }
    
    // Validate configuration values
    const validatedConfig: any = {}
    
    if (typeof config.enabled === 'boolean') {
      validatedConfig.enabled = config.enabled
    }
    
    if (typeof config.batchSize === 'number' && config.batchSize > 0 && config.batchSize <= 50) {
      validatedConfig.batchSize = config.batchSize
    }
    
    if (typeof config.processingInterval === 'number' && config.processingInterval >= 10000) {
      validatedConfig.processingInterval = config.processingInterval
    }
    
    if (typeof config.maxConcurrentBatches === 'number' && config.maxConcurrentBatches >= 1) {
      validatedConfig.maxConcurrentBatches = config.maxConcurrentBatches
    }
    
    if (typeof config.autoStart === 'boolean') {
      validatedConfig.autoStart = config.autoStart
    }
    
    if (typeof config.healthCheckInterval === 'number' && config.healthCheckInterval >= 30000) {
      validatedConfig.healthCheckInterval = config.healthCheckInterval
    }
    
    // Update worker configuration
    aiProcessingWorker.updateConfig(validatedConfig)
    
    // Get updated status
    const status = aiProcessingWorker.getStatus()
    
    return NextResponse.json({
      success: true,
      message: 'Worker configuration updated successfully',
      data: {
        updatedConfig: validatedConfig,
        workerStatus: status
      }
    })
  } catch (error) {
    console.error('❌ Failed to update AI worker configuration:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update configuration'
      },
      { status: 500 }
    )
  }
}