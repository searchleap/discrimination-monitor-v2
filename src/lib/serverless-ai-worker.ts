import { aiProcessingQueue, ProcessingResult } from './ai-queue'
import { prisma } from './prisma'
import { analyticsEngine } from './analytics-engine'

export interface ServerlessWorkerConfig {
  batchSize: number
  maxProcessingTime: number // milliseconds
  maxConcurrentBatches: number
  enabled: boolean
}

export interface ServerlessWorkerStatus {
  isProcessing: boolean
  lastProcessedAt?: Date
  processedCount: number
  errorCount: number
  health: 'healthy' | 'warning' | 'error'
  currentSession?: {
    startedAt: Date
    itemsProcessed: number
    estimatedCompletion?: Date
  }
}

export interface ServerlessWorkerMetrics {
  totalProcessed: number
  totalErrors: number
  averageProcessingTime: number
  batchesCompleted: number
  lastHourThroughput: number
  successRate: number
  lastSessionDuration?: number
}

export class ServerlessAIWorker {
  private config: ServerlessWorkerConfig
  private processingState: {
    isProcessing: boolean
    startedAt?: Date
    sessionId?: string
    processedCount: number
    errorCount: number
  }

  constructor(config?: Partial<ServerlessWorkerConfig>) {
    this.config = {
      batchSize: parseInt(process.env.AI_WORKER_BATCH_SIZE || '5'),
      maxProcessingTime: 8 * 60 * 1000, // 8 minutes (under Vercel's 10min limit)
      maxConcurrentBatches: parseInt(process.env.AI_WORKER_MAX_CONCURRENT || '1'),
      enabled: process.env.AI_WORKER_ENABLED === 'true',
      ...config
    }

    this.processingState = {
      isProcessing: false,
      processedCount: 0,
      errorCount: 0
    }

    console.log(`🤖 Serverless AI Worker initialized:`, {
      enabled: this.config.enabled,
      batchSize: this.config.batchSize,
      maxProcessingTime: this.config.maxProcessingTime / 1000 + 's'
    })
  }

