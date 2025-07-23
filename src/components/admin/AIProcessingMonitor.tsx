'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Pause, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Activity,
  ListTodo,
  BarChart3
} from 'lucide-react'

interface QueueMetrics {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
  oldestPending?: string
  averageProcessingTime: number
  successRate: number
}

interface ProcessingSpeed {
  articlesPerHour: number
  averageProcessingTime: number
  successRate: number
}

interface QueueStatus {
  isProcessing: boolean
  lastProcessed?: string
  nextScheduled?: string
  workerStatus: 'running' | 'stopped' | 'error'
}

interface WorkerStatus {
  isRunning: boolean
  isProcessing: boolean
  startedAt?: string
  lastProcessedAt?: string
  processedCount: number
  errorCount: number
  currentBatch?: string[]
  nextScheduledAt?: string
  health: 'healthy' | 'warning' | 'error'
  uptime?: number
}

interface WorkerMetrics {
  totalProcessed: number
  totalErrors: number
  averageProcessingTime: number
  batchesCompleted: number
  lastHourThroughput: number
  successRate: number
  uptime: number
}

interface WorkerData {
  status: WorkerStatus
  metrics: WorkerMetrics
  timestamp: string
}

interface AIProcessingData {
  metrics: QueueMetrics
  status: QueueStatus
  processingSpeed: ProcessingSpeed
  health: 'healthy' | 'warning' | 'error'
  estimatedCompletion?: string | null
  recentActivity: Array<{
    id: string
    type: string
    status: string
    message: string
    processingTime?: number
    timestamp: string
  }>
}

interface BulkAddData {
  availableForQueue: number
  currentQueueMetrics: QueueMetrics
  feedBreakdown: Array<{
    feedId: string
    feedName: string
    count: number
  }>
  canBulkAdd: boolean
  recommendations: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    batchSize: number
    estimatedTime: string
  }
}

