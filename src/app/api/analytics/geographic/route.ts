import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

interface GeographicData {
  locations: Array<{
    id: string
    name: string
    code: string
    coordinates?: [number, number]
    value: number
    articles: number
    severity: {
      high: number
      medium: number
      low: number
    }
    categories: Array<{
      type: string
      count: number
    }>
  }>
  summary: {
    totalArticles: number
    totalLocations: number
    topLocation: string
    dateRange: {
      start: string
      end: string
    }
  }
}

// Geographic mapping for enhanced data
const LOCATION_MAPPING = {
  'MICHIGAN': {
    id: 'michigan',
    name: 'Michigan',
    code: 'US-MI',
    coordinates: [-84.5555, 44.3467] as [number, number]
  },
  'NATIONAL': {
    id: 'usa',
    name: 'United States',
    code: 'US',
    coordinates: [-95.7129, 37.0902] as [number, number]
  },
  'INTERNATIONAL': {
    id: 'world',
    name: 'International',
    code: 'WORLD',
    coordinates: [0, 0] as [number, number]
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const category = searchParams.get('category') || 'ALL'
    
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
    
    // Add category filter if specified
    if (category !== 'ALL') {
      whereCondition.discriminationType = category
    }
    
    // Get location distribution with detailed breakdown
    const locationData = await prisma.article.groupBy({
      by: ['location', 'severity', 'discriminationType'],
      where: whereCondition,
      _count: true,
      orderBy: {
        _count: { location: 'desc' }
      }
    })
    
    // Process and aggregate the data
    const locationMap = new Map<string, any>()
    
    locationData.forEach(item => {
      const locationKey = item.location
      
      if (!locationMap.has(locationKey)) {
        const mapping = LOCATION_MAPPING[locationKey as keyof typeof LOCATION_MAPPING]
        locationMap.set(locationKey, {
          ...mapping,
          value: 0,
          articles: 0,
          severity: { high: 0, medium: 0, low: 0 },
          categories: new Map<string, number>()
        })
      }
      
      const location = locationMap.get(locationKey)!
      location.articles += item._count
      location.value += item._count
      
      // Add severity data
      const severityKey = item.severity.toLowerCase() as keyof typeof location.severity
      location.severity[severityKey] += item._count
      
      // Add category data
      const categoryMap = location.categories
      const currentCount = categoryMap.get(item.discriminationType) || 0
      categoryMap.set(item.discriminationType, currentCount + item._count)
    })
    
    // Convert to final format
    const locations = Array.from(locationMap.values()).map(location => ({
      ...location,
      categories: Array.from(location.categories.entries()).map(([type, count]: [string, number]) => ({
        type,
        count
      })).sort((a, b) => b.count - a.count)
    }))
    
    // Calculate summary statistics
    const totalArticles = locations.reduce((sum, loc) => sum + loc.articles, 0)
    const topLocation = locations.length > 0 
      ? locations.sort((a, b) => b.articles - a.articles)[0].name
      : 'N/A'
    
    const response: GeographicData = {
      locations,
      summary: {
        totalArticles,
        totalLocations: locations.length,
        topLocation,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Geographic analytics error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch geographic analytics',
        locations: [],
        summary: {
          totalArticles: 0,
          totalLocations: 0,
          topLocation: 'N/A',
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          }
        }
      },
      { status: 500 }
    )
  }
}