  /**
   * Start processing the queue (serverless-friendly)
   */
  async startProcessing(): Promise<{
    success: boolean
    message: string
    results?: ProcessingResult[]
    summary?: {
      totalProcessed: number
      totalSuccessful: number
      totalFailed: number
      processingTime: number
      batchesCompleted: number
    }
  }> {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'AI Worker is disabled in configuration'
      }
    }

    if (this.processingState.isProcessing) {
      return {
        success: false,
        message: 'AI Worker is already processing'
      }
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    try {
      this.processingState = {
        isProcessing: true,
        startedAt: new Date(),
        sessionId,
        processedCount: 0,
        errorCount: 0
      }

      await this.logWorkerEvent('WORKER_SESSION_START', 'SUCCESS', 
        `Started processing session: ${sessionId}`, { sessionId })

      const results: ProcessingResult[] = []
      let totalProcessed = 0
      let totalSuccessful = 0
      let totalFailed = 0
      let batchesCompleted = 0

      // Process batches until time limit or no more items
      while (Date.now() - startTime < this.config.maxProcessingTime) {
        // Check if there are items to process
        const queueMetrics = await aiProcessingQueue.getQueueMetrics()
        
        if (queueMetrics.pending === 0) {
          console.log('✅ No more items in queue, processing complete')
          break
        }

        console.log(`🔄 Processing batch ${batchesCompleted + 1}: ${queueMetrics.pending} items remaining`)

        // Process next batch
        try {
          const batchResult = await aiProcessingQueue.processQueue()
          results.push(batchResult)
          
          totalProcessed += batchResult.processed
          totalSuccessful += batchResult.successful
          totalFailed += batchResult.failed
          batchesCompleted++
          
          this.processingState.processedCount += batchResult.successful
          this.processingState.errorCount += batchResult.failed

          // Log batch completion
          await this.logWorkerEvent('WORKER_BATCH_COMPLETE', 
            batchResult.failed > 0 ? 'WARNING' : 'SUCCESS',
            `Batch ${batchesCompleted} completed: ${batchResult.successful} successful, ${batchResult.failed} failed`,
            { 
              batchNumber: batchesCompleted,
              result: batchResult,
              sessionId
            }
          )

          // Short pause between batches to prevent overload
          if (Date.now() - startTime < this.config.maxProcessingTime - 5000) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (batchError) {
          console.error(`❌ Batch ${batchesCompleted + 1} failed:`, batchError)
          
          await this.logWorkerEvent('WORKER_BATCH_ERROR', 'ERROR',
            `Batch ${batchesCompleted + 1} processing failed: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`,
            { 
              batchNumber: batchesCompleted + 1,
              error: batchError instanceof Error ? batchError.message : 'Unknown error',
              sessionId
            }
          )
          
          // Continue processing other batches
          batchesCompleted++
          totalFailed += this.config.batchSize // Estimate failed items
        }
      }

      const totalProcessingTime = Date.now() - startTime
      const summary = {
        totalProcessed,
        totalSuccessful,
        totalFailed,
        processingTime: totalProcessingTime,
        batchesCompleted
      }

      // Record analytics metrics
      try {
        await analyticsEngine.recordMetrics({
          timestamp: new Date(),
          batchSize: this.config.batchSize,
          processedCount: totalProcessed,
          successCount: totalSuccessful,
          errorCount: totalFailed,
          processingTime: totalProcessingTime,
          queueDepth: (await aiProcessingQueue.getQueueMetrics()).pending,
          workerStatus: 'completed'
        })
      } catch (analyticsError) {
        console.warn('⚠️  Failed to record analytics metrics:', analyticsError)
      }

      // Log session completion
      await this.logWorkerEvent('WORKER_SESSION_COMPLETE', 'SUCCESS',
        `Processing session completed: ${totalSuccessful} successful, ${totalFailed} failed in ${batchesCompleted} batches`,
        { 
          sessionId,
          summary,
          results: results.map(r => ({
            processed: r.processed,
            successful: r.successful,
            failed: r.failed,
            processingTime: r.processingTime
          }))
        }
      )

      console.log(`✅ Processing session completed: ${totalSuccessful} successful, ${totalFailed} failed (${totalProcessingTime}ms)`)

      return {
        success: true,
        message: `Processing completed: ${totalSuccessful} successful, ${totalFailed} failed in ${batchesCompleted} batches`,
        results,
        summary
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await this.logWorkerEvent('WORKER_SESSION_ERROR', 'ERROR',
        `Processing session failed: ${errorMessage}`,
        { 
          sessionId,
          error: errorMessage,
          processingTime: Date.now() - startTime
        }
      )

      console.error('❌ Processing session failed:', error)

      return {
        success: false,
        message: `Processing failed: ${errorMessage}`
      }

    } finally {
      this.processingState.isProcessing = false
    }
  }

  /**
   * Get current worker status
   */
  async getStatus(): Promise<ServerlessWorkerStatus> {
    const [queueMetrics, recentMetrics] = await Promise.all([
      aiProcessingQueue.getQueueMetrics(),
      this.getRecentMetrics()
    ])

    return {
      isProcessing: this.processingState.isProcessing,
      lastProcessedAt: recentMetrics.lastProcessedAt,
      processedCount: recentMetrics.totalProcessed,
      errorCount: recentMetrics.totalErrors,
      health: this.determineHealth(queueMetrics, recentMetrics),
      currentSession: this.processingState.isProcessing ? {
        startedAt: this.processingState.startedAt!,
        itemsProcessed: this.processingState.processedCount,
        estimatedCompletion: this.estimateCompletion(queueMetrics.pending)
      } : undefined
    }
  }

  /**
   * Get worker performance metrics
   */
  async getMetrics(): Promise<ServerlessWorkerMetrics> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const [recentLogs, totalStats, lastSession] = await Promise.all([
      // Recent successful classifications
      prisma.processingLog.findMany({
        where: {
          type: 'AI_CLASSIFICATION',
          status: 'SUCCESS',
          createdAt: { gte: oneHourAgo }
        },
        select: {
          processingTime: true,
          createdAt: true
        }
      }),
      
      // Total statistics
      prisma.processingLog.aggregate({
        where: {
          type: { in: ['AI_CLASSIFICATION', 'WORKER_BATCH_COMPLETE'] },
          createdAt: { gte: oneHourAgo }
        },
        _count: { id: true },
        _avg: { processingTime: true }
      }),

      // Last processing session
      prisma.processingLog.findFirst({
        where: {
          type: 'WORKER_SESSION_COMPLETE',
          status: 'SUCCESS'
        },
        orderBy: { createdAt: 'desc' },
        select: {
          processingTime: true,
          details: true
        }
      })
    ])

    const totalProcessed = this.processingState.processedCount
    const totalErrors = this.processingState.errorCount
    const successRate = totalProcessed > 0 ? (totalProcessed - totalErrors) / totalProcessed : 1

    return {
      totalProcessed,
      totalErrors,
      averageProcessingTime: totalStats._avg.processingTime || 0,
      batchesCompleted: (lastSession?.details as any)?.summary?.batchesCompleted || 0,
      lastHourThroughput: recentLogs.length,
      successRate,
      lastSessionDuration: lastSession?.processingTime || undefined
    }
  }

  /**
   * Force stop processing (for emergency situations)
   */
  async forceStop(): Promise<void> {
    if (this.processingState.isProcessing) {
      await this.logWorkerEvent('WORKER_FORCE_STOP', 'WARNING',
        `Processing forcefully stopped`, 
        { sessionId: this.processingState.sessionId }
      )
      
      this.processingState.isProcessing = false
      console.log('🛑 Processing forcefully stopped')
    }
  }

  /**
   * Update worker configuration
   */
  updateConfig(newConfig: Partial<ServerlessWorkerConfig>): void {
    const oldConfig = { ...this.config }
    this.config = { ...this.config, ...newConfig }
    
    console.log('⚙️  Serverless worker configuration updated:', {
      old: oldConfig,
      new: this.config
    })
  }

  /**
   * Check if worker can start processing
   */
  canStartProcessing(): boolean {
    return this.config.enabled && !this.processingState.isProcessing
  }

  // Private helper methods
  private async getRecentMetrics() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentActivity = await prisma.processingLog.findMany({
      where: {
        type: { in: ['AI_CLASSIFICATION', 'WORKER_BATCH_COMPLETE'] },
        status: 'SUCCESS',
        createdAt: { gte: oneHourAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    })

    const totalCounts = await prisma.processingLog.aggregate({
      where: {
        type: 'AI_CLASSIFICATION',
        status: { in: ['SUCCESS', 'ERROR'] }
      },
      _count: { id: true }
    })

    const errorCounts = await prisma.processingLog.aggregate({
      where: {
        type: 'AI_CLASSIFICATION',
        status: 'ERROR'
      },
      _count: { id: true }
    })

    return {
      lastProcessedAt: recentActivity[0]?.createdAt,
      totalProcessed: totalCounts._count.id || 0,
      totalErrors: errorCounts._count.id || 0
    }
  }

  private determineHealth(queueMetrics: any, metrics: any): 'healthy' | 'warning' | 'error' {
    const errorRate = metrics.totalProcessed > 0 ? metrics.totalErrors / metrics.totalProcessed : 0
    
    if (errorRate > 0.5) {
      return 'error'
    } else if (errorRate > 0.2 || queueMetrics.pending > 100) {
      return 'warning'
    }
    
    return 'healthy'
  }

  private estimateCompletion(pendingItems: number): Date | undefined {
    if (pendingItems === 0) return undefined
    
    const avgProcessingTimePerItem = 5000 // 5 seconds estimate
    const estimatedMs = pendingItems * avgProcessingTimePerItem
    
    return new Date(Date.now() + estimatedMs)
  }

  private async logWorkerEvent(
    type: string,
    status: string,
    message: string,
    details?: any
  ): Promise<void> {
    try {
      await prisma.processingLog.create({
        data: {
          type,
          status,
          message,
          details: details || {},
          processingTime: details?.processingTime || null
        }
      })
    } catch (error) {
      console.error('Failed to log worker event:', error)
    }
  }
}

// Export singleton instance
export const serverlessAIWorker = new ServerlessAIWorker()