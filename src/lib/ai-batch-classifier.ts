import { Article, AIClassificationResult } from '@/types'
import { AIClassifier } from './ai-classifier'

export interface BatchClassificationOptions {
  batchSize: number
  delayBetweenBatches: number
  enableBatching: boolean
  maxConcurrentRequests: number
}

export interface BatchClassificationResult {
  successful: number
  failed: number
  results: Map<string, AIClassificationResult>
  errors: Map<string, string>
  processingTime: number
}

export class AIBatchClassifier extends AIClassifier {
  private options: BatchClassificationOptions

  constructor(options?: Partial<BatchClassificationOptions>) {
    super()
    this.options = {
      batchSize: parseInt(process.env.AI_BATCH_SIZE || '5'),
      delayBetweenBatches: parseInt(process.env.AI_BATCH_DELAY || '2000'),
      enableBatching: process.env.AI_ENABLE_BATCHING !== 'false',
      maxConcurrentRequests: parseInt(process.env.AI_MAX_CONCURRENT || '3'),
      ...options
    }

    console.log(`AI Batch Classifier initialized:`, this.options)
  }

  /**
   * Classify multiple articles in batches for better performance
   */
  async classifyArticlesBatch(articles: Article[]): Promise<BatchClassificationResult> {
    const startTime = Date.now()
    const result: BatchClassificationResult = {
      successful: 0,
      failed: 0,
      results: new Map(),
      errors: new Map(),
      processingTime: 0
    }

    if (articles.length === 0) {
      result.processingTime = Date.now() - startTime
      return result
    }

    // If batching is disabled or small number of articles, process individually
    if (!this.options.enableBatching || articles.length <= 2) {
      return await this.classifyIndividually(articles, result, startTime)
    }

    // Process in batches
    return await this.classifyInBatches(articles, result, startTime)
  }

  /**
   * Process articles individually (fallback method)
   */
  private async classifyIndividually(
    articles: Article[], 
    result: BatchClassificationResult, 
    startTime: number
  ): Promise<BatchClassificationResult> {
    console.log(`📝 Processing ${articles.length} articles individually...`)

    for (const article of articles) {
      try {
        const classification = await this.classifyArticle(article)
        result.results.set(article.id, classification)
        result.successful++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.set(article.id, errorMessage)
        result.failed++
      }

      // Small delay between individual requests to avoid rate limiting
      if (articles.indexOf(article) < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    result.processingTime = Date.now() - startTime
    return result
  }

  /**
   * Process articles in optimized batches
   */
  private async classifyInBatches(
    articles: Article[], 
    result: BatchClassificationResult, 
    startTime: number
  ): Promise<BatchClassificationResult> {
    console.log(`📦 Processing ${articles.length} articles in batches of ${this.options.batchSize}...`)

    // Split articles into batches
    const batches = this.createBatches(articles, this.options.batchSize)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} articles)`)

      try {
        // Process batch with concurrency control
        const batchResults = await this.processBatchConcurrently(batch)
        
        // Merge results
        batchResults.forEach((classificationResult, articleId) => {
          if (classificationResult.success) {
            result.results.set(articleId, classificationResult.result!)
            result.successful++
          } else {
            result.errors.set(articleId, classificationResult.error!)
            result.failed++
          }
        })

        console.log(`✅ Batch ${i + 1} completed: ${batchResults.size} articles processed`)

      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error)
        
        // Mark all articles in failed batch as failed
        batch.forEach(article => {
          result.errors.set(article.id, `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          result.failed++
        })
      }

      // Delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches))
      }
    }

    result.processingTime = Date.now() - startTime
    return result
  }

  /**
   * Process a single batch with controlled concurrency
   */
  private async processBatchConcurrently(
    batch: Article[]
  ): Promise<Map<string, { success: boolean; result?: AIClassificationResult; error?: string }>> {
    const results = new Map()
    const semaphore = new Semaphore(this.options.maxConcurrentRequests)

    // Create promises for each article with concurrency control
    const promises = batch.map(async (article) => {
      await semaphore.acquire()
      
      try {
        const classification = await this.classifyArticle(article)
        results.set(article.id, { success: true, result: classification })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.set(article.id, { success: false, error: errorMessage })
      } finally {
        semaphore.release()
      }
    })

    // Wait for all classifications to complete
    await Promise.all(promises)
    return results
  }

  /**
   * Create batches from articles array
   */
  private createBatches(articles: Article[], batchSize: number): Article[][] {
    const batches: Article[][] = []
    
    for (let i = 0; i < articles.length; i += batchSize) {
      batches.push(articles.slice(i, i + batchSize))
    }
    
    return batches
  }

  /**
   * Get optimized batch size based on queue depth and system load
   */
  getOptimalBatchSize(queueDepth: number, systemLoad: number = 0.5): number {
    // Adjust batch size based on queue depth
    let optimalSize = this.options.batchSize

    if (queueDepth > 100) {
      // Larger batches for high queue depth
      optimalSize = Math.min(this.options.batchSize * 2, 10)
    } else if (queueDepth < 10) {
      // Smaller batches for low queue depth
      optimalSize = Math.max(Math.ceil(this.options.batchSize / 2), 2)
    }

    // Adjust for system load
    if (systemLoad > 0.8) {
      optimalSize = Math.max(optimalSize - 2, 1)
    }

    return optimalSize
  }

  /**
   * Update batch classification options
   */
  updateOptions(newOptions: Partial<BatchClassificationOptions>): void {
    this.options = { ...this.options, ...newOptions }
    console.log('⚙️  AI Batch Classifier options updated:', this.options)
  }
}

/**
 * Simple semaphore implementation for concurrency control
 */
class Semaphore {
  private permits: number
  private waiting: (() => void)[] = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--
        resolve()
      } else {
        this.waiting.push(resolve)
      }
    })
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!
      resolve()
    } else {
      this.permits++
    }
  }
}

// Export singleton instance
export const aiBatchClassifier = new AIBatchClassifier()