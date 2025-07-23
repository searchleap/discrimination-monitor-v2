import { NextRequest, NextResponse } from 'next/server'
import { aiProcessingQueue } from '@/lib/ai-queue'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const [queueMetrics, queueStatus, recentActivity] = await Promise.all([
      aiProcessingQueue.getQueueMetrics(),
      aiProcessingQueue.getQueueStatus(),
      // Get recent queue processing activity
      prisma.processingLog.findMany({
        where: {
          type: { in: ['AI_CLASSIFICATION', 'QUEUE_PROCESS_BATCH', 'QUEUE_ADD'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          status: true,
          message: true,
          processingTime: true,
          articleId: true,
          createdAt: true,
          details: true
        }
      })
    ])

    // Calculate processing speed (articles per hour)
    const recentClassifications = await prisma.processingLog.count({
      where: {
        type: 'AI_CLASSIFICATION',
        status: 'SUCCESS',
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }
    })

    // Get queue health status
    const queueHealth = getQueueHealth(queueMetrics)
    
    // Calculate estimated completion time
    const estimatedCompletion = calculateEstimatedCompletion(
      queueMetrics.pending,
      recentClassifications || 1,
      queueMetrics.averageProcessingTime || 5000
    )

    return NextResponse.json({
      success: true,
      data: {
        metrics: queueMetrics,
        status: queueStatus,
        processingSpeed: {
          articlesPerHour: recentClassifications,
          averageProcessingTime: queueMetrics.averageProcessingTime,
          successRate: queueMetrics.successRate
        },
        health: queueHealth,
        estimatedCompletion,
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.type,
          status: activity.status,
          message: activity.message,
          processingTime: activity.processingTime,
          articleId: activity.articleId,
          timestamp: activity.createdAt.toISOString(),
          details: activity.details
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching AI queue status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch queue status' 
      },
      { status: 500 }
    )
  }
}

function getQueueHealth(metrics: any): 'healthy' | 'warning' | 'error' {
  // Queue is unhealthy if there are too many pending items or low success rate
  if (metrics.pending > 1000 || metrics.successRate < 0.8) {
    return 'error'
  }
  
  // Queue has warning if there are many pending items or moderate success rate
  if (metrics.pending > 500 || metrics.successRate < 0.9) {
    return 'warning'
  }
  
  return 'healthy'
}

function calculateEstimatedCompletion(
  pendingItems: number,
  articlesPerHour: number,
  avgProcessingTime: number
): string | null {
  if (pendingItems === 0) return null
  
  // Use the better of the two estimates
  const hourlyRate = Math.max(articlesPerHour, 1)
  const hoursRemaining = pendingItems / hourlyRate
  
  if (hoursRemaining < 1) {
    return `${Math.ceil(hoursRemaining * 60)} minutes`
  } else if (hoursRemaining < 24) {
    return `${Math.ceil(hoursRemaining)} hours`
  } else {
    return `${Math.ceil(hoursRemaining / 24)} days`
  }
}