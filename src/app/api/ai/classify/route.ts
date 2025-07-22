import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AIClassifier } from '@/lib/ai-classifier'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Get article from database
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        content: true,
        url: true,
        source: true,
        location: true,
        discriminationType: true,
        severity: true,
        confidenceScore: true,
        aiClassification: true
      }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    // Initialize AI classifier and classify the article
    const classifier = new AIClassifier()
    const startTime = Date.now()
    
    const classification = await classifier.classifyArticle({
      id: article.id,
      title: article.title,
      content: article.content,
      url: article.url,
      source: article.source,
      publishedAt: new Date(),
      feedId: '',
      location: article.location,
      discriminationType: article.discriminationType,
      severity: article.severity,
      organizations: [],
      keywords: [],
      processed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const processingTime = Date.now() - startTime

    // Update article with AI classification results
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        location: classification.location,
        discriminationType: classification.discriminationType,
        severity: classification.severity,
        confidenceScore: classification.confidenceScore,
        organizations: classification.entities.organizations,
        keywords: classification.keywords,
        aiClassification: {
          reasoning: classification.reasoning,
          entities: classification.entities,
          timestamp: new Date().toISOString(),
          processingTime,
          provider: process.env.OPENAI_API_KEY ? 'openai' : 'anthropic'
        }
      }
    })

    // Log the classification
    await prisma.processingLog.create({
      data: {
        type: 'AI_CLASSIFICATION',
        status: 'SUCCESS',
        message: `Article classified as ${classification.discriminationType}/${classification.severity}`,
        details: {
          articleId,
          classification: JSON.parse(JSON.stringify(classification)), // Convert to plain object
          processingTime,
          confidenceScore: classification.confidenceScore
        } as any, // Cast to satisfy Prisma JSON type requirements
        processingTime,
        articleId
      }
    })

    console.log(`✅ AI classified article ${articleId}: ${classification.discriminationType}/${classification.severity} (${Math.round(classification.confidenceScore * 100)}% confidence)`)

    return NextResponse.json({
      success: true,
      data: {
        articleId,
        classification,
        processingTime,
        updatedFields: {
          location: classification.location,
          discriminationType: classification.discriminationType,
          severity: classification.severity,
          confidenceScore: classification.confidenceScore
        }
      }
    })
  } catch (error) {
    console.error('❌ AI classification failed:', error)
    
    // Log the error
    try {
      const body = await request.json().catch(() => ({}))
      await prisma.processingLog.create({
        data: {
          type: 'AI_CLASSIFICATION',
          status: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown AI classification error',
          details: {
            error: error instanceof Error ? error.stack : String(error),
            articleId: body.articleId
          } as any, // Cast to satisfy Prisma JSON type requirements
          articleId: body.articleId
        }
      })
    } catch (logError) {
      console.error('Failed to log AI classification error:', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI classification failed'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve classification status for an article
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const articleId = url.searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        location: true,
        discriminationType: true,
        severity: true,
        confidenceScore: true,
        aiClassification: true,
        updatedAt: true
      }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    // Get recent processing logs for this article
    const recentLogs = await prisma.processingLog.findMany({
      where: {
        articleId,
        type: 'AI_CLASSIFICATION'
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        status: true,
        message: true,
        processingTime: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.title,
          location: article.location,
          discriminationType: article.discriminationType,
          severity: article.severity,
          confidenceScore: article.confidenceScore,
          lastProcessed: article.updatedAt,
          aiClassification: article.aiClassification
        },
        recentProcessing: recentLogs
      }
    })
  } catch (error) {
    console.error('Error retrieving classification status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve classification status'
      },
      { status: 500 }
    )
  }
}