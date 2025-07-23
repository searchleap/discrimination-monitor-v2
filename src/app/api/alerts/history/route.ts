import { NextRequest, NextResponse } from 'next/server'
import { alertManager } from '@/lib/alert-manager'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')

    const where: any = {}
    if (status) where.status = status
    if (severity) where.severity = severity
    if (type) {
      where.alertConfig = {
        type: type
      }
    }

    const history = await prisma.alertHistory.findMany({
      where,
      take: limit,
      orderBy: { triggeredAt: 'desc' },
      include: {
        alertConfig: {
          select: { 
            name: true, 
            type: true,
            severity: true
          }
        }
      }
    })

    // Get summary statistics
    const stats = await prisma.alertHistory.groupBy({
      by: ['status', 'severity'],
      _count: { id: true },
      where: {
        triggeredAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      history,
      stats: stats.reduce((acc, stat) => {
        const key = `${stat.status}_${stat.severity}`
        acc[key] = stat._count.id
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Failed to get alert history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get alert history' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let action = 'unknown'
  try {
    const body = await request.json()
    action = body.action
    const { historyId, acknowledgedBy } = body

    if (!action || !historyId) {
      return NextResponse.json(
        { success: false, error: 'Action and history ID are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'acknowledge':
        if (!acknowledgedBy) {
          return NextResponse.json(
            { success: false, error: 'acknowledgedBy is required for acknowledge action' },
            { status: 400 }
          )
        }
        await alertManager.acknowledgeAlert(historyId, acknowledgedBy)
        break

      case 'resolve':
        await alertManager.resolveAlert(historyId)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true,
      message: `Alert ${action}d successfully`
    })
  } catch (error) {
    console.error(`Failed to ${action} alert:`, error)
    return NextResponse.json(
      { success: false, error: `Failed to ${action} alert` },
      { status: 500 }
    )
  }
}