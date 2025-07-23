import { NextRequest, NextResponse } from 'next/server'
import { analyticsEngine } from '@/lib/analytics-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const type = searchParams.get('type') || 'comprehensive'

    // Default to last 7 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)

    let report

    switch (type) {
      case 'comprehensive':
        report = await analyticsEngine.generateAnalyticsReport({ start, end })
        break
      
      case 'performance':
        report = {
          timeRange: { start, end },
          trends: await analyticsEngine.getPerformanceTrends({ start, end })
        }
        break
      
      case 'health':
        report = {
          timeRange: { start, end },
          health: await analyticsEngine.getSystemHealth()
        }
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      report,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate analytics report' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type = 'comprehensive', 
      timeRange, 
      customFilters,
      format = 'json'
    } = body

    if (!timeRange || !timeRange.start || !timeRange.end) {
      return NextResponse.json(
        { success: false, error: 'Time range is required' },
        { status: 400 }
      )
    }

    const start = new Date(timeRange.start)
    const end = new Date(timeRange.end)

    const report = await analyticsEngine.generateAnalyticsReport({ start, end })

    if (format === 'csv') {
      // Convert to CSV format for download
      const csvData = convertReportToCSV(report)
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      report,
      generatedAt: new Date().toISOString(),
      requestedFormat: format
    })
  } catch (error) {
    console.error('Failed to generate custom report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate custom analytics report' },
      { status: 500 }
    )
  }
}

function convertReportToCSV(report: any): string {
  const headers = [
    'Timestamp',
    'Total Processed',
    'Success Rate',
    'Error Rate',
    'Average Throughput',
    'Average Latency',
    'Peak Queue Depth'
  ]

  const rows = [
    headers.join(','),
    [
      new Date().toISOString(),
      report.summary.totalProcessed,
      report.summary.overallSuccessRate.toFixed(2) + '%',
      ((1 - report.summary.overallSuccessRate / 100) * 100).toFixed(2) + '%',
      report.summary.averageThroughput.toFixed(2),
      report.summary.averageLatency.toFixed(2),
      report.summary.peakQueueDepth
    ].join(',')
  ]

  // Add trend data if available
  if (report.trends && report.trends.throughputTrend) {
    rows.push('', 'Throughput Trends:')
    rows.push('Timestamp,Throughput')
    
    report.trends.throughputTrend.forEach((point: any) => {
      rows.push(`${point.timestamp},${point.value}`)
    })
  }

  return rows.join('\n')
}