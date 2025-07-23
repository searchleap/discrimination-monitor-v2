import { aiProcessingQueue, ProcessingResult } from './ai-queue'
import { prisma } from './prisma'
import { analyticsEngine } from './analytics-engine'

export interface WorkerConfig {
  enabled: boolean
  batchSize: number
  processingInterval: number // milliseconds
  maxConcurrentBatches: number
  autoStart: boolean
  healthCheckInterval: number
}

export interface WorkerStatus {
  isRunning: boolean
  isProcessing: boolean
  startedAt?: Date
  lastProcessedAt?: Date
  processedCount: number
  errorCount: number
  currentBatch?: string[]
  nextScheduledAt?: Date
  health: 'healthy' | 'warning' | 'error'
  uptime?: number
}

export interface WorkerMetrics {
  totalProcessed: number
  totalErrors: number
  averageProcessingTime: number
  batchesCompleted: number
  lastHourThroughput: number
  successRate: number
  uptime: number
}

export class AIProcessingWorker {
  private config: WorkerConfig
  private status: WorkerStatus
  private processingTimer?: NodeJS.Timeout
  private healthCheckTimer?: NodeJS.Timeout
  private isShuttingDown: boolean = false
  private processingPromise?: Promise<void>

  constructor(config?: Partial<WorkerConfig>) {
    this.config = {
      enabled: process.env.AI_WORKER_ENABLED === 'true',
      batchSize: parseInt(process.env.AI_WORKER_BATCH_SIZE || '5'),
      processingInterval: parseInt(process.env.AI_WORKER_INTERVAL || '30000'), // 30 seconds
      maxConcurrentBatches: parseInt(process.env.AI_WORKER_MAX_CONCURRENT || '1'),
      autoStart: process.env.AI_WORKER_AUTO_START !== 'false',
      healthCheckInterval: parseInt(process.env.AI_WORKER_HEALTH_CHECK || '60000'), // 1 minute
      ...config
    }

    this.status = {
      isRunning: false,
      isProcessing: false,
      processedCount: 0,
      errorCount: 0,
      health: 'healthy'
    }

    console.log(`🤖 AI Processing Worker initialized:`, {
      enabled: this.config.enabled,
      batchSize: this.config.batchSize,
      interval: this.config.processingInterval / 1000 + 's',
      autoStart: this.config.autoStart
    })

    // Auto-start if enabled
    if (this.config.enabled && this.config.autoStart) {
      this.start().catch(error => {
        console.error('❌ Failed to auto-start AI worker:', error)
      })
    }
  }

