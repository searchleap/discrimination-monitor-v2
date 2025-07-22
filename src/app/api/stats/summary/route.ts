import { NextRequest, NextResponse } from 'next/server'
import { DashboardMetrics } from '@/types'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Get real metrics from database
    const [
      totalArticles,
      locationBreakdown,
      severityBreakdown,
      activeFeeds
    ] = await Promise.all([
      // Total articles in date range
      prisma.article.count({
        where: {
          publishedAt: { gte: startDate, lte: endDate }
        }
      }),

      // Articles by location
      prisma.article.groupBy({
        by: ['location'],
        _count: { location: true },
        where: {
          publishedAt: { gte: startDate, lte: endDate }
        }
      }),

      // Articles by severity
      prisma.article.groupBy({
        by: ['severity'],
        _count: { severity: true },
        where: {
          publishedAt: { gte: startDate, lte: endDate }
        }
      }),

      // Active feeds count
      prisma.feed.count({
        where: { isActive: true }
      })
    ])

    // Process location breakdown
    const michiganArticles = locationBreakdown.find(l => l.location === 'MICHIGAN')?._count.location || 0
    const nationalArticles = locationBreakdown.find(l => l.location === 'NATIONAL')?._count.location || 0
    const internationalArticles = locationBreakdown.find(l => l.location === 'INTERNATIONAL')?._count.location || 0

    // Process severity breakdown
    const highSeverityArticles = severityBreakdown.find(s => s.severity === 'HIGH')?._count.severity || 0
    const mediumSeverityArticles = severityBreakdown.find(s => s.severity === 'MEDIUM')?._count.severity || 0
    const lowSeverityArticles = severityBreakdown.find(s => s.severity === 'LOW')?._count.severity || 0

    // Calculate success rate based on active feeds vs total feeds
    const totalFeeds = await prisma.feed.count()
    const successRate = totalFeeds > 0 ? activeFeeds / totalFeeds : 1.0

    const metrics: DashboardMetrics = {
      totalArticles,
      michiganArticles,
      nationalArticles,
      internationalArticles,
      highSeverityArticles,
      mediumSeverityArticles,
      lowSeverityArticles,
      activeFeeds,
      successRate,
      lastUpdated: new Date(),
    }

    // Calculate trends by comparing with previous period
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)
    const previousEndDate = new Date(startDate.getTime())

    const [
      previousTotalArticles,
      previousLocationBreakdown,
      previousSeverityBreakdown
    ] = await Promise.all([
      prisma.article.count({
        where: {
          publishedAt: { gte: previousStartDate, lte: previousEndDate }
        }
      }),

      prisma.article.groupBy({
        by: ['location'],
        _count: { location: true },
        where: {
          publishedAt: { gte: previousStartDate, lte: previousEndDate }
        }
      }),

      prisma.article.groupBy({
        by: ['severity'],
        _count: { severity: true },
        where: {
          publishedAt: { gte: previousStartDate, lte: previousEndDate }
        }
      })
    ])

    const previousMetrics = {
      totalArticles: previousTotalArticles,
      michiganArticles: previousLocationBreakdown.find(l => l.location === 'MICHIGAN')?._count.location || 0,
      nationalArticles: previousLocationBreakdown.find(l => l.location === 'NATIONAL')?._count.location || 0,
      internationalArticles: previousLocationBreakdown.find(l => l.location === 'INTERNATIONAL')?._count.location || 0,
      highSeverityArticles: previousSeverityBreakdown.find(s => s.severity === 'HIGH')?._count.severity || 0,
    }

    // Calculate percentage changes (handle division by zero)
    const calculateTrend = (current: number, previous: number) => ({
      current,
      previous,
      change: current - previous,
      percentage: previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0)
    })

    const trends = {
      totalArticles: calculateTrend(metrics.totalArticles, previousMetrics.totalArticles),
      michiganArticles: calculateTrend(metrics.michiganArticles, previousMetrics.michiganArticles),
      nationalArticles: calculateTrend(metrics.nationalArticles, previousMetrics.nationalArticles),
      internationalArticles: calculateTrend(metrics.internationalArticles, previousMetrics.internationalArticles),
      highSeverityArticles: calculateTrend(metrics.highSeverityArticles, previousMetrics.highSeverityArticles)
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
    console.error('Error fetching dashboard metrics:', error)
    
    // Return fallback data if database query fails
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
      data: {
        metrics: {
          totalArticles: 0,
          michiganArticles: 0,
          nationalArticles: 0,
          internationalArticles: 0,
          highSeverityArticles: 0,
          mediumSeverityArticles: 0,
          lowSeverityArticles: 0,
          activeFeeds: 0,
          successRate: 0,
          lastUpdated: new Date(),
        },
        trends: {},
        dateRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          days: 30
        }
      }
    }, { status: 200 }) // Return 200 with empty data rather than 500
  }
}