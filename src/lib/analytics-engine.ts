import { prisma } from './prisma'
import { AlertManager } from './alert-manager'

export interface MetricsSnapshot {
  timestamp: Date
  batchSize: number
  processedCount: number
  successCount: number
  errorCount: number
  processingTime: number // milliseconds
  queueDepth: number
  workerStatus: string
  providerId?: string
  throughput?: number // items per minute
  averageLatency?: number // milliseconds
  errorRate?: number // percentage
  memoryUsage?: number // MB
  cpuUsage?: number // percentage
}

export interface PerformanceTrends {
  throughputTrend: TrendData[]
  errorRateTrend: TrendData[]
  latencyTrend: TrendData[]
  queueDepthTrend: TrendData[]
}

export interface TrendData {
  timestamp: Date
  value: number
  movingAverage?: number
}

export interface AlertThresholds {
  queueDepthWarning: number
  queueDepthCritical: number
  errorRateWarning: number // percentage
  errorRateCritical: number // percentage
  latencyWarning: number // milliseconds
  latencyCritical: number // milliseconds
  throughputWarning: number // items per minute
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  score: number // 0-100
  issues: HealthIssue[]
  recommendations: string[]
  lastChecked: Date
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical'
  metric: string
  currentValue: number
  threshold: number
  message: string
}

export interface AnalyticsReport {
  timeRange: { start: Date; end: Date }
  summary: {
    totalProcessed: number
    averageThroughput: number
    overallSuccessRate: number
    peakQueueDepth: number
    averageLatency: number
  }
  trends: PerformanceTrends
  bottlenecks: BottleneckAnalysis[]
  recommendations: string[]
  providerComparison?: ProviderMetrics[]
}

export interface BottleneckAnalysis {
  type: 'queue_depth' | 'processing_time' | 'error_rate' | 'resource_usage'
  severity: 'low' | 'medium' | 'high'
  impact: string
  recommendation: string
  timeWindow: { start: Date; end: Date }
}

export interface ProviderMetrics {
  providerId: string
  providerName: string
  requestCount: number
  successRate: number
  averageLatency: number
  errorCount: number
  estimatedCost: number
}

export class AnalyticsEngine {
  private alertManager: AlertManager
  private static instance: AnalyticsEngine

