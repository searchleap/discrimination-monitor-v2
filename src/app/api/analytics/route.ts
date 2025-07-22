import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Mock analytics data (would be replaced with actual database queries)
    const totalArticles = 156
    
    // Mock classification breakdown
    const classificationType = {
      'discrimination': 45,
      'bias': 32,
      'fairness': 28,
      'neutral': 51
    }

    // Mock feed activity data
    const feedActivityFormatted = [
      { feed: 'Michigan Tech News', count: 28 },
      { feed: 'Civil Rights Today', count: 24 },
      { feed: 'Healthcare AI Journal', count: 19 },
      { feed: 'Employment Law Review', count: 16 },
      { feed: 'AI Ethics Monitor', count: 14 }
    ]

    // Mock time series data
    const timeSeriesFormatted = [
      { date: '2025-01-15', count: 8, classification: 'discrimination' },
      { date: '2025-01-14', count: 5, classification: 'bias' },
      { date: '2025-01-13', count: 12, classification: 'neutral' },
      { date: '2025-01-12', count: 3, classification: 'fairness' },
      { date: '2025-01-11', count: 7, classification: 'discrimination' }
    ]

    // Get top keywords (simplified - would need proper text analysis)
    const topKeywords = [
      { keyword: 'AI', frequency: 145 },
      { keyword: 'bias', frequency: 98 },
      { keyword: 'discrimination', frequency: 87 },
      { keyword: 'algorithm', frequency: 76 },
      { keyword: 'fairness', frequency: 65 },
      { keyword: 'machine learning', frequency: 54 },
      { keyword: 'employment', frequency: 43 },
      { keyword: 'hiring', frequency: 38 },
      { keyword: 'racial', frequency: 32 },
      { keyword: 'gender', frequency: 29 }
    ]

    // Calculate summary metrics
    const avgArticlesPerDay = totalArticles / days
    const discriminationCount = classificationType.discrimination || 0
    const previousDiscrimination = Math.floor(discriminationCount * 0.8) // Mock previous period
    const discriminationTrend = discriminationCount > previousDiscrimination ? 'up' : 
                                discriminationCount < previousDiscrimination ? 'down' : 'stable'
    
    const mostActiveFeed = feedActivityFormatted[0]?.feed || 'N/A'
    const confidenceScore = 0.85 // Mock confidence score

    const analytics = {
      totalArticles,
      classificationType,
      feedActivity: feedActivityFormatted,
      timeSeriesData: timeSeriesFormatted,
      topKeywords,
      summary: {
        avgArticlesPerDay,
        discriminationTrend,
        mostActiveFeed,
        confidenceScore
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}