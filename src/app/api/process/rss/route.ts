import { NextRequest, NextResponse } from 'next/server'
import { processFeedsBatch } from '@/lib/rss-processor'
import { AIClassifier } from '@/lib/ai-classifier'
import { Feed, Article } from '@/types'

// Mock feeds for processing
const mockFeeds: Feed[] = [
  {
    id: 'feed-1',
    name: 'Michigan Civil Rights News',
    url: 'https://feeds.feedburner.com/TechCrunch',
    category: 'CIVIL_RIGHTS',
    isActive: true,
    lastFetched: null,
    status: 'ACTIVE',
    errorMessage: null,
    successRate: 1.0,
    customHeaders: null,
    processingRules: null,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'feed-2',
    name: 'AI Ethics Daily',
    url: 'https://rss.cnn.com/rss/edition.rss',
    category: 'DATA_ETHICS',
    isActive: true,
    lastFetched: null,
    status: 'ACTIVE',
    errorMessage: null,
    successRate: 1.0,
    customHeaders: null,
    processingRules: null,
    priority: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const feedIds = body.feedIds || null
    const classify = body.classify ?? true
    const maxFeeds = body.maxFeeds || 10

    // Get feeds to process
    let feedsToProcess = mockFeeds.filter(feed => feed.isActive)
    
    if (feedIds) {
      feedsToProcess = feedsToProcess.filter(feed => feedIds.includes(feed.id))
    }

    feedsToProcess = feedsToProcess.slice(0, maxFeeds)

    if (feedsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No feeds to process',
          processed: 0,
          errors: []
        }
      })
    }

    // Process RSS feeds
    const processingResults = await processFeedsBatch(feedsToProcess)
    
    // Collect all articles for classification
    const allArticles: Article[] = []
    const processingErrors: string[] = []
    
    processingResults.forEach(result => {
      allArticles.push(...result.articles)
      processingErrors.push(...result.errors)
    })

    // Classify articles if requested
    let classificationResults: Map<string, any> = new Map()
    if (classify && allArticles.length > 0) {
      const classifier = new AIClassifier()
      classificationResults = await classifier.classifyArticles(allArticles)
    }

    // Apply classifications to articles
    const classifiedArticles = allArticles.map(article => {
      const classification = classificationResults.get(article.id)
      if (classification) {
        return {
          ...article,
          location: classification.location,
          discriminationType: classification.discriminationType,
          severity: classification.severity,
          organizations: classification.entities.organizations,
          keywords: classification.keywords,
          entities: classification.entities,
          processed: true,
          confidenceScore: classification.confidenceScore,
          aiClassification: {
            model: 'ai-classifier',
            timestamp: new Date().toISOString(),
            reasoning: classification.reasoning
          }
        }
      }
      return article
    })

    // Calculate statistics
    const stats = {
      totalFeeds: feedsToProcess.length,
      successfulFeeds: processingResults.filter(r => r.errors.length === 0).length,
      totalArticles: classifiedArticles.length,
      michiganArticles: classifiedArticles.filter(a => a.location === 'MICHIGAN').length,
      nationalArticles: classifiedArticles.filter(a => a.location === 'NATIONAL').length,
      internationalArticles: classifiedArticles.filter(a => a.location === 'INTERNATIONAL').length,
      highSeverityArticles: classifiedArticles.filter(a => a.severity === 'HIGH').length,
      mediumSeverityArticles: classifiedArticles.filter(a => a.severity === 'MEDIUM').length,
      lowSeverityArticles: classifiedArticles.filter(a => a.severity === 'LOW').length,
      processingTime: processingResults.reduce((sum, r) => sum + r.processingTime, 0),
      errors: processingErrors.length,
    }

    // In production, save articles to database
    // await db.article.createMany({ data: classifiedArticles })

    return NextResponse.json({
      success: true,
      data: {
        stats,
        articles: classifiedArticles.slice(0, 10), // Return first 10 articles as sample
        errors: processingErrors,
        processingResults: processingResults.map(r => ({
          feedId: r.feed.id,
          feedName: r.feed.name,
          articlesFound: r.articles.length,
          processingTime: r.processingTime,
          errors: r.errors,
          status: r.feed.status
        }))
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing RSS feeds:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process RSS feeds',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return processing status/history
    return NextResponse.json({
      success: true,
      data: {
        lastProcessed: new Date().toISOString(),
        isProcessing: false,
        nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
        activeFeeds: mockFeeds.filter(f => f.isActive).length,
        totalFeeds: mockFeeds.length,
        averageProcessingTime: 45000, // 45 seconds
        successRate: 0.95,
        recentJobs: [
          {
            id: 'job-1',
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
            status: 'completed',
            feedsProcessed: 78,
            articlesFound: 156,
            errors: 2
          },
          {
            id: 'job-2',
            startTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 26 * 60 * 60 * 1000 + 42000).toISOString(),
            status: 'completed',
            feedsProcessed: 78,
            articlesFound: 143,
            errors: 1
          }
        ]
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching RSS processing status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch processing status' },
      { status: 500 }
    )
  }
}