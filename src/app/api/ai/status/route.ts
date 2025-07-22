import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check API key configuration
    const openaiConfigured = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== ''
    const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== ''
    
    // Get AI processing statistics from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const [
      totalArticles,
      classifiedArticles,
      recentProcessing,
      avgProcessingTime,
      confidenceStats
    ] = await Promise.all([
      // Total articles in system
      prisma.article.count(),
      
      // Articles with AI classification
      prisma.article.count({
        where: {
          confidenceScore: { not: null }
        }
      }),
      
      // Recent AI processing activity
      prisma.processingLog.findMany({
        where: {
          type: 'AI_CLASSIFICATION',
          createdAt: { gte: yesterday }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          status: true,
          message: true,
          processingTime: true,
          createdAt: true,
          articleId: true
        }
      }),
      
      // Average processing time
      prisma.processingLog.aggregate({
        where: {
          type: 'AI_CLASSIFICATION',
          processingTime: { not: null },
          createdAt: { gte: yesterday }
        },
        _avg: {
          processingTime: true
        }
      }),
      
      // Confidence score distribution
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN "confidenceScore" >= 0.9 THEN 'high'
            WHEN "confidenceScore" >= 0.7 THEN 'medium'
            WHEN "confidenceScore" >= 0.5 THEN 'low'
            ELSE 'very_low'
          END as confidence_range,
          COUNT(*) as count
        FROM "Article" 
        WHERE "confidenceScore" IS NOT NULL
        GROUP BY confidence_range
      `
    ])

    // Calculate processing statistics
    const successful = recentProcessing.filter(log => log.status === 'SUCCESS').length
    const failed = recentProcessing.filter(log => log.status === 'ERROR').length
    const successRate = recentProcessing.length > 0 ? successful / recentProcessing.length : 0

    // Get service health status
    const serviceHealth = {
      overall: 'healthy' as 'healthy' | 'degraded' | 'down',
      openai: openaiConfigured ? 'configured' : 'not_configured',
      anthropic: anthropicConfigured ? 'configured' : 'not_configured'
    }

    if (!openaiConfigured && !anthropicConfigured) {
      serviceHealth.overall = 'down'
    } else if (successRate < 0.8) {
      serviceHealth.overall = 'degraded'
    }

    // Process confidence statistics
    const confidenceDistribution = (confidenceStats as any[]).reduce((acc, row) => {
      acc[row.confidence_range] = parseInt(row.count)
      return acc
    }, { high: 0, medium: 0, low: 0, very_low: 0 })

    return NextResponse.json({
      success: true,
      data: {
        service: {
          health: serviceHealth.overall,
          providers: {
            openai: {
              configured: openaiConfigured,
              status: serviceHealth.openai
            },
            anthropic: {
              configured: anthropicConfigured,
              status: serviceHealth.anthropic
            }
          },
          fallbackMode: !openaiConfigured && !anthropicConfigured
        },
        statistics: {
          totalArticles,
          classifiedArticles,
          classificationCoverage: totalArticles > 0 ? classifiedArticles / totalArticles : 0,
          avgProcessingTime: avgProcessingTime._avg.processingTime || 0,
          successRate,
          confidenceDistribution
        },
        processing: {
          last24Hours: {
            successful,
            failed,
            total: recentProcessing.length
          },
          recentActivity: recentProcessing
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting AI service status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI status'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to test AI service connectivity
export async function POST(request: NextRequest) {
  try {
    const { provider = 'openai' } = await request.json().catch(() => ({}))
    
    // Test article for classification
    const testArticle = {
      id: 'test',
      title: 'AI Algorithm Shows Bias in Hiring Process',
      content: 'A new study reveals that an artificial intelligence system used by major corporations for hiring decisions shows significant bias against minority candidates. The algorithm consistently rated resumes from candidates with traditionally African American names lower than identical resumes with traditionally white names.',
      url: 'https://example.com/test',
      source: 'Test Source',
      publishedAt: new Date(),
      feedId: 'test',
      location: 'NATIONAL' as const,
      discriminationType: 'RACIAL' as const,
      severity: 'MEDIUM' as const,
      organizations: [],
      keywords: [],
      processed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const { AIClassifier } = await import('@/lib/ai-classifier')
    const classifier = new AIClassifier()
    
    const startTime = Date.now()
    const result = await classifier.classifyArticle(testArticle)
    const processingTime = Date.now() - startTime
    
    // Log the test
    await prisma.processingLog.create({
      data: {
        type: 'AI_TEST',
        status: 'SUCCESS',
        message: `AI service test completed using ${provider}`,
        details: {
          provider,
          testResult: JSON.parse(JSON.stringify(result)), // Convert to plain object
          processingTime
        } as any, // Cast to satisfy Prisma JSON type requirements
        processingTime
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        testResult: result,
        processingTime,
        provider: process.env.OPENAI_API_KEY ? 'openai' : 'anthropic',
        message: 'AI service test completed successfully'
      }
    })
  } catch (error) {
    console.error('AI service test failed:', error)
    
    // Log the test failure
    try {
      await prisma.processingLog.create({
        data: {
          type: 'AI_TEST',
          status: 'ERROR',
          message: `AI service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            error: error instanceof Error ? error.stack : String(error)
          } as any // Cast to satisfy Prisma JSON type requirements
        }
      })
    } catch (logError) {
      console.error('Failed to log AI test error:', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI service test failed',
        suggestion: !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY 
          ? 'Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY in environment variables'
          : 'Check API key validity and network connectivity'
      },
      { status: 500 }
    )
  }
}