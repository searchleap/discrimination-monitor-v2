'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  Activity, 
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Users,
  Database
} from 'lucide-react'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  score: number
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    metric: string
    currentValue: number
    threshold: number
    message: string
  }>
  recommendations: string[]
  lastChecked: Date
}

interface AlertHistory {
  id: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
  triggeredAt: string
  alertConfig: {
    name: string
    type: string
  }
}

interface PerformanceMetrics {
  throughputTrend: Array<{ timestamp: Date; value: number }>
  errorRateTrend: Array<{ timestamp: Date; value: number }>
  latencyTrend: Array<{ timestamp: Date; value: number }>
  queueDepthTrend: Array<{ timestamp: Date; value: number }>
}

export default function AdvancedMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [alerts, setAlerts] = useState<AlertHistory[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [alertConfigs, setAlertConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch system health
      const healthResponse = await fetch('/api/analytics/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setHealth(healthData.health)
      }

      // Fetch alert history
      const alertsResponse = await fetch('/api/alerts/history?limit=20')
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.history)
      }

      // Fetch performance metrics (last 24 hours)
      const end = new Date()
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      const metricsResponse = await fetch(
        `/api/analytics/metrics?start=${start.toISOString()}&end=${end.toISOString()}&interval=hour`
      )
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.trends)
      }

      // Fetch alert configurations
      const configResponse = await fetch('/api/alerts/config')
      if (configResponse.ok) {
        const configData = await configResponse.json()
        setAlertConfigs(configData.alerts)
      }

    } catch (error) {
      console.error('Failed to fetch advanced monitoring data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge',
          historyId: alertId,
          acknowledgedBy: 'Admin User'
        })
      })

      if (response.ok) {
        await fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const testAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
      }
    } catch (error) {
      console.error('Failed to test alert:', error)
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading advanced monitoring data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Monitoring</h2>
          <p className="text-muted-foreground">
            System health, performance analytics, and alerting dashboard
          </p>
        </div>
        <Button 
          onClick={fetchData} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <Activity className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getHealthIcon(health.status)}
              System Health Score: {health.score}/100
            </CardTitle>
            <CardDescription>
              Last checked: {new Date(health.lastChecked).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {health.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Active Issues</h4>
                  <div className="space-y-2">
                    {health.issues.map((issue, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <Badge variant={getSeverityColor(issue.severity.toUpperCase())}>
                            {issue.severity}
                          </Badge>
                          <span className="ml-2">{issue.message}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {issue.currentValue} / {issue.threshold}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {health.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {health.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                Latest system alerts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No recent alerts
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-medium">{alert.alertConfig.name}</span>
                          <Badge variant="outline">{alert.alertConfig.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </span>
                          <Badge 
                            variant={alert.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                          >
                            {alert.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Throughput</h4>
                      <p className="text-sm text-muted-foreground">
                        {metrics.throughputTrend.length} data points
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Error Rate</h4>
                      <p className="text-sm text-muted-foreground">
                        {metrics.errorRateTrend.length} data points
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Queue Depth</h4>
                      <p className="text-sm text-muted-foreground">
                        {metrics.queueDepthTrend.length} data points
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No metrics data available
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>Current utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Memory Usage</span>
                    <Badge variant="outline">
                      {health?.issues?.find(i => i.metric === 'memory_usage')?.currentValue || 'N/A'}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>CPU Usage</span>
                    <Badge variant="outline">
                      {health?.issues?.find(i => i.metric === 'cpu_usage')?.currentValue || 'N/A'}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Queue Depth</span>
                    <Badge variant="outline">
                      {health?.issues?.find(i => i.metric === 'queue_depth')?.currentValue || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Providers</CardTitle>
              <CardDescription>
                Multi-provider configuration and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Provider management coming in Phase 3C
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configurations</CardTitle>
              <CardDescription>
                Manage alert rules and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertConfigs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No alert configurations found
                </p>
              ) : (
                <div className="space-y-3">
                  {alertConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{config.type}</Badge>
                          <Badge variant={getSeverityColor(config.severity)}>
                            {config.severity}
                          </Badge>
                          <Badge variant={config.enabled ? 'default' : 'secondary'}>
                            {config.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testAlert(config.id)}
                        >
                          Test
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}