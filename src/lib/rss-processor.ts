import Parser from 'rss-parser'
import { createHash } from 'crypto'
import { AIClassifier } from './ai-classifier'
import { aiProcessingQueue } from './ai-queue'
import { prisma } from './prisma'
import { contentFilterMatcher } from './content-filter'

const parser = new Parser({
  customFields: {
    item: [
      ['description', 'description'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['category', 'categories']
    ]
  }
})



interface RSSItem {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  description?: string
  contentEncoded?: string
  creator?: string
  categories?: string[]
}

interface ProcessingResult {
  success: boolean
  articlesProcessed: number
  newArticles: number
  duplicates: number
  filteredOut: number // New field for tracking filtered articles
  errors: string[]
}

export class RSSProcessor {
  private batchSize: number = parseInt(process.env.RSS_BATCH_SIZE || '10')
  private aiClassifier: AIClassifier
  private enableAIClassification: boolean
  
  constructor() {
    console.log(`RSS Processor initialized with batch size: ${this.batchSize}`)
    this.aiClassifier = new AIClassifier()
    this.enableAIClassification = process.env.ENABLE_AI_CLASSIFICATION !== 'false'
    console.log(`AI Classification: ${this.enableAIClassification ? 'enabled' : 'disabled'}`)
  }

  /**
   * Process a single RSS feed
   */
  async processFeed(feedId: string): Promise<ProcessingResult> {
    const startTime = Date.now()
    const result: ProcessingResult = {
      success: false,
      articlesProcessed: 0,
      newArticles: 0,
      duplicates: 0,
      filteredOut: 0,
      errors: []
    }

    try {
      // Get feed from database
      const feed = await prisma.feed.findUnique({
        where: { id: feedId }
      })

      if (!feed || !feed.isActive) {
        result.errors.push(`Feed ${feedId} not found or inactive`)
        return result
      }

      console.log(`Processing feed: ${feed.name} (${feed.url})`)

      // Parse RSS feed
      const feedData = await parser.parseURL(feed.url)
      
      if (!feedData.items || feedData.items.length === 0) {
        result.errors.push(`No items found in feed: ${feed.name}`)
        return result
      }

      // Process each article
      for (const item of feedData.items) {
        try {
          const processedArticle = await this.processArticle(item as RSSItem, feed.id, feed.name)
          if (processedArticle) {
            if (processedArticle.isNew) {
              result.newArticles++
            } else if (processedArticle.isDuplicate) {
              result.duplicates++
            } else if (processedArticle.isFiltered) {
              result.filteredOut++
            }
            result.articlesProcessed++
          }
        } catch (error) {
          result.errors.push(`Error processing article: ${error}`)
        }
      }

      // Update feed metadata
      await prisma.feed.update({
        where: { id: feedId },
        data: {
          lastFetched: new Date(),
          status: 'ACTIVE',
          errorMessage: null,
          successRate: result.errors.length === 0 ? 1.0 : Math.max(0, 1.0 - (result.errors.length / feedData.items.length))
        }
      })

      // Log processing result
      const processingTime = Date.now() - startTime
      await this.logProcessing('RSS_FETCH', 'SUCCESS', 
        `Processed ${result.articlesProcessed} articles, ${result.newArticles} new, ${result.filteredOut} filtered out`,
        { feedId, processingTime, ...result }
      )

      result.success = result.errors.length === 0
      console.log(`✅ Feed processed: ${feed.name} - ${result.newArticles} new articles`)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(errorMessage)
      
      // Update feed with error status
      await prisma.feed.update({
        where: { id: feedId },
        data: {
          status: 'ERROR',
          errorMessage: errorMessage,
          successRate: Math.max(0, (await this.getFeedSuccessRate(feedId)) - 0.1)
        }
      }).catch(console.error)

      // Log error
      await this.logProcessing('RSS_FETCH', 'ERROR', errorMessage, { feedId })
      
      console.error(`❌ Error processing feed ${feedId}:`, error)
      return result
    }
  }

  /**
   * Process all active feeds
   */
  async processAllFeeds(): Promise<{ [feedId: string]: ProcessingResult }> {
    console.log('🔄 Starting RSS processing for all active feeds...')
    
    try {
      const activeFeeds = await prisma.feed.findMany({
        where: { 
          isActive: true,
          status: { not: 'MAINTENANCE' }
        },
        orderBy: { priority: 'asc' }
      })

      console.log(`Found ${activeFeeds.length} active feeds to process`)
      
      const results: { [feedId: string]: ProcessingResult } = {}
      
      // Process feeds in batches to avoid overwhelming external services
      for (let i = 0; i < activeFeeds.length; i += this.batchSize) {
        const batch = activeFeeds.slice(i, i + this.batchSize)
        console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(activeFeeds.length / this.batchSize)}`)
        
        const batchPromises = batch.map(feed => 
          this.processFeed(feed.id).then(result => ({ feedId: feed.id, result }))
        )
        
        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((promise, index) => {
          if (promise.status === 'fulfilled') {
            results[promise.value.feedId] = promise.value.result
          } else {
            const feedId = batch[index].id
            results[feedId] = {
              success: false,
              articlesProcessed: 0,
              newArticles: 0,
              duplicates: 0,
              filteredOut: 0,
              errors: [`Batch processing failed: ${promise.reason}`]
            }
          }
        })
        
        // Add delay between batches to be respectful to external services
        if (i + this.batchSize < activeFeeds.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // Calculate overall statistics
      const totalProcessed = Object.values(results).reduce((sum, r) => sum + r.articlesProcessed, 0)
      const totalNew = Object.values(results).reduce((sum, r) => sum + r.newArticles, 0)
      const totalFiltered = Object.values(results).reduce((sum, r) => sum + r.filteredOut, 0)
      const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0)
      
      console.log(`🎉 RSS processing completed: ${totalNew} new articles from ${totalProcessed} total processed`)
      console.log(`📊 Filtering summary: ${totalFiltered} articles filtered out`)
      console.log(`📊 Error summary: ${totalErrors} errors across ${activeFeeds.length} feeds`)
      
      return results
      
    } catch (error) {
      console.error('❌ Fatal error in RSS processing:', error)
      throw error
    }
  }

  /**
   * Process a single article from RSS feed
   */
  private async processArticle(item: RSSItem, feedId: string, sourceName: string): Promise<{ isNew: boolean; isDuplicate?: boolean; isFiltered?: boolean } | null> {
    if (!item.title || !item.link) {
      return null
    }

    // Create article hash for duplicate detection
    const articleHash = this.createArticleHash(item.title, item.link)
    
    // Check if article already exists
    const existingArticle = await prisma.article.findUnique({
      where: { url: item.link }
    })

    if (existingArticle) {
      return { isNew: false, isDuplicate: true }
    }

    // Extract content - prefer contentEncoded over description
    const content = item.contentEncoded || item.content || item.description || ''
    const cleanContent = this.cleanContent(content)

    // Apply content filtering before creating the article
    const filterResult = await contentFilterMatcher.shouldStoreArticle(item.title, cleanContent)
    
    if (!filterResult.shouldStore) {
      // Log filtering for debugging
      await this.logProcessing('CONTENT_FILTER', 'INFO', 
        `Article filtered out: ${item.title.substring(0, 100)}...`,
        { 
          feedId, 
          url: item.link,
          reason: filterResult.reason,
          matchedFilters: filterResult.matchedFilters
        }
      )
      
      console.log(`🚫 Article filtered out: "${item.title.substring(0, 60)}..." - ${filterResult.reason}`)
      return { isNew: false, isFiltered: true }
    }
    
    // Parse publication date
    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
    
    // Generate summary (first 200 chars of cleaned content)
    const summary = cleanContent.length > 200 
      ? cleanContent.substring(0, 200) + '...'
      : cleanContent

    // Extract basic keywords (simple implementation - can be enhanced)
    const keywords = this.extractKeywords(item.title + ' ' + cleanContent)

    try {
      // Create article with default values first
      const newArticle = await prisma.article.create({
        data: {
          title: item.title,
          content: cleanContent,
          summary,
          url: item.link,
          publishedAt,
          source: sourceName,
          feedId,
          
          // Default classifications - will be updated by AI processing
          location: 'NATIONAL',
          discriminationType: 'GENERAL_AI',
          severity: 'MEDIUM',
          
          keywords,
          organizations: [],
          entities: {},
          
          processed: false,
          confidenceScore: 0.0
        }
      })

      // Queue AI classification if enabled (using the new queue system)
      if (this.enableAIClassification) {
        try {
          // Add to AI processing queue with MEDIUM priority for new articles
          await aiProcessingQueue.addToQueue(newArticle.id, 'MEDIUM')
          console.log(`🔄 Added article ${newArticle.id} to AI processing queue`)
        } catch (error) {
          // Log but don't throw - this should not fail RSS processing
          console.warn(`⚠️  Failed to add article ${newArticle.id} to AI queue:`, error instanceof Error ? error.message : error)
        }
      }

      return { isNew: true }
    } catch (error) {
      // Handle duplicate key constraint or other DB errors
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return { isNew: false }
      }
      throw error
    }
  }

  /**
   * Clean HTML and extract plain text
   */
  private cleanContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Extract basic keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'cannot', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'
    ])

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))

    // Count word frequencies
    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Return top 10 most frequent words
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Create hash for duplicate detection
   */
  private createArticleHash(title: string, url: string): string {
    return createHash('md5').update(title + url).digest('hex')
  }

  /**
   * Get feed success rate
   */
  private async getFeedSuccessRate(feedId: string): Promise<number> {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { successRate: true }
    })
    return feed?.successRate || 0.0
  }

  // Remove the old AI classification methods - now handled by the queue system

  /**
   * Log processing events
   */
  private async logProcessing(type: string, status: string, message: string, details?: any): Promise<void> {
    try {
      await prisma.processingLog.create({
        data: {
          type,
          status,
          message,
          details: details || {},
          processingTime: details?.processingTime || null,
          feedId: details?.feedId || null,
          articleId: details?.articleId || null
        }
      })
    } catch (error) {
      console.error('Failed to log processing event:', error)
    }
  }
}

export const rssProcessor = new RSSProcessor()