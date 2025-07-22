import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const discriminationType = searchParams.get('discriminationType')
    const severity = searchParams.get('severity')
    const search = searchParams.get('search')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build where clause for filtering
    const where: any = {}

    if (location) {
      where.location = location
    }

    if (discriminationType) {
      where.discriminationType = discriminationType
    }

    if (severity) {
      where.severity = severity
    }

    if (source) {
      where.source = source
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          keywords: {
            has: search
          }
        }
      ]
    }

    // Get articles from database
    const articles = await prisma.article.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: offset,
      take: limit,
      include: {
        feed: {
          select: {
            name: true,
            category: true
          }
        }
      }
    })

    // Get total count for pagination
    const total = await prisma.article.count({ where })

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.content || !body.url || !body.feedId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, url, feedId' },
        { status: 400 }
      )
    }

    // Check if article already exists
    const existingArticle = await prisma.article.findUnique({
      where: { url: body.url }
    })

    if (existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article with this URL already exists' },
        { status: 409 }
      )
    }

    // Create new article in database
    const newArticle = await prisma.article.create({
      data: {
        title: body.title,
        content: body.content,
        summary: body.summary || body.content.substring(0, 300) + '...',
        url: body.url,
        publishedAt: new Date(body.publishedAt || new Date()),
        source: body.source || 'Manual Entry',
        feedId: body.feedId,
        location: body.location || 'NATIONAL',
        discriminationType: body.discriminationType || 'GENERAL_AI',
        severity: body.severity || 'MEDIUM',
        organizations: body.organizations || [],
        keywords: body.keywords || [],
        entities: body.entities || {},
        processed: body.processed || false,
        confidenceScore: body.confidenceScore || null
      },
      include: {
        feed: {
          select: {
            name: true,
            category: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newArticle,
      message: 'Article created successfully'
    })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    )
  }
}