import { Feed, Article, ProcessingLog } from '@/types'
import { sanitizeHtml, extractDomain } from '@/lib/utils'

export interface RSSFeed {
  title: string
  link: string
  description: string
  language?: string
  lastBuildDate?: string
  items: RSSItem[]
}

export interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  author?: string
  category?: string[]
  guid?: string
  content?: string
}

export interface FeedProcessingResult {
  feed: Feed
  articles: Article[]
  errors: string[]
  processingTime: number
  duplicatesFound: number
}

export class RSSProcessor {
  private static readonly USER_AGENT = 'AI-Discrimination-Monitor/2.0'
  private static readonly TIMEOUT = 30000 // 30 seconds
  private static readonly MAX_RETRIES = 3

  /**
   * Process a single RSS feed
   */
  async processFeed(feed: Feed): Promise<FeedProcessingResult> {
    const startTime = Date.now()
    const result: FeedProcessingResult = {
      feed,
      articles: [],
      errors: [],
      processingTime: 0,
      duplicatesFound: 0
    }

    try {
      // Fetch RSS feed with retry logic
      const rssData = await this.fetchRSSWithRetry(feed.url)
      
      if (!rssData) {
        result.errors.push('Failed to fetch RSS feed after retries')
        return result
      }

      // Parse RSS items into articles
      const articles = await this.parseRSSItems(rssData.items, feed)
      result.articles = articles

      // Update feed metadata
      result.feed = {
        ...feed,
        lastFetched: new Date(),
        status: 'ACTIVE',
        errorMessage: null,
        successRate: this.calculateSuccessRate(feed, true)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(errorMessage)
      
      result.feed = {
        ...feed,
        lastFetched: new Date(),
        status: 'ERROR',
        errorMessage,
        successRate: this.calculateSuccessRate(feed, false)
      }
    }

    result.processingTime = Date.now() - startTime
    return result
  }

  /**
   * Fetch RSS feed with retry logic and proxy support
   */
  private async fetchRSSWithRetry(url: string): Promise<RSSFeed | null> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= RSSProcessor.MAX_RETRIES; attempt++) {
      try {
        return await this.fetchRSS(url)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < RSSProcessor.MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          await this.sleep(Math.pow(2, attempt - 1) * 1000)
        }
      }
    }

    throw lastError
  }

  /**
   * Fetch RSS feed with proxy support
   */
  private async fetchRSS(url: string): Promise<RSSFeed> {
    const proxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': RSSProcessor.USER_AGENT,
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      signal: AbortSignal.timeout(RSSProcessor.TIMEOUT)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xmlText = await response.text()
    return this.parseRSSXML(xmlText)
  }

  /**
   * Parse RSS XML into structured data
   */
  private parseRSSXML(xmlText: string): RSSFeed {
    // Simple XML parsing - in production, use a proper XML parser like 'fast-xml-parser'
    const titleMatch = xmlText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
    const linkMatch = xmlText.match(/<link>(.*?)<\/link>/)
    const descMatch = xmlText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)
    
    // Extract items
    const itemsRegex = /<item>(.*?)<\/item>/g
    const items: RSSItem[] = []
    let itemMatch

    while ((itemMatch = itemsRegex.exec(xmlText)) !== null) {
      const itemXml = itemMatch[1]
      const item = this.parseRSSItem(itemXml)
      if (item) {
        items.push(item)
      }
    }

    return {
      title: titleMatch?.[1] || titleMatch?.[2] || 'Unknown Feed',
      link: linkMatch?.[1] || '',
      description: descMatch?.[1] || descMatch?.[2] || '',
      items
    }
  }

  /**
   * Parse individual RSS item
   */
  private parseRSSItem(itemXml: string): RSSItem | null {
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/)
    const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)
    const authorMatch = itemXml.match(/<author>(.*?)<\/author>/)
    const guidMatch = itemXml.match(/<guid.*?>(.*?)<\/guid>/)

    if (!titleMatch || !linkMatch) {
      return null
    }

    return {
      title: this.cleanText(titleMatch[1] || titleMatch[2] || ''),
      link: linkMatch[1] || '',
      description: this.cleanText(descMatch?.[1] || descMatch?.[2] || ''),
      pubDate: pubDateMatch?.[1] || new Date().toISOString(),
      author: authorMatch?.[1],
      guid: guidMatch?.[1]
    }
  }

  /**
   * Convert RSS items to Article objects
   */
  private async parseRSSItems(items: RSSItem[], feed: Feed): Promise<Article[]> {
    const articles: Article[] = []
    
    for (const item of items) {
      try {
        const article = await this.convertRSSItemToArticle(item, feed)
        if (article) {
          articles.push(article)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error converting RSS item to article:', error)
      }
    }

    return articles
  }

  /**
   * Convert RSS item to Article object
   */
  private async convertRSSItemToArticle(item: RSSItem, feed: Feed): Promise<Article | null> {
    if (!item.title || !item.link) {
      return null
    }

    const publishedAt = this.parseDate(item.pubDate)
    const content = sanitizeHtml(item.description)
    const summary = this.generateSummary(content)

    return {
      id: this.generateArticleId(item.link),
      title: item.title,
      content,
      summary,
      url: item.link,
      publishedAt,
      source: extractDomain(item.link),
      feedId: feed.id,
      
      // Default values - will be updated by AI classification
      location: 'NATIONAL',
      discriminationType: 'GENERAL_AI',
      severity: 'LOW',
      
      organizations: [],
      keywords: [],
      entities: null,
      
      processed: false,
      processingError: null,
      confidenceScore: null,
      aiClassification: null,
      
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * Generate summary from content
   */
  private generateSummary(content: string, maxLength: number = 300): string {
    if (content.length <= maxLength) {
      return content
    }
    
    const truncated = content.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...'
    }
    
    return truncated + '...'
  }

  /**
   * Generate unique article ID from URL
   */
  private generateArticleId(url: string): string {
    return Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25)
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateString: string): Date {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? new Date() : date
  }

  /**
   * Clean text content
   */
  private cleanText(text: string): string {
    return sanitizeHtml(text)
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Calculate success rate for feed
   */
  private calculateSuccessRate(feed: Feed, currentSuccess: boolean): number {
    // Simple success rate calculation - in production, use historical data
    const currentRate = feed.successRate || 1.0
    const weight = 0.1 // Weight for new result
    
    return currentSuccess 
      ? Math.min(1.0, currentRate + weight * (1.0 - currentRate))
      : Math.max(0.0, currentRate - weight * currentRate)
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Batch process multiple feeds
 */
export async function processFeedsBatch(feeds: Feed[]): Promise<FeedProcessingResult[]> {
  const processor = new RSSProcessor()
  const results: FeedProcessingResult[] = []
  
  // Process feeds in batches to avoid overwhelming the system
  const batchSize = 5
  
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(feed => processor.processFeed(feed))
    )
    results.push(...batchResults)
    
    // Small delay between batches
    if (i + batchSize < feeds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * Create processing log entry
 */
export function createProcessingLog(
  type: string,
  status: string,
  message?: string,
  details?: any,
  feedId?: string,
  articleId?: string
): ProcessingLog {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    status,
    message,
    details,
    processingTime: null,
    feedId,
    articleId,
    createdAt: new Date()
  }
}