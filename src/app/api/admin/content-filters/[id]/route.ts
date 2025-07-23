import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for updating content filters
const updateFilterSchema = z.object({
  term: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
  category: z.string().optional(),
  description: z.string().optional()
})

// GET /api/admin/content-filters/[id] - Get specific content filter
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const filter = await prisma.contentFilter.findUnique({
      where: { id: params.id }
    })

    if (!filter) {
      return NextResponse.json(
        { error: 'Content filter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(filter)
  } catch (error) {
    console.error('Error fetching content filter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content filter' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/content-filters/[id] - Update content filter
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const body = await request.json()
    const data = updateFilterSchema.parse(body)

    // Check if filter exists
    const existingFilter = await prisma.contentFilter.findUnique({
      where: { id: params.id }
    })

    if (!existingFilter) {
      return NextResponse.json(
        { error: 'Content filter not found' },
        { status: 404 }
      )
    }

    // If updating term, check for duplicates
    if (data.term && data.term !== existingFilter.term) {
      const duplicateFilter = await prisma.contentFilter.findFirst({
        where: { 
          term: data.term,
          id: { not: params.id }
        }
      })

      if (duplicateFilter) {
        return NextResponse.json(
          { error: 'A filter with this term already exists' },
          { status: 400 }
        )
      }
    }

    const updatedFilter = await prisma.contentFilter.update({
      where: { id: params.id },
      data
    })

    console.log(`✏️  Updated content filter: "${updatedFilter.term}" (${updatedFilter.id})`)

    return NextResponse.json(updatedFilter)
  } catch (error) {
    console.error('Error updating content filter:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update content filter' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content-filters/[id] - Delete content filter
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const filter = await prisma.contentFilter.findUnique({
      where: { id: params.id }
    })

    if (!filter) {
      return NextResponse.json(
        { error: 'Content filter not found' },
        { status: 404 }
      )
    }

    await prisma.contentFilter.delete({
      where: { id: params.id }
    })

    console.log(`🗑️  Deleted content filter: "${filter.term}" (${filter.id})`)

    return NextResponse.json({
      message: 'Content filter deleted successfully',
      deletedFilter: filter
    })
  } catch (error) {
    console.error('Error deleting content filter:', error)
    return NextResponse.json(
      { error: 'Failed to delete content filter' },
      { status: 500 }
    )
  }
}