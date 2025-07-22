import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for filtering
    const where: any = {}

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    // Get feeds from database
    const feeds = await prisma.feed.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { name: 'asc' }
      ],
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    // Get total count for pagination
    const total = await prisma.feed.count({ where })

    return NextResponse.json({
      success: true,
      data: feeds,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
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

    // Check if feed with this URL already exists
    const existingFeed = await prisma.feed.findUnique({
      where: { url: body.url }
    })

    if (existingFeed) {
      return NextResponse.json(
        { success: false, error: 'Feed with this URL already exists' },
        { status: 409 }
      )
    }

    // Create new feed in database
    const newFeed = await prisma.feed.create({
      data: {
        name: body.name,
        url: body.url,
        category: body.category,
        isActive: body.isActive ?? true,
        status: 'ACTIVE',
        successRate: 1.0,
        priority: body.priority || 1,
        customHeaders: body.customHeaders || null,
        processingRules: body.processingRules || null
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newFeed,
      message: 'Feed created successfully'
    })
  } catch (error) {
    console.error('Error creating feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create feed' },
      { status: 500 }
    )
  }
}