import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AIClassifier } from '@/lib/ai-classifier'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      articleIds, 
      batchSize = 5, 
      forceReprocess = false,
      minConfidence = 0.0 
    } = body

    let targetArticles

    if (articleIds && Array.isArray(articleIds)) {
      // Process specific articles
      targetArticles = await prisma.article.findMany({
        where: { 
          id: { in: articleIds }
        },
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
          publishedAt: true
        }
      })
    } else {
      // Process articles that haven't been classified or have low confidence
      const whereClause = forceReprocess 
        ? {} 
        : {
            OR: [
              { confidenceScore: null },
              { confidenceScore: { lt: minConfidence } }
            ]
          }

      targetArticles = await prisma.article.findMany({
        where: whereClause,
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
          publishedAt: true
        },
        take: 50, // Limit for safety
        orderBy: { publishedAt: 'desc' }
      })
    }

    if (targetArticles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles found matching criteria',
        data: {
          processed: 0,
          successful: 0,
          failed: 0,
          results: []
        }
      })
    }

    console.log(`🤖 Starting batch AI classification of ${targetArticles.length} articles`)

    const classifier = new AIClassifier()
    const results: any[] = []
    let successful = 0
    let failed = 0
    const startTime = Date.now()

    // Process articles in batches to respect API limits
    for (let i = 0; i < targetArticles.length; i += batchSize) {
      const batch = targetArticles.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(targetArticles.length / batchSize)}...`)

      const batchPromises = batch.map(async (article) => {
        try {
          const classification = await classifier.classifyArticle({
            id: article.id,
            title: article.title,
            content: article.content,
            url: article.url,
            source: article.source,
            publishedAt: article.publishedAt,
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

          // Update article with AI classification
          await prisma.article.update({
            where: { id: article.id },
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
                batchProcessing: true,
                provider: process.env.OPENAI_API_KEY ? 'openai' : 'anthropic'
              }
            }
          })

          // Log success
          await prisma.processingLog.create({
            data: {
              type: 'AI_BATCH_CLASSIFICATION',
              status: 'SUCCESS',
              message: `Batch classified: ${classification.discriminationType}/${classification.severity}`,
              details: {
                articleId: article.id,
                classification: JSON.parse(JSON.stringify(classification)), // Convert to plain object
                confidenceScore: classification.confidenceScore
              },
              articleId: article.id
            }
          })

          successful++
          return {
            articleId: article.id,
            success: true,
            classification,
            previousConfidence: article.confidenceScore,
            newConfidence: classification.confidenceScore
          }
        } catch (error) {
          console.error(`Failed to classify article ${article.id}:`, error)
          
          // Log failure
          await prisma.processingLog.create({
            data: {
              type: 'AI_BATCH_CLASSIFICATION',
              status: 'ERROR',
              message: `Batch classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              details: {
                articleId: article.id,
                error: error instanceof Error ? error.stack : String(error)
              } as any, // Cast to satisfy Prisma JSON type requirements
              articleId: article.id
            }
          })

          failed++
          return {
            articleId: article.id,
            success: false,
            error: error instanceof Error ? error.message : 'Classification failed'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Rate limiting delay between batches
      if (i + batchSize < targetArticles.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const totalProcessingTime = Date.now() - startTime

    // Create summary processing log
    await prisma.processingLog.create({
      data: {
        type: 'AI_BATCH_COMPLETE',
        status: successful > 0 ? 'SUCCESS' : 'ERROR',
        message: `Batch classification completed: ${successful}/${targetArticles.length} successful`,
        details: {
          totalArticles: targetArticles.length,
          successful,
          failed,
          processingTime: totalProcessingTime,
          batchSize
        },
        processingTime: totalProcessingTime
      }
    })

    console.log(`✅ Batch AI classification completed: ${successful}/${targetArticles.length} successful in ${totalProcessingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        processed: targetArticles.length,
        successful,
        failed,
        processingTime: totalProcessingTime,
        successRate: targetArticles.length > 0 ? successful / targetArticles.length : 0,
        results: results.map(r => ({
          articleId: r.articleId,
          success: r.success,
          ...(r.success ? {
            discriminationType: r.classification.discriminationType,
            severity: r.classification.severity,
            location: r.classification.location,
            confidenceImprovement: r.newConfidence - (r.previousConfidence || 0)
          } : {
            error: r.error
          })
        }))
      }
    })
  } catch (error) {
    console.error('❌ Batch AI classification failed:', error)
    
    // Log the batch failure
    try {
      await prisma.processingLog.create({
        data: {
          type: 'AI_BATCH_COMPLETE',
          status: 'ERROR',
          message: `Batch classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            error: error instanceof Error ? error.stack : String(error)
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log batch error:', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Batch classification failed'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check batch processing status
export async function GET(request: NextRequest) {
  try {
    // Get statistics about articles needing classification
    const [
      totalArticles,
      classifiedArticles,
      lowConfidenceArticles,
      unclassifiedArticles,
      recentBatchJobs
    ] = await Promise.all([
      prisma.article.count(),
      
      prisma.article.count({
        where: { confidenceScore: { not: null } }
      }),
      
      prisma.article.count({
        where: { 
          confidenceScore: { 
            not: null,
            lt: 0.7 
          } 
        }
      }),
      
      prisma.article.count({
        where: { confidenceScore: null }
      }),
      
      prisma.processingLog.findMany({
        where: { 
          type: { in: ['AI_BATCH_CLASSIFICATION', 'AI_BATCH_COMPLETE'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          type: true,
          status: true,
          message: true,
          details: true,
          processingTime: true,
          createdAt: true
        }
      })
    ])

    const needsClassification = unclassifiedArticles + lowConfidenceArticles

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalArticles,
          classifiedArticles,
          unclassifiedArticles,
          lowConfidenceArticles,
          needsClassification,
          classificationCoverage: totalArticles > 0 ? classifiedArticles / totalArticles : 0
        },
        recommendations: {
          suggestedBatchSize: Math.min(needsClassification, 10),
          estimatedProcessingTime: needsClassification * 3000, // 3 seconds per article
          shouldProcess: needsClassification > 0
        },
        recentActivity: recentBatchJobs
      }
    })
  } catch (error) {
    console.error('Error getting batch processing status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get batch status'
      },
      { status: 500 }
    )
  }
}