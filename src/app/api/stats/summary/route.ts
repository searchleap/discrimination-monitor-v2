import { NextRequest, NextResponse } from 'next/server'
import { DashboardMetrics } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Mock metrics calculation - will be replaced with database queries
    const metrics: DashboardMetrics = {
      totalArticles: 80,
      michiganArticles: 12,
      nationalArticles: 45,
      internationalArticles: 23,
      highSeverityArticles: 8,
      mediumSeverityArticles: 28,
      lowSeverityArticles: 44,
      activeFeeds: 75,
      successRate: 0.95,
      lastUpdated: new Date(),
    }

    // Calculate trends (mock data)
    const previousMetrics = {
      totalArticles: 68,
      michiganArticles: 9,
      nationalArticles: 38,
      internationalArticles: 21,
      highSeverityArticles: 6,
      mediumSeverityArticles: 24,
      lowSeverityArticles: 38,
    }

    const trends = {
      totalArticles: {
        current: metrics.totalArticles,
        previous: previousMetrics.totalArticles,
        change: metrics.totalArticles - previousMetrics.totalArticles,
        percentage: Math.round(((metrics.totalArticles - previousMetrics.totalArticles) / previousMetrics.totalArticles) * 100)
      },
      michiganArticles: {
        current: metrics.michiganArticles,
        previous: previousMetrics.michiganArticles,
        change: metrics.michiganArticles - previousMetrics.michiganArticles,
        percentage: Math.round(((metrics.michiganArticles - previousMetrics.michiganArticles) / previousMetrics.michiganArticles) * 100)
      },
      nationalArticles: {
        current: metrics.nationalArticles,
        previous: previousMetrics.nationalArticles,
        change: metrics.nationalArticles - previousMetrics.nationalArticles,
        percentage: Math.round(((metrics.nationalArticles - previousMetrics.nationalArticles) / previousMetrics.nationalArticles) * 100)
      },
      internationalArticles: {
        current: metrics.internationalArticles,
        previous: previousMetrics.internationalArticles,
        change: metrics.internationalArticles - previousMetrics.internationalArticles,
        percentage: Math.round(((metrics.internationalArticles - previousMetrics.internationalArticles) / previousMetrics.internationalArticles) * 100)
      },
      highSeverityArticles: {
        current: metrics.highSeverityArticles,
        previous: previousMetrics.highSeverityArticles,
        change: metrics.highSeverityArticles - previousMetrics.highSeverityArticles,
        percentage: Math.round(((metrics.highSeverityArticles - previousMetrics.highSeverityArticles) / previousMetrics.highSeverityArticles) * 100)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        trends,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        }
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}