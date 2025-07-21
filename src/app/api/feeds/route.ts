import { NextRequest, NextResponse } from 'next/server'
import { Feed } from '@/types'

// Mock feed data - will be replaced with database queries
const mockFeeds: Feed[] = [
  {
    id: 'feed-1',
    name: 'Michigan Civil Rights News',
    url: 'https://example.com/michigan-civil-rights.rss',
    category: 'CIVIL_RIGHTS',
    isActive: true,
    lastFetched: new Date('2025-01-09T06:00:00Z'),
    status: 'ACTIVE',
    errorMessage: null,
    successRate: 0.95,
    customHeaders: null,
    processingRules: null,
    priority: 1,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-09T06:00:00Z'),
  },
  {
    id: 'feed-2',
    name: 'AI Ethics Daily',
    url: 'https://example.com/ai-ethics.rss',
    category: 'DATA_ETHICS',
    isActive: true,
    lastFetched: new Date('2025-01-09T06:00:00Z'),
    status: 'ACTIVE',
    errorMessage: null,
    successRate: 0.88,
    customHeaders: null,
    processingRules: null,
    priority: 2,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-09T06:00:00Z'),
  },
  {
    id: 'feed-3',
    name: 'Tech Discrimination Watch',
    url: 'https://example.com/tech-discrimination.rss',
    category: 'TECH_NEWS',
    isActive: true,
    lastFetched: new Date('2025-01-09T06:00:00Z'),
    status: 'ERROR',
    errorMessage: 'Connection timeout',
    successRate: 0.65,
    customHeaders: null,
    processingRules: null,
    priority: 3,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-09T06:00:00Z'),
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter feeds based on query parameters
    let filteredFeeds = mockFeeds

    if (category) {
      filteredFeeds = filteredFeeds.filter(feed => feed.category === category)
    }

    if (status) {
      filteredFeeds = filteredFeeds.filter(feed => feed.status === status)
    }

    // Paginate results
    const paginatedFeeds = filteredFeeds.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedFeeds,
      pagination: {
        total: filteredFeeds.length,
        limit,
        offset,
        hasMore: offset + limit < filteredFeeds.length
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching feeds:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feeds' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.url || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, url, category' },
        { status: 400 }
      )
    }

    // Create new feed
    const newFeed: Feed = {
      id: `feed-${Date.now()}`,
      name: body.name,
      url: body.url,
      category: body.category,
      isActive: body.isActive ?? true,
      lastFetched: null,
      status: 'ACTIVE',
      errorMessage: null,
      successRate: 1.0,
      customHeaders: body.customHeaders || null,
      processingRules: body.processingRules || null,
      priority: body.priority || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // In production, save to database
    // await db.feed.create({ data: newFeed })

    return NextResponse.json({
      success: true,
      data: newFeed,
      message: 'Feed created successfully'
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error creating feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create feed' },
      { status: 500 }
    )
  }
}