export function AIProcessingMonitor() {
  const [data, setData] = useState<AIProcessingData | null>(null)
  const [bulkAddData, setBulkAddData] = useState<BulkAddData | null>(null)
  const [workerData, setWorkerData] = useState<WorkerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [bulkAdding, setBulkAdding] = useState(false)
  const [workerOperating, setWorkerOperating] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch AI processing status
  const fetchData = async () => {
    try {
      const [statusResponse, bulkResponse, workerResponse] = await Promise.all([
        fetch('/api/ai-queue/status'),
        fetch('/api/ai-queue/bulk-add'),
        fetch('/api/background/ai-worker/status')
      ])

      if (!statusResponse.ok || !bulkResponse.ok || !workerResponse.ok) {
        throw new Error('Failed to fetch AI processing data')
      }

      const statusData = await statusResponse.json()
      const bulkData = await bulkResponse.json()
      const workerDataResult = await workerResponse.json()

      if (statusData.success) {
        setData(statusData.data)
      }
      
      if (bulkData.success) {
        setBulkAddData(bulkData.data)
      }

      if (workerDataResult.success) {
        setWorkerData(workerDataResult.data)
      }
      
      setError(null)
    } catch (error) {

      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Process queue
  const handleProcessQueue = async (batchSize = 5, maxBatches = 1) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/ai-queue/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize, maxBatches })
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // Refresh data

      } else {
        setError(result.error || 'Processing failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  // Retry failed items
  const handleRetryFailed = async () => {
    setRetrying(true)
    try {
      const response = await fetch('/api/ai-queue/retry', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData()

      } else {
        setError(result.error || 'Retry failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Retry failed')
    } finally {
      setRetrying(false)
    }
  }

  // Bulk add articles to queue
  const handleBulkAdd = async (priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM') => {
    setBulkAdding(true)
    try {
      const response = await fetch('/api/ai-queue/bulk-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData()

      } else {
        setError(result.error || 'Bulk add failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bulk add failed')
    } finally {
      setBulkAdding(false)
    }
  }

  // Start background worker
  const handleStartWorker = async () => {
    setWorkerOperating(true)
    try {
      const response = await fetch('/api/background/ai-worker/start', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData()

      } else {
        setError(result.error || 'Failed to start worker')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start worker')
    } finally {
      setWorkerOperating(false)
    }
  }

  // Stop background worker
  const handleStopWorker = async () => {
    setWorkerOperating(true)
    try {
      const response = await fetch('/api/background/ai-worker/stop', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData()

      } else {
        setError(result.error || 'Failed to stop worker')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to stop worker')
    } finally {
      setWorkerOperating(false)
    }
  }

  // Restart background worker
  const handleRestartWorker = async () => {
    setWorkerOperating(true)
    try {
      const response = await fetch('/api/background/ai-worker/restart', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData()

      } else {
        setError(result.error || 'Failed to restart worker')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to restart worker')
    } finally {
      setWorkerOperating(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS': case 'COMPLETED': return 'default'
      case 'ERROR': case 'FAILED': return 'destructive'
      case 'WARNING': case 'PROCESSING': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading AI processing status...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load AI processing data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Processing Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of AI classification queue and processing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Background Worker</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${workerData?.status.isRunning ? 'text-green-600' : 'text-red-600'}`}>
              {workerData?.status.isRunning ? 'Running' : 'Stopped'}
            </div>
            <p className="text-xs text-muted-foreground">
              {workerData?.status.health && `Health: ${workerData.status.health}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(data.health)}`}>
              {data.health.charAt(0).toUpperCase() + data.health.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.status.workerStatus === 'running' ? 'Queue active' : 'Queue idle'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Articles</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.estimatedCompletion && `Est. completion: ${data.estimatedCompletion}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workerData?.metrics.lastHourThroughput || data.processingSpeed.articlesPerHour}
            </div>
            <p className="text-xs text-muted-foreground">
              {workerData ? 'last hour' : 'articles/hour'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.metrics.successRate * 100)}%
            </div>
            <Progress value={data.metrics.successRate * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">Queue Status</TabsTrigger>
          <TabsTrigger value="worker">Background Worker</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Queue Metrics</CardTitle>
                <CardDescription>Current status of AI processing queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{data.metrics.pending}</div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{data.metrics.processing}</div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{data.metrics.completed}</div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{data.metrics.failed}</div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-medium">{data.metrics.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Processing Time:</span>
                      <span className="font-medium">{Math.round(data.metrics.averageProcessingTime / 1000)}s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Processing speed and efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>{Math.round(data.metrics.successRate * 100)}%</span>
                    </div>
                    <Progress value={data.metrics.successRate * 100} />
                  </div>
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Articles/Hour:</span>
                      <span className="font-medium">{data.processingSpeed.articlesPerHour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Time:</span>
                      <span className="font-medium">{Math.round(data.processingSpeed.averageProcessingTime / 1000)}s</span>
                    </div>
                    {data.status.lastProcessed && (
                      <div className="flex justify-between">
                        <span>Last Processed:</span>
                        <span className="font-medium">
                          {new Date(data.status.lastProcessed).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Details</CardTitle>
              <CardDescription>Detailed breakdown of queue status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.metrics.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{data.metrics.processing}</div>
                    <div className="text-sm text-muted-foreground">Processing</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data.metrics.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{data.metrics.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>

                {data.metrics.oldestPending && (
                  <div className="pt-4 border-t">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Oldest Pending:</span>
                        <span className="font-medium">
                          {new Date(data.metrics.oldestPending).toLocaleString()}
                        </span>
                      </div>
                      {data.estimatedCompletion && (
                        <div className="flex justify-between">
                          <span>Estimated Completion:</span>
                          <span className="font-medium">{data.estimatedCompletion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worker" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Worker Status</CardTitle>
                <CardDescription>Background worker current status and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workerData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className={`text-2xl font-bold ${workerData.status.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                          {workerData.status.isRunning ? 'Running' : 'Stopped'}
                        </div>
                        <p className="text-sm text-muted-foreground">Status</p>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getHealthColor(workerData.status.health)}`}>
                          {workerData.status.health.charAt(0).toUpperCase() + workerData.status.health.slice(1)}
                        </div>
                        <p className="text-sm text-muted-foreground">Health</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Processed Count:</span>
                        <span className="font-medium">{workerData.status.processedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Count:</span>
                        <span className="font-medium">{workerData.status.errorCount}</span>
                      </div>
                      {workerData.status.uptime && (
                        <div className="flex justify-between">
                          <span>Uptime:</span>
                          <span className="font-medium">
                            {Math.round(workerData.status.uptime / 1000 / 60)} minutes
                          </span>
                        </div>
                      )}
                      {workerData.status.lastProcessedAt && (
                        <div className="flex justify-between">
                          <span>Last Processed:</span>
                          <span className="font-medium">
                            {new Date(workerData.status.lastProcessedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      {workerData.status.nextScheduledAt && (
                        <div className="flex justify-between">
                          <span>Next Scheduled:</span>
                          <span className="font-medium">
                            {new Date(workerData.status.nextScheduledAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Worker data not available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Worker Performance</CardTitle>
                <CardDescription>Processing metrics and efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workerData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{workerData.metrics.totalProcessed}</div>
                        <p className="text-sm text-muted-foreground">Total Processed</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{workerData.metrics.lastHourThroughput}</div>
                        <p className="text-sm text-muted-foreground">Last Hour</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Success Rate</span>
                          <span>{Math.round(workerData.metrics.successRate * 100)}%</span>
                        </div>
                        <Progress value={workerData.metrics.successRate * 100} />
                      </div>
                      
                      <div className="pt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Batches Completed:</span>
                          <span className="font-medium">{workerData.metrics.batchesCompleted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Processing Time:</span>
                          <span className="font-medium">
                            {Math.round(workerData.metrics.averageProcessingTime / 1000)}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Errors:</span>
                          <span className="font-medium">{workerData.metrics.totalErrors}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Performance metrics not available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Worker Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Worker Controls</CardTitle>
              <CardDescription>Start, stop, and manage the background worker</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleStartWorker}
                  disabled={workerOperating || (workerData?.status.isRunning ?? false)}
                  className="flex items-center space-x-2"
                >
                  {workerOperating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>Start Worker</span>
                </Button>

                <Button 
                  onClick={handleStopWorker}
                  disabled={workerOperating || !(workerData?.status.isRunning ?? false)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {workerOperating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  <span>Stop Worker</span>
                </Button>

                <Button 
                  onClick={handleRestartWorker}
                  disabled={workerOperating}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  {workerOperating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>Restart Worker</span>
                </Button>
              </div>

              {workerData?.status.isRunning && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Background worker is running
                      </p>
                      <p className="text-xs text-green-600">
                        Automatically processing queue every {Math.round((30000) / 1000)} seconds
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!workerData?.status.isRunning && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Background worker is stopped
                      </p>
                      <p className="text-xs text-yellow-600">
                        Queue processing requires manual triggers or worker restart
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest AI processing operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(activity.status)}>
                          {activity.status}
                        </Badge>
                        <span className="text-sm font-medium">{activity.type}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.message}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                      {activity.processingTime && (
                        <span className="ml-2">({Math.round(activity.processingTime / 1000)}s)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Queue Processing</CardTitle>
                <CardDescription>Manual processing controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleProcessQueue(5, 1)}
                    disabled={processing || data.metrics.pending === 0}
                    className="w-full"
                  >
                    {processing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Process Next Batch (5 items)
                  </Button>
                  
                  <Button 
                    onClick={() => handleProcessQueue(10, 2)}
                    disabled={processing || data.metrics.pending === 0}
                    variant="outline"
                    className="w-full"
                  >
                    Process Large Batch (20 items)
                  </Button>

                  {data.metrics.failed > 0 && (
                    <Button 
                      onClick={handleRetryFailed}
                      disabled={retrying}
                      variant="secondary"
                      className="w-full"
                    >
                      {retrying ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Retry Failed Items ({data.metrics.failed})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk Operations</CardTitle>
                <CardDescription>Add unprocessed articles to queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bulkAddData && (
                  <div className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Available for Queue:</span>
                        <span className="font-medium">{bulkAddData.availableForQueue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recommended Priority:</span>
                        <span className="font-medium">{bulkAddData.recommendations.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Time:</span>
                        <span className="font-medium">{bulkAddData.recommendations.estimatedTime}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleBulkAdd(bulkAddData.recommendations.priority)}
                      disabled={bulkAdding || !bulkAddData.canBulkAdd}
                      className="w-full"
                    >
                      {bulkAdding ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ListTodo className="h-4 w-4 mr-2" />
                      )}
                      Add All to Queue ({bulkAddData.availableForQueue})
                    </Button>

                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAdd('HIGH')}
                        disabled={bulkAdding || !bulkAddData.canBulkAdd}
                      >
                        High Priority
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAdd('MEDIUM')}
                        disabled={bulkAdding || !bulkAddData.canBulkAdd}
                      >
                        Medium
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAdd('LOW')}
                        disabled={bulkAdding || !bulkAddData.canBulkAdd}
                      >
                        Low
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}