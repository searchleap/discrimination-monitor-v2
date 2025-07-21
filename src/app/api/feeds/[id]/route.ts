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
]

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const feed = mockFeeds.find(f => f.id === params.id)
    
    if (!feed) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: feed
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const body = await request.json()
    const feedIndex = mockFeeds.findIndex(f => f.id === params.id)
    
    if (feedIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      )
    }

    // Update feed
    const updatedFeed = {
      ...mockFeeds[feedIndex],
      ...body,
      id: params.id, // Prevent ID changes
      updatedAt: new Date()
    }

    mockFeeds[feedIndex] = updatedFeed

    return NextResponse.json({
      success: true,
      data: updatedFeed,
      message: 'Feed updated successfully'
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update feed' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const feedIndex = mockFeeds.findIndex(f => f.id === params.id)
    
    if (feedIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      )
    }

    // Remove feed
    mockFeeds.splice(feedIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Feed deleted successfully'
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete feed' },
      { status: 500 }
    )
  }
}