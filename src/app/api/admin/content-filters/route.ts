import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating/updating content filters
const contentFilterSchema = z.object({
  term: z.string().min(1).max(255),
  isActive: z.boolean().default(true),
  category: z.string().optional(),
  description: z.string().optional(),
  createdBy: z.string().optional()
})

// GET /api/admin/content-filters - List all content filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const where: any = {}
    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'

    const [filters, total] = await Promise.all([
      prisma.contentFilter.findMany({
        where,
        orderBy: [
          { isActive: 'desc' },
          { matchCount: 'desc' },
          { term: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.contentFilter.count({ where })
    ])

    return NextResponse.json({
      filters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching content filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content filters' },
      { status: 500 }
    )
  }
}

// POST /api/admin/content-filters - Create new content filter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = contentFilterSchema.parse(body)

    // Check for duplicate terms
    const existingFilter = await prisma.contentFilter.findFirst({
      where: { term: data.term }
    })

    if (existingFilter) {
      return NextResponse.json(
        { error: 'A filter with this term already exists' },
        { status: 400 }
      )
    }

    const filter = await prisma.contentFilter.create({
      data: {
        ...data,
        matchCount: 0
      }
    })

    console.log(`✅ Created content filter: "${filter.term}" (${filter.id})`)

    return NextResponse.json(filter, { status: 201 })
  } catch (error) {
    console.error('Error creating content filter:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create content filter' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content-filters - Bulk delete content filters
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No filter IDs provided' },
        { status: 400 }
      )
    }

    const result = await prisma.contentFilter.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    console.log(`🗑️  Deleted ${result.count} content filters`)

    return NextResponse.json({
      message: `Successfully deleted ${result.count} content filters`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error deleting content filters:', error)
    return NextResponse.json(
      { error: 'Failed to delete content filters' },
      { status: 500 }
    )
  }
}