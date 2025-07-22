import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AIClassifier } from '@/lib/ai-classifier'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(body.limit || 10, 50) // Max 50 articles at once
    const forceReprocess = body.forceReprocess || false
    
    console.log(`🤖 Starting background AI classification for up to ${limit} articles...`)
    
    // Find articles that need AI classification
    const whereCondition = forceReprocess 
      ? { processed: true, confidenceScore: { lt: 0.5 } } // Re-process low confidence articles
      : { processed: false } // Process unprocessed articles
    
    const articles = await prisma.article.findMany({
      where: whereCondition,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        url: true,
        source: true,
        publishedAt: true,
        feedId: true,
        location: true,
        discriminationType: true,
        severity: true,
        organizations: true,
        keywords: true,
        processed: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles found for processing',
        processed: 0
      })
    }
    
    const aiClassifier = new AIClassifier()
    let processed = 0
    let failed = 0
    const results = []
    
    // Process articles sequentially to avoid overwhelming APIs
    for (const article of articles) {
      try {
        console.log(`🔄 Processing article: ${article.title.substring(0, 50)}...`)
        
        const classification = await aiClassifier.classifyArticle(article)
        
        // Update article with AI classification
        await prisma.article.update({
          where: { id: article.id },
          data: {
            location: classification.location,
            discriminationType: classification.discriminationType,
            severity: classification.severity,
            confidenceScore: classification.confidenceScore,
            organizations: classification.entities.organizations,
            keywords: [...(article.keywords || []), ...classification.keywords],
            entities: classification.entities as any,
            processed: true,
            aiClassification: JSON.parse(JSON.stringify({
              reasoning: classification.reasoning,
              entities: classification.entities,
              timestamp: new Date().toISOString(),
              provider: process.env.OPENAI_API_KEY ? 'openai' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'fallback'
            })) as any,
            processingError: null // Clear any previous errors
          }
        })
        
        // Log successful classification
        await prisma.processingLog.create({
          data: {
            type: 'AI_CLASSIFICATION',
            status: 'SUCCESS',
            message: `Background classification: ${classification.discriminationType}/${classification.severity}`,
            details: JSON.parse(JSON.stringify({
              articleId: article.id,
              confidenceScore: classification.confidenceScore,
              provider: process.env.OPENAI_API_KEY ? 'openai' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'fallback'
            })) as any,
            articleId: article.id,
            feedId: article.feedId
          }
        })
        
        results.push({
          articleId: article.id,
          title: article.title.substring(0, 50) + '...',
          classification: classification.discriminationType,
          severity: classification.severity,
          confidence: Math.round(classification.confidenceScore * 100) / 100
        })
        
        processed++
        
        // Small delay between articles to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        console.error(`❌ Failed to classify article ${article.id}:`, errorMessage)
        
        // Update article with error
        await prisma.article.update({
          where: { id: article.id },
          data: {
            processed: true,
            processingError: errorMessage
          }
        }).catch(() => {}) // Ignore update errors
        
        // Log error
        await prisma.processingLog.create({
          data: {
            type: 'AI_CLASSIFICATION',
            status: 'ERROR',
            message: `Background classification failed: ${errorMessage}`,
            details: JSON.parse(JSON.stringify({ articleId: article.id })) as any,
            articleId: article.id,
            feedId: article.feedId
          }
        }).catch(() => {}) // Ignore logging errors
        
        results.push({
          articleId: article.id,
          title: article.title.substring(0, 50) + '...',
          error: errorMessage
        })
      }
    }
    
    console.log(`✅ Background AI classification completed: ${processed} processed, ${failed} failed`)
    
    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: articles.length,
      results
    })
    
  } catch (error) {
    console.error('❌ Background AI classification failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get status of articles needing AI classification
    const unprocessedCount = await prisma.article.count({
      where: { processed: false }
    })
    
    const lowConfidenceCount = await prisma.article.count({
      where: { 
        processed: true, 
        confidenceScore: { lt: 0.5 } 
      }
    })
    
    const recentProcessing = await prisma.processingLog.findMany({
      where: { type: 'AI_CLASSIFICATION' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
        articleId: true
      }
    })
    
    return NextResponse.json({
      success: true,
      unprocessedCount,
      lowConfidenceCount,
      recentProcessing: recentProcessing.map(log => ({
        id: log.id,
        status: log.status.toLowerCase(),
        message: log.message,
        timestamp: log.createdAt.toISOString(),
        articleId: log.articleId
      }))
    })
    
  } catch (error) {
    console.error('Error getting background classification status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    )
  }
}