import { NextRequest, NextResponse } from 'next/server'
import { alertManager } from '@/lib/alert-manager'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const alerts = await prisma.alertConfig.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { history: true }
        }
      }
    })

    return NextResponse.json({ success: true, alerts })
  } catch (error) {
    console.error('Failed to get alert configs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get alert configurations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      type, 
      severity, 
      threshold, 
      channels, 
      escalationDelay,
      escalationTo 
    } = body

    // Validate required fields
    if (!name || !type || !severity || !threshold || !channels) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate threshold structure
    if (!threshold.metric || !threshold.operator || threshold.value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Invalid threshold configuration' },
        { status: 400 }
      )
    }

    // Validate channels
    if (!Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one notification channel is required' },
        { status: 400 }
      )
    }

    const alertId = await alertManager.createAlert({
      name,
      type,
      severity,
      threshold,
      channels,
      escalationDelay,
      escalationTo
    })

    return NextResponse.json({ 
      success: true, 
      alertId,
      message: 'Alert configuration created successfully'
    })
  } catch (error) {
    console.error('Failed to create alert config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create alert configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const updatedAlert = await prisma.alertConfig.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true, 
      alert: updatedAlert,
      message: 'Alert configuration updated successfully'
    })
  } catch (error) {
    console.error('Failed to update alert config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update alert configuration' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    await prisma.alertConfig.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Alert configuration deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete alert config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete alert configuration' },
      { status: 500 }
    )
  }
}