  constructor() {
    this.alertManager = AlertManager.getInstance()
  }

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine()
    }
    return AnalyticsEngine.instance
  }

  async recordMetrics(snapshot: MetricsSnapshot): Promise<void> {
    try {
      // Calculate derived metrics
      const errorRate = snapshot.processedCount > 0 
        ? (snapshot.errorCount / snapshot.processedCount) * 100 
        : 0

      const throughput = snapshot.processingTime > 0 
        ? (snapshot.processedCount / (snapshot.processingTime / 1000)) * 60 
        : 0

      const averageLatency = snapshot.processedCount > 0 
        ? snapshot.processingTime / snapshot.processedCount 
        : 0

      // Store metrics
      await prisma.processingMetrics.create({
        data: {
          timestamp: snapshot.timestamp,
          batchSize: snapshot.batchSize,
          processedCount: snapshot.processedCount,
          successCount: snapshot.successCount,
          errorCount: snapshot.errorCount,
          processingTime: snapshot.processingTime,
          queueDepth: snapshot.queueDepth,
          workerStatus: snapshot.workerStatus,
          providerId: snapshot.providerId,
          throughput,
          averageLatency,
          errorRate,
          memoryUsage: snapshot.memoryUsage,
          cpuUsage: snapshot.cpuUsage
        }
      })

      // Check for alerts
      await this.checkAlertThresholds(snapshot, { errorRate, throughput, averageLatency })

    } catch (error) {
      console.error('Failed to record metrics:', error)
    }
  }

  async getPerformanceTrends(
    timeRange: { start: Date; end: Date },
    interval: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<PerformanceTrends> {
    try {
      const metrics = await prisma.processingMetrics.findMany({
        where: {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        orderBy: { timestamp: 'asc' }
      })

      // Group metrics by interval
      const groupedMetrics = this.groupMetricsByInterval(metrics, interval)

      return {
        throughputTrend: this.calculateTrend(groupedMetrics, 'throughput'),
        errorRateTrend: this.calculateTrend(groupedMetrics, 'errorRate'),
        latencyTrend: this.calculateTrend(groupedMetrics, 'averageLatency'),
        queueDepthTrend: this.calculateTrend(groupedMetrics, 'queueDepth')
      }
    } catch (error) {
      console.error('Failed to get performance trends:', error)
      throw error
    }
  }

  async generateAnalyticsReport(
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsReport> {
    try {
      const metrics = await prisma.processingMetrics.findMany({
        where: {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        orderBy: { timestamp: 'asc' }
      })

      if (metrics.length === 0) {
        throw new Error('No metrics data available for the specified time range')
      }

      const summary = this.calculateSummary(metrics)
      const trends = await this.getPerformanceTrends(timeRange)
      const bottlenecks = this.analyzeBottlenecks(metrics)
      const recommendations = this.generateRecommendations(metrics, bottlenecks)
      const providerComparison = await this.getProviderMetrics(timeRange)

      return {
        timeRange,
        summary,
        trends,
        bottlenecks,
        recommendations,
        providerComparison
      }
    } catch (error) {
      console.error('Failed to generate analytics report:', error)
      throw error
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Get recent metrics (last 30 minutes)
      const recentMetrics = await prisma.processingMetrics.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 30
      })

      if (recentMetrics.length === 0) {
        return {
          status: 'warning',
          score: 50,
          issues: [{ 
            severity: 'medium', 
            metric: 'data_availability', 
            currentValue: 0, 
            threshold: 1, 
            message: 'No recent metrics data available' 
          }],
          recommendations: ['Check if the monitoring system is running'],
          lastChecked: new Date()
        }
      }

      const issues: HealthIssue[] = []
      let score = 100

      // Check various health metrics
      const latestMetrics = recentMetrics[0]
      const avgErrorRate = recentMetrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / recentMetrics.length
      const avgLatency = recentMetrics.reduce((sum, m) => sum + (m.averageLatency || 0), 0) / recentMetrics.length
      const currentQueueDepth = latestMetrics.queueDepth

      // Queue depth check
      if (currentQueueDepth > 100) {
        issues.push({
          severity: currentQueueDepth > 200 ? 'critical' : 'high',
          metric: 'queue_depth',
          currentValue: currentQueueDepth,
          threshold: 100,
          message: `High queue backlog: ${currentQueueDepth} items`
        })
        score -= currentQueueDepth > 200 ? 30 : 20
      }

      // Error rate check
      if (avgErrorRate > 5) {
        issues.push({
          severity: avgErrorRate > 15 ? 'critical' : 'high',
          metric: 'error_rate',
          currentValue: avgErrorRate,
          threshold: 5,
          message: `High error rate: ${avgErrorRate.toFixed(1)}%`
        })
        score -= avgErrorRate > 15 ? 25 : 15
      }

      // Latency check
      if (avgLatency > 2000) {
        issues.push({
          severity: avgLatency > 5000 ? 'critical' : 'medium',
          metric: 'latency',
          currentValue: avgLatency,
          threshold: 2000,
          message: `High processing latency: ${avgLatency.toFixed(0)}ms`
        })
        score -= avgLatency > 5000 ? 20 : 10
      }

      // Memory usage check
      if (latestMetrics.memoryUsage && latestMetrics.memoryUsage > 80) {
        issues.push({
          severity: latestMetrics.memoryUsage > 95 ? 'critical' : 'high',
          metric: 'memory_usage',
          currentValue: latestMetrics.memoryUsage,
          threshold: 80,
          message: `High memory usage: ${latestMetrics.memoryUsage}%`
        })
        score -= latestMetrics.memoryUsage > 95 ? 25 : 15
      }

      // CPU usage check
      if (latestMetrics.cpuUsage && latestMetrics.cpuUsage > 80) {
        issues.push({
          severity: latestMetrics.cpuUsage > 95 ? 'critical' : 'high',
          metric: 'cpu_usage',
          currentValue: latestMetrics.cpuUsage,
          threshold: 80,
          message: `High CPU usage: ${latestMetrics.cpuUsage}%`
        })
        score -= latestMetrics.cpuUsage > 95 ? 25 : 15
      }

      const status = score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical'
      const recommendations = this.generateHealthRecommendations(issues)

      return {
        status,
        score: Math.max(0, score),
        issues,
        recommendations,
        lastChecked: new Date()
      }
    } catch (error) {
      console.error('Failed to get system health:', error)
      return {
        status: 'critical',
        score: 0,
        issues: [{ 
          severity: 'critical', 
          metric: 'system_error', 
          currentValue: 1, 
          threshold: 0, 
          message: 'System health check failed' 
        }],
        recommendations: ['Check system logs and database connectivity'],
        lastChecked: new Date()
      }
    }
  }

  private async checkAlertThresholds(
    snapshot: MetricsSnapshot, 
    derived: { errorRate: number; throughput: number; averageLatency: number }
  ): Promise<void> {
    // Queue depth alerts
    if (snapshot.queueDepth > 50) {
      await this.alertManager.triggerQueueBacklogAlert(snapshot.queueDepth, 50)
    }

    // Processing failure alerts
    if (derived.errorRate > 10) {
      await this.alertManager.triggerProcessingFailureAlert(
        snapshot.errorCount, 
        snapshot.processedCount
      )
    }

    // System health alerts
    await this.alertManager.triggerSystemHealthAlert({
      memoryUsage: snapshot.memoryUsage,
      cpuUsage: snapshot.cpuUsage,
      errorRate: derived.errorRate,
      responseTime: derived.averageLatency
    })
  }

  private groupMetricsByInterval(
    metrics: any[], 
    interval: 'minute' | 'hour' | 'day'
  ): { [key: string]: any[] } {
    const groups: { [key: string]: any[] } = {}
    
    metrics.forEach(metric => {
      let key: string
      const date = new Date(metric.timestamp)
      
      switch (interval) {
        case 'minute':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`
          break
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
          break
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          break
      }
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(metric)
    })
    
    return groups
  }

  private calculateTrend(groupedMetrics: { [key: string]: any[] }, field: string): TrendData[] {
    return Object.entries(groupedMetrics).map(([key, metrics]) => {
      const values = metrics.map(m => m[field] || 0).filter(v => v !== null)
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      
      // Use the first timestamp from the group as representative
      const timestamp = new Date(metrics[0].timestamp)
      
      return {
        timestamp,
        value: average
      }
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private calculateSummary(metrics: any[]) {
    const totalProcessed = metrics.reduce((sum, m) => sum + m.processedCount, 0)
    const totalTime = metrics.reduce((sum, m) => sum + m.processingTime, 0)
    const totalSuccess = metrics.reduce((sum, m) => sum + m.successCount, 0)
    const maxQueueDepth = Math.max(...metrics.map(m => m.queueDepth))
    
    return {
      totalProcessed,
      averageThroughput: totalTime > 0 ? (totalProcessed / (totalTime / 1000)) * 60 : 0,
      overallSuccessRate: totalProcessed > 0 ? (totalSuccess / totalProcessed) * 100 : 0,
      peakQueueDepth: maxQueueDepth,
      averageLatency: totalProcessed > 0 ? totalTime / totalProcessed : 0
    }
  }

  private analyzeBottlenecks(metrics: any[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = []
    
    // Analyze queue depth spikes
    const avgQueueDepth = metrics.reduce((sum, m) => sum + m.queueDepth, 0) / metrics.length
    const queueSpikes = metrics.filter(m => m.queueDepth > avgQueueDepth * 2)
    
    if (queueSpikes.length > metrics.length * 0.1) {
      bottlenecks.push({
        type: 'queue_depth',
        severity: 'medium',
        impact: `Queue depth spikes in ${queueSpikes.length} measurements`,
        recommendation: 'Consider increasing batch size or worker frequency',
        timeWindow: {
          start: new Date(Math.min(...queueSpikes.map(m => m.timestamp.getTime()))),
          end: new Date(Math.max(...queueSpikes.map(m => m.timestamp.getTime())))
        }
      })
    }
    
    // Analyze error rate patterns
    const highErrorMetrics = metrics.filter(m => (m.errorRate || 0) > 10)
    if (highErrorMetrics.length > 0) {
      bottlenecks.push({
        type: 'error_rate',
        severity: 'high',
        impact: `High error rates in ${highErrorMetrics.length} measurements`,
        recommendation: 'Check AI provider connectivity and implement better error handling',
        timeWindow: {
          start: new Date(Math.min(...highErrorMetrics.map(m => m.timestamp.getTime()))),
          end: new Date(Math.max(...highErrorMetrics.map(m => m.timestamp.getTime())))
        }
      })
    }
    
    return bottlenecks
  }

  private generateRecommendations(metrics: any[], bottlenecks: BottleneckAnalysis[]): string[] {
    const recommendations: string[] = []
    
    // Based on bottlenecks
    bottlenecks.forEach(bottleneck => {
      recommendations.push(bottleneck.recommendation)
    })
    
    // General performance recommendations
    const avgThroughput = metrics.reduce((sum, m) => sum + (m.throughput || 0), 0) / metrics.length
    if (avgThroughput < 5) {
      recommendations.push('Consider optimizing batch processing or increasing worker resources')
    }
    
    const avgErrorRate = metrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / metrics.length
    if (avgErrorRate > 5) {
      recommendations.push('Implement better error handling and retry mechanisms')
    }
    
    return Array.from(new Set(recommendations)) // Remove duplicates
  }

  private async getProviderMetrics(timeRange: { start: Date; end: Date }): Promise<ProviderMetrics[]> {
    try {
      const providers = await prisma.aIProvider.findMany({
        where: { enabled: true }
      })

      return providers.map(provider => ({
        providerId: provider.id,
        providerName: provider.name,
        requestCount: provider.requestCount,
        successRate: provider.successRate * 100,
        averageLatency: provider.averageLatency || 0,
        errorCount: provider.errorCount,
        estimatedCost: provider.estimatedCost
      }))
    } catch (error) {
      console.error('Failed to get provider metrics:', error)
      return []
    }
  }

  private generateHealthRecommendations(issues: HealthIssue[]): string[] {
    const recommendations: string[] = []
    
    issues.forEach(issue => {
      switch (issue.metric) {
        case 'queue_depth':
          recommendations.push('Increase processing frequency or batch size to clear queue backlog')
          break
        case 'error_rate':
          recommendations.push('Check AI provider connectivity and implement better error handling')
          break
        case 'latency':
          recommendations.push('Optimize processing algorithms or consider more powerful hardware')
          break
        case 'memory_usage':
          recommendations.push('Increase available memory or optimize memory usage in processing')
          break
        case 'cpu_usage':
          recommendations.push('Increase CPU resources or optimize processing algorithms')
          break
      }
    })
    
    return Array.from(new Set(recommendations))
  }

  async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
      
      const result = await prisma.processingMetrics.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })
      
      return result.count
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error)
      return 0
    }
  }
}

// Singleton instance
export const analyticsEngine = AnalyticsEngine.getInstance()