import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const location = searchParams.get('location') || 'ALL'
    
    // Calculate date range
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    // Base where condition
    const whereCondition: any = {
      publishedAt: {
        gte: startDate,
        lte: endDate
      }
    }
    
    // Add location filter if specified
    if (location !== 'ALL') {
      whereCondition.location = location
    }
    
    // Get timeline data - group by day
    const timelineData = await prisma.article.findMany({
      where: whereCondition,
      select: {
        publishedAt: true,
        severity: true,
        discriminationType: true
      },
      orderBy: { publishedAt: 'asc' }
    })
    
    // Process timeline data - group by day
    const timelineMap = new Map<string, { date: string; incidents: number; high: number; medium: number; low: number }>()
    
    // Initialize all days in range with 0 values
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - 1 - i)
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd')
      timelineMap.set(dateKey, {
        date: format(date, 'MMM dd'),
        incidents: 0,
        high: 0,
        medium: 0,
        low: 0
      })
    }
    
    // Fill in actual data
    timelineData.forEach(article => {
      const dateKey = format(startOfDay(article.publishedAt), 'yyyy-MM-dd')
      const entry = timelineMap.get(dateKey)
      if (entry) {
        entry.incidents += 1
        if (article.severity === 'HIGH') {
          entry.high += 1
        } else if (article.severity === 'MEDIUM') {
          entry.medium += 1
        } else {
          entry.low += 1
        }
      }
    })
    
    // Get category breakdown
    const categoryData = await prisma.article.groupBy({
      by: ['discriminationType'],
      where: whereCondition,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })
    
    // Get severity breakdown
    const severityData = await prisma.article.groupBy({
      by: ['severity'],
      where: whereCondition,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })
    
    // Get location breakdown
    const locationData = await prisma.article.groupBy({
      by: ['location'],
      where: whereCondition,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })
    
    // Format data for charts
    const timeline = Array.from(timelineMap.values())
    
    const categories = categoryData.map(item => ({
      name: item.discriminationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: item._count.id,
      percentage: Math.round((item._count.id / timelineData.length) * 100)
    }))
    
    const severities = severityData.map(item => ({
      name: item.severity.charAt(0) + item.severity.slice(1).toLowerCase(),
      value: item._count.id,
      color: item.severity === 'HIGH' ? '#dc2626' : 
             item.severity === 'MEDIUM' ? '#ea580c' : '#65a30d'
    }))
    
    const locations = locationData.map(item => ({
      name: item.location.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: item._count.id
    }))
    
    // Calculate trends
    const totalArticles = timelineData.length
    const recentHalf = timeline.slice(-Math.floor(timeline.length / 2))
    const olderHalf = timeline.slice(0, Math.floor(timeline.length / 2))
    
    const recentTotal = recentHalf.reduce((sum, day) => sum + day.incidents, 0)
    const olderTotal = olderHalf.reduce((sum, day) => sum + day.incidents, 0)
    
    const trend = olderTotal === 0 ? 0 : Math.round(((recentTotal - olderTotal) / olderTotal) * 100)
    
    return NextResponse.json({
      success: true,
      data: {
        timeline,
        categories,
        severities,
        locations,
        summary: {
          totalArticles,
          dateRange: {
            start: format(startDate, 'MMM dd, yyyy'),
            end: format(endDate, 'MMM dd, yyyy')
          },
          trend: {
            value: trend,
            direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
          }
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch chart data' 
      },
      { status: 500 }
    )
  }
}