  /**
   * Start the background worker
   */
  async start(): Promise<void> {
    if (this.status.isRunning) {
      console.log('⚠️  AI Worker is already running')
      return
    }

    if (!this.config.enabled) {
      console.log('⚠️  AI Worker is disabled in configuration')
      return
    }

    try {
      this.status.isRunning = true
      this.status.startedAt = new Date()
      this.status.health = 'healthy'
      this.isShuttingDown = false

      await this.logWorkerEvent('WORKER_START', 'SUCCESS', 'AI Processing Worker started')

      // Start processing timer
      this.scheduleNextProcessing()

      // Start health check timer
      this.startHealthCheck()

      console.log('🚀 AI Processing Worker started successfully')
    } catch (error) {
      this.status.isRunning = false
      this.status.health = 'error'
      
      await this.logWorkerEvent('WORKER_START', 'ERROR', 
        `Failed to start worker: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      
      throw error
    }
  }

  /**
   * Stop the background worker
   */
  async stop(): Promise<void> {
    if (!this.status.isRunning) {
      console.log('⚠️  AI Worker is not running')
      return
    }

    try {
      console.log('🛑 Stopping AI Processing Worker...')
      this.isShuttingDown = true

      // Clear timers
      if (this.processingTimer) {
        clearTimeout(this.processingTimer)
        this.processingTimer = undefined
      }

      if (this.healthCheckTimer) {
        clearTimeout(this.healthCheckTimer)
        this.healthCheckTimer = undefined
      }

      // Wait for current processing to complete
      if (this.processingPromise) {
        console.log('⏳ Waiting for current processing to complete...')
        await this.processingPromise
      }

      this.status.isRunning = false
      this.status.isProcessing = false
      this.status.health = 'healthy'

      await this.logWorkerEvent('WORKER_STOP', 'SUCCESS', 'AI Processing Worker stopped')

      console.log('✅ AI Processing Worker stopped successfully')
    } catch (error) {
      await this.logWorkerEvent('WORKER_STOP', 'ERROR', 
        `Failed to stop worker cleanly: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * Restart the worker
   */
  async restart(): Promise<void> {
    console.log('🔄 Restarting AI Processing Worker...')
    await this.stop()
    await new Promise(resolve => setTimeout(resolve, 2000)) // Brief pause
    await this.start()
  }

  /**
   * Get current worker status
   */
  getStatus(): WorkerStatus {
    const now = new Date()
    return {
      ...this.status,
      uptime: this.status.startedAt ? now.getTime() - this.status.startedAt.getTime() : 0,
      nextScheduledAt: this.getNextScheduledTime()
    }
  }

  /**
   * Get worker performance metrics
   */
  async getMetrics(): Promise<WorkerMetrics> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Get recent processing metrics
    const [recentLogs, totalStats] = await Promise.all([
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
      
      prisma.processingLog.aggregate({
        where: {
          type: { in: ['AI_CLASSIFICATION', 'QUEUE_PROCESS_BATCH'] },
          createdAt: { gte: this.status.startedAt || oneHourAgo }
        },
        _count: { id: true },
        _avg: { processingTime: true }
      })
    ])

    const uptime = this.status.startedAt ? now.getTime() - this.status.startedAt.getTime() : 0
    const lastHourThroughput = recentLogs.length
    const averageProcessingTime = totalStats._avg.processingTime || 0
    const successRate = this.status.processedCount > 0 
      ? (this.status.processedCount - this.status.errorCount) / this.status.processedCount
      : 1

    return {
      totalProcessed: this.status.processedCount,
      totalErrors: this.status.errorCount,
      averageProcessingTime,
      batchesCompleted: Math.floor(this.status.processedCount / this.config.batchSize),
      lastHourThroughput,
      successRate,
      uptime
    }
  }

  /**
   * Process the next batch (main worker logic)
   */
  private async processNextBatch(): Promise<void> {
    if (this.isShuttingDown || !this.status.isRunning) {
      return
    }

    if (this.status.isProcessing) {
      console.log('⏭️  Skipping processing - already in progress')
      return
    }

    try {
      this.status.isProcessing = true
      const startTime = Date.now()

      // Check if there are items to process
      const queueMetrics = await aiProcessingQueue.getQueueMetrics()
      
      if (queueMetrics.pending === 0) {
        // No items to process
        this.status.isProcessing = false
        this.scheduleNextProcessing()
        return
      }

      console.log(`🔄 Worker processing batch: ${queueMetrics.pending} items pending`)

      // Process the queue
      const result = await aiProcessingQueue.processQueue()
      
      // Update status
      this.status.processedCount += result.successful
      this.status.errorCount += result.failed
      this.status.lastProcessedAt = new Date()
      
      const processingTime = Date.now() - startTime

      // Log batch completion
      await this.logWorkerEvent('WORKER_BATCH_COMPLETE', 
        result.failed > 0 ? 'WARNING' : 'SUCCESS',
        `Processed batch: ${result.successful} successful, ${result.failed} failed`,
        { result, processingTime }
      )

      // Record analytics metrics
      try {
        await analyticsEngine.recordMetrics({
          timestamp: new Date(),
          batchSize: this.config.batchSize,
          processedCount: result.successful + result.failed,
          successCount: result.successful,
          errorCount: result.failed,
          processingTime,
          queueDepth: queueMetrics.pending - (result.successful + result.failed),
          workerStatus: this.status.health,
          memoryUsage: process.memoryUsage ? Math.round(process.memoryUsage().heapUsed / 1024 / 1024) : undefined,
          cpuUsage: undefined // Can be added with more sophisticated monitoring
        })
      } catch (analyticsError) {
        console.warn('⚠️  Failed to record analytics metrics:', analyticsError)
      }

      // Update health status
      this.updateHealthStatus(result)

      console.log(`✅ Worker batch completed: ${result.successful} successful, ${result.failed} failed (${processingTime}ms)`)

    } catch (error) {
      this.status.errorCount++
      this.status.health = 'error'

      await this.logWorkerEvent('WORKER_BATCH_ERROR', 'ERROR',
        `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )

      console.error('❌ Worker batch processing failed:', error)
    } finally {
      this.status.isProcessing = false
      this.scheduleNextProcessing()
    }
  }

  /**
   * Schedule the next processing cycle
   */
  private scheduleNextProcessing(): void {
    if (this.isShuttingDown || !this.status.isRunning) {
      return
    }

    // Clear existing timer
    if (this.processingTimer) {
      clearTimeout(this.processingTimer)
    }

    // Schedule next processing
    this.processingTimer = setTimeout(() => {
      this.processingPromise = this.processNextBatch()
    }, this.config.processingInterval)
  }

  /**
   * Start health monitoring
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer)
    }

    this.healthCheckTimer = setTimeout(async () => {
      await this.performHealthCheck()
      
      // Schedule next health check
      if (this.status.isRunning && !this.isShuttingDown) {
        this.startHealthCheck()
      }
    }, this.config.healthCheckInterval)
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const now = new Date()
      const queueMetrics = await aiProcessingQueue.getQueueMetrics()
      
      // Check if worker is stuck (no processing for too long with pending items)
      const maxIdleTime = this.config.processingInterval * 3 // 3 intervals
      const isStuck = this.status.lastProcessedAt && 
        queueMetrics.pending > 0 && 
        (now.getTime() - this.status.lastProcessedAt.getTime()) > maxIdleTime

      // Check error rate
      const errorRate = this.status.processedCount > 0 
        ? this.status.errorCount / this.status.processedCount 
        : 0

      // Determine health status
      let newHealth: 'healthy' | 'warning' | 'error' = 'healthy'
      
      if (isStuck || errorRate > 0.5) {
        newHealth = 'error'
      } else if (errorRate > 0.2 || queueMetrics.pending > 1000) {
        newHealth = 'warning'
      }

      // Log health status change
      if (newHealth !== this.status.health) {
        await this.logWorkerEvent('WORKER_HEALTH_CHECK', 
          newHealth === 'healthy' ? 'SUCCESS' : 'WARNING',
          `Worker health changed from ${this.status.health} to ${newHealth}`,
          { 
            previousHealth: this.status.health,
            newHealth,
            queueMetrics,
            errorRate,
            isStuck
          }
        )
        
        this.status.health = newHealth
        console.log(`🏥 Worker health status: ${newHealth}`)
      }

    } catch (error) {
      console.error('❌ Health check failed:', error)
      this.status.health = 'error'
    }
  }

  /**
   * Update health status based on processing results
   */
  private updateHealthStatus(result: ProcessingResult): void {
    const errorRate = result.processed > 0 ? result.failed / result.processed : 0
    
    if (errorRate > 0.5) {
      this.status.health = 'error'
    } else if (errorRate > 0.2) {
      this.status.health = 'warning'
    } else if (this.status.health === 'error' || this.status.health === 'warning') {
      // Only improve health if there were no errors in this batch
      if (result.failed === 0) {
        this.status.health = 'healthy'
      }
    }
  }

  /**
   * Get next scheduled processing time
   */
  private getNextScheduledTime(): Date | undefined {
    if (!this.status.isRunning || this.isShuttingDown) {
      return undefined
    }
    
    return new Date(Date.now() + this.config.processingInterval)
  }

  /**
   * Log worker events
   */
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

  /**
   * Update worker configuration
   */
  updateConfig(newConfig: Partial<WorkerConfig>): void {
    const oldConfig = { ...this.config }
    this.config = { ...this.config, ...newConfig }
    
    console.log('⚙️  Worker configuration updated:', {
      old: oldConfig,
      new: this.config
    })

    // If interval changed and worker is running, restart scheduling
    if (this.status.isRunning && oldConfig.processingInterval !== this.config.processingInterval) {
      this.scheduleNextProcessing()
    }
  }
}

// Export singleton worker instance
export const aiProcessingWorker = new AIProcessingWorker()