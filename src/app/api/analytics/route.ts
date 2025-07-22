import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)
    
    // Get total articles in date range
    const totalArticles = await prisma.article.count({
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Get articles with current classifications (discrimination types)
    const classificationData = await prisma.article.groupBy({
      by: ['discriminationType'],
      _count: {
        discriminationType: true
      },
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Convert to classification type format expected by frontend
    const classificationType: Record<string, number> = {
      'discrimination': 0,
      'bias': 0, 
      'fairness': 0,
      'neutral': 0
    }

    // Map discrimination types to our categories
    classificationData.forEach(item => {
      const count = item._count.discriminationType
      switch (item.discriminationType) {
        case 'RACIAL':
        case 'RELIGIOUS':
        case 'DISABILITY':
        case 'MULTIPLE':
          classificationType.discrimination += count
          break
        case 'GENERAL_AI':
          classificationType.bias += count
          break
        default:
          classificationType.neutral += count
      }
    })

    // Calculate fairness articles (those with keywords but not classified as discrimination)
    const fairnessKeywordCount = await prisma.article.count({
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        },
        OR: [
          { title: { contains: 'fairness', mode: 'insensitive' } },
          { title: { contains: 'equality', mode: 'insensitive' } },
          { title: { contains: 'inclusive', mode: 'insensitive' } },
          { content: { contains: 'fairness', mode: 'insensitive' } }
        ],
        discriminationType: {
          notIn: ['RACIAL', 'RELIGIOUS', 'DISABILITY', 'MULTIPLE']
        }
      }
    })
    
    classificationType.fairness = fairnessKeywordCount
    classificationType.neutral = Math.max(0, totalArticles - 
      classificationType.discrimination - classificationType.bias - classificationType.fairness)

    // Get feed activity data
    const feedActivity = await prisma.article.groupBy({
      by: ['source'],
      _count: {
        source: true
      },
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        _count: {
          source: 'desc'
        }
      },
      take: 10
    })

    const feedActivityFormatted = feedActivity.map(item => ({
      feed: item.source,
      count: item._count.source
    }))

    // Generate time series data (group by date)
    const timeSeriesRaw = await prisma.article.groupBy({
      by: ['publishedAt'],
      _count: {
        publishedAt: true
      },
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        publishedAt: 'asc'
      }
    })

    // Process time series to daily buckets
    const dailyData: Record<string, { count: number, classification: string }> = {}
    
    timeSeriesRaw.forEach(item => {
      const dateKey = item.publishedAt.toISOString().split('T')[0]
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { count: 0, classification: 'neutral' }
      }
      dailyData[dateKey].count += item._count.publishedAt
    })

    const timeSeriesFormatted = Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      classification: data.classification
    }))

    // Extract keywords from articles
    const keywordCounts: Record<string, number> = {}
    const articlesWithKeywords = await prisma.article.findMany({
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        },
        keywords: {
          not: {
            equals: []
          }
        }
      },
      select: {
        keywords: true,
        title: true
      }
    })

    // Count keywords from database keywords field and extract from titles
    articlesWithKeywords.forEach(article => {
      // Process stored keywords
      if (article.keywords && article.keywords.length > 0) {
        article.keywords.forEach(keyword => {
          const normalizedKeyword = keyword.toLowerCase().trim()
          keywordCounts[normalizedKeyword] = (keywordCounts[normalizedKeyword] || 0) + 1
        })
      }
      
      // Extract keywords from titles as fallback
      const titleWords = article.title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && 
          ['discrimination', 'bias', 'artificial', 'intelligence', 'algorithm', 'fairness', 'equality', 'racial', 'gender', 'employment', 'hiring'].includes(word))
      
      titleWords.forEach(word => {
        keywordCounts[word] = (keywordCounts[word] || 0) + 1
      })
    })

    // Convert to sorted array
    const topKeywords = Object.entries(keywordCounts)
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)

    // If no keywords extracted, provide fallback based on content analysis
    if (topKeywords.length === 0) {
      const contentAnalysis = await prisma.article.findMany({
        where: {
          publishedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          title: true,
          content: true
        },
        take: 20
      })

      const commonKeywords = ['ai', 'bias', 'discrimination', 'algorithm', 'fairness', 'machine learning', 'employment', 'privacy', 'civil rights', 'technology']
      commonKeywords.forEach((keyword, index) => {
        const count = contentAnalysis.filter(article => 
          article.title.toLowerCase().includes(keyword) || 
          article.content.toLowerCase().includes(keyword)
        ).length
        
        if (count > 0) {
          topKeywords.push({ keyword, frequency: count })
        }
      })
    }

    // Calculate summary metrics
    const avgArticlesPerDay = totalArticles > 0 ? totalArticles / days : 0
    const discriminationCount = classificationType.discrimination || 0
    
    // Determine trend (simplified - could compare with previous period)
    const discriminationTrend = discriminationCount > (totalArticles * 0.3) ? 'up' : 
                                discriminationCount > (totalArticles * 0.1) ? 'stable' : 'down'
    
    const mostActiveFeed = feedActivityFormatted[0]?.feed || 'No active feeds'
    
    // Calculate confidence score based on how many articles have been classified
    const classifiedArticles = discriminationCount + classificationType.bias + classificationType.fairness
    const confidenceScore = totalArticles > 0 ? Math.min(0.95, classifiedArticles / totalArticles + 0.1) : 0.1

    const analytics = {
      totalArticles,
      classificationType,
      feedActivity: feedActivityFormatted,
      timeSeriesData: timeSeriesFormatted,
      topKeywords,
      summary: {
        avgArticlesPerDay: parseFloat(avgArticlesPerDay.toFixed(2)),
        discriminationTrend: discriminationTrend as 'up' | 'down' | 'stable',
        mostActiveFeed,
        confidenceScore: parseFloat(confidenceScore.toFixed(2))
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    
    // Return fallback data if database query fails
    const fallbackAnalytics = {
      totalArticles: 0,
      classificationType: {
        'discrimination': 0,
        'bias': 0,
        'fairness': 0,
        'neutral': 0
      },
      feedActivity: [],
      timeSeriesData: [],
      topKeywords: [],
      summary: {
        avgArticlesPerDay: 0,
        discriminationTrend: 'stable' as const,
        mostActiveFeed: 'No active feeds',
        confidenceScore: 0
      }
    }
    
    return NextResponse.json(fallbackAnalytics)
  }
}