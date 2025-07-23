import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for updating filtering configuration
const configSchema = z.object({
  isActive: z.boolean().optional(),
  filterMode: z.enum(['OR', 'AND']).optional(),
  minTermLength: z.number().min(1).max(50).optional(),
  caseSensitive: z.boolean().optional()
})

// GET /api/admin/filtering-config - Get current filtering configuration
export async function GET(request: NextRequest) {
  try {
    const config = await prisma.filteringConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!config) {
      // Return default configuration if none exists
      return NextResponse.json({
        id: null,
        name: 'Default Filtering',
        isActive: false,
        filterMode: 'OR',
        minTermLength: 3,
        caseSensitive: false,
        articlesFiltered: 0,
        articlesAccepted: 0,
        lastApplied: null,
        createdAt: null,
        updatedAt: null
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching filtering configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filtering configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/filtering-config - Update filtering configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const data = configSchema.parse(body)

    // Get or create the default configuration
    let config = await prisma.filteringConfig.findFirst({
      where: { name: 'Default Filtering' }
    })

    if (!config) {
      // Create default configuration
      config = await prisma.filteringConfig.create({
        data: {
          name: 'Default Filtering',
          isActive: false,
          filterMode: 'OR',
          minTermLength: 3,
          caseSensitive: false
        }
      })
    }

    // Update configuration
    const updatedConfig = await prisma.filteringConfig.update({
      where: { id: config.id },
      data
    })

    console.log(`⚙️  Updated filtering configuration: ${JSON.stringify(data)}`)

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Error updating filtering configuration:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update filtering configuration' },
      { status: 500 }
    )
  }
}

// POST /api/admin/filtering-config/reset-stats - Reset filtering statistics
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'reset-stats') {
      const config = await prisma.filteringConfig.findFirst({
        where: { name: 'Default Filtering' }
      })

      if (!config) {
        return NextResponse.json(
          { error: 'Configuration not found' },
          { status: 404 }
        )
      }

      // Reset statistics
      const updatedConfig = await prisma.filteringConfig.update({
        where: { id: config.id },
        data: {
          articlesFiltered: 0,
          articlesAccepted: 0,
          lastApplied: null
        }
      })

      // Also reset match counts for all filters
      await prisma.contentFilter.updateMany({
        data: { matchCount: 0 }
      })

      console.log('📊 Reset filtering statistics')

      return NextResponse.json({
        message: 'Filtering statistics reset successfully',
        config: updatedConfig
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error resetting filtering statistics:', error)
    return NextResponse.json(
      { error: 'Failed to reset statistics' },
      { status: 500 }
    )
  }
}