import { NextRequest, NextResponse } from 'next/server'
import { analyticsEngine } from '@/lib/analytics-engine'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const interval = searchParams.get('interval') as 'minute' | 'hour' | 'day' || 'hour'
    const limit = parseInt(searchParams.get('limit') || '100')

    // Default to last 24 hours if no dates provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 24 * 60 * 60 * 1000)

    // Get raw metrics
    const metrics = await prisma.processingMetrics.findMany({
      where: {
        timestamp: {
          gte: start,
          lte: end
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    // Get performance trends
    const trends = await analyticsEngine.getPerformanceTrends({ start, end }, interval)

    // Calculate summary statistics
    const summary = {
      totalRecords: metrics.length,
      timeRange: { start, end },
      averages: {
        throughput: metrics.reduce((sum, m) => sum + (m.throughput || 0), 0) / metrics.length,
        errorRate: metrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / metrics.length,
        latency: metrics.reduce((sum, m) => sum + (m.averageLatency || 0), 0) / metrics.length,
        queueDepth: metrics.reduce((sum, m) => sum + m.queueDepth, 0) / metrics.length
      },
      totals: {
        processed: metrics.reduce((sum, m) => sum + m.processedCount, 0),
        successful: metrics.reduce((sum, m) => sum + m.successCount, 0),
        errors: metrics.reduce((sum, m) => sum + m.errorCount, 0)
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
      trends,
      summary
    })
  } catch (error) {
    console.error('Failed to get metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get metrics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      batchSize,
      processedCount,
      successCount,
      errorCount,
      processingTime,
      queueDepth,
      workerStatus,
      providerId,
      memoryUsage,
      cpuUsage
    } = body

    // Validate required fields
    if (
      typeof batchSize !== 'number' ||
      typeof processedCount !== 'number' ||
      typeof successCount !== 'number' ||
      typeof errorCount !== 'number' ||
      typeof processingTime !== 'number' ||
      typeof queueDepth !== 'number' ||
      !workerStatus
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required fields' },
        { status: 400 }
      )
    }

    await analyticsEngine.recordMetrics({
      timestamp: new Date(),
      batchSize,
      processedCount,
      successCount,
      errorCount,
      processingTime,
      queueDepth,
      workerStatus,
      providerId,
      memoryUsage,
      cpuUsage
    })

    return NextResponse.json({
      success: true,
      message: 'Metrics recorded successfully'
    })
  } catch (error) {
    console.error('Failed to record metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record metrics' },
      { status: 500 }
    )
  }
}