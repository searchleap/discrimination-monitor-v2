import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })
    
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
    
    // Check if feed exists
    const existingFeed = await prisma.feed.findUnique({
      where: { id: params.id }
    })
    
    if (!existingFeed) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      )
    }

    // Check for URL conflicts if URL is being changed
    if (body.url && body.url !== existingFeed.url) {
      const urlConflict = await prisma.feed.findUnique({
        where: { url: body.url }
      })
      
      if (urlConflict) {
        return NextResponse.json(
          { success: false, error: 'A feed with this URL already exists' },
          { status: 409 }
        )
      }
    }

    // Update feed in database
    const updatedFeed = await prisma.feed.update({
      where: { id: params.id },
      data: {
        name: body.name,
        url: body.url,
        category: body.category,
        isActive: body.isActive,
        priority: body.priority,
        customHeaders: body.customHeaders,
        processingRules: body.processingRules
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
      data: updatedFeed,
      message: 'Feed updated successfully'
    })
  } catch (error) {
    console.error('Error updating feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update feed' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const body = await request.json()
    
    // Check if feed exists
    const existingFeed = await prisma.feed.findUnique({
      where: { id: params.id }
    })
    
    if (!existingFeed) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      )
    }

    // Update only provided fields
    const updatedFeed = await prisma.feed.update({
      where: { id: params.id },
      data: body,
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
      data: updatedFeed,
      message: 'Feed updated successfully'
    })
  } catch (error) {
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
    // Check if feed exists
    const existingFeed = await prisma.feed.findUnique({
      where: { id: params.id }
    })
    
    if (!existingFeed) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      )
    }

    // Delete feed from database (cascade will delete related articles)
    await prisma.feed.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Feed deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete feed' },
      { status: 500 }
    )
  }
}