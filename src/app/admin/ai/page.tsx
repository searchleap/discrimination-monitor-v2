'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Bot, CheckCircle, Clock, Loader2, RefreshCw, XCircle, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AIStatus {
  service: {
    health: 'healthy' | 'degraded' | 'down'
    providers: {
      openai: { configured: boolean; status: string }
      anthropic: { configured: boolean; status: string }
    }
    fallbackMode: boolean
  }
  statistics: {
    totalArticles: number
    classifiedArticles: number
    classificationCoverage: number
    avgProcessingTime: number
    successRate: number
    confidenceDistribution: {
      high: number
      medium: number
      low: number
      very_low: number
    }
  }
  processing: {
    last24Hours: {
      successful: number
      failed: number
      total: number
    }
    recentActivity: Array<{
      status: string
      message: string
      processingTime: number
      createdAt: string
    }>
  }
}

interface BatchStatus {
  summary: {
    totalArticles: number
    classifiedArticles: number
    unclassifiedArticles: number
    lowConfidenceArticles: number
    needsClassification: number
    classificationCoverage: number
  }
  recommendations: {
    suggestedBatchSize: number
    estimatedProcessingTime: number
    shouldProcess: boolean
  }
}

export default function AIManagementPage() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [testRunning, setTestRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ processed: number; total: number } | null>(null)

  useEffect(() => {
    fetchStatus()
    fetchBatchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai/status')
      const data = await response.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch AI status:', error)
    }
  }

  const fetchBatchStatus = async () => {
    try {
      const response = await fetch('/api/ai/batch-classify')
      const data = await response.json()
      if (data.success) {
        setBatchStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch batch status:', error)
    } finally {
      setLoading(false)
    }
  }

  const runServiceTest = async () => {
    setTestRunning(true)
    try {
      const response = await fetch('/api/ai/status', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ AI Service Test Passed!\n\nProvider: ${data.data.provider}\nProcessing Time: ${data.data.processingTime}ms\nClassification: ${data.data.testResult.discriminationType}/${data.data.testResult.severity}\nConfidence: ${Math.round(data.data.testResult.confidenceScore * 100)}%`)
      } else {
        alert(`❌ AI Service Test Failed!\n\nError: ${data.error}\n\n${data.suggestion || ''}`)
      }
      
      await fetchStatus()
    } catch (error) {
      alert(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTestRunning(false)
    }
  }

  const runBatchClassification = async () => {
    if (!batchStatus?.recommendations.shouldProcess) {
      alert('No articles need classification at this time.')
      return
    }

    const confirmed = confirm(
      `This will classify ${batchStatus.summary.needsClassification} articles.\n` +
      `Estimated time: ${Math.round(batchStatus.recommendations.estimatedProcessingTime / 1000)} seconds.\n\n` +
      `Continue?`
    )

    if (!confirmed) return

    setProcessing(true)
    setBatchProgress({ processed: 0, total: batchStatus.summary.needsClassification })

    try {
      const response = await fetch('/api/ai/batch-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSize: Math.min(batchStatus.recommendations.suggestedBatchSize, 10),
          minConfidence: 0.7
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(
          `✅ Batch Classification Complete!\n\n` +
          `Processed: ${data.data.processed} articles\n` +
          `Successful: ${data.data.successful}\n` +
          `Failed: ${data.data.failed}\n` +
          `Success Rate: ${Math.round(data.data.successRate * 100)}%\n` +
          `Processing Time: ${Math.round(data.data.processingTime / 1000)}s`
        )
        
        await fetchStatus()
        await fetchBatchStatus()
      } else {
        alert(`❌ Batch classification failed: ${data.error}`)
      }
    } catch (error) {
      alert(`❌ Batch classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setProcessing(false)
      setBatchProgress(null)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'degraded': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'down': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading AI management dashboard...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Management Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage AI-powered article classification services
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Service Overview</TabsTrigger>
          <TabsTrigger value="batch">Batch Processing</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Service Health Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Service Health
                  </CardTitle>
                  <CardDescription>AI classification service status and configuration</CardDescription>
                </div>
                <Button onClick={() => fetchStatus()} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {status && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getHealthIcon(status.service.health)}
                      <span className={`font-medium ${getHealthColor(status.service.health)}`}>
                        {status.service.health.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={runServiceTest} disabled={testRunning} size="sm">
                        {testRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Test Service
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Provider Configuration</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>OpenAI</span>
                          <Badge variant={status.service.providers.openai.configured ? 'default' : 'secondary'}>
                            {status.service.providers.openai.configured ? 'Configured' : 'Not Configured'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Anthropic</span>
                          <Badge variant={status.service.providers.anthropic.configured ? 'default' : 'secondary'}>
                            {status.service.providers.anthropic.configured ? 'Configured' : 'Not Configured'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Processing Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Success Rate (24h)</span>
                          <span className="font-mono">{Math.round(status.statistics.successRate * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Processing Time</span>
                          <span className="font-mono">{status.statistics.avgProcessingTime}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {status.service.fallbackMode && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        AI service is running in fallback mode. Configure API keys for improved classification accuracy.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classification Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Classification Coverage</CardTitle>
              <CardDescription>Overview of article classification status</CardDescription>
            </CardHeader>
            <CardContent>
              {status && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Coverage</span>
                    <span className="font-mono">
                      {status.statistics.classifiedArticles}/{status.statistics.totalArticles} 
                      ({Math.round(status.statistics.classificationCoverage * 100)}%)
                    </span>
                  </div>
                  <Progress value={status.statistics.classificationCoverage * 100} className="w-full" />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {status.statistics.confidenceDistribution.high}
                      </div>
                      <div className="text-sm text-muted-foreground">High Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {status.statistics.confidenceDistribution.medium}
                      </div>
                      <div className="text-sm text-muted-foreground">Medium Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {status.statistics.confidenceDistribution.low}
                      </div>
                      <div className="text-sm text-muted-foreground">Low Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {status.statistics.confidenceDistribution.very_low}
                      </div>
                      <div className="text-sm text-muted-foreground">Very Low</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Classification</CardTitle>
              <CardDescription>Process multiple articles for AI classification</CardDescription>
            </CardHeader>
            <CardContent>
              {batchStatus && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{batchStatus.summary.needsClassification}</div>
                      <div className="text-sm text-muted-foreground">Need Classification</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{batchStatus.summary.unclassifiedArticles}</div>
                      <div className="text-sm text-muted-foreground">Unclassified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{batchStatus.summary.lowConfidenceArticles}</div>
                      <div className="text-sm text-muted-foreground">Low Confidence</div>
                    </div>
                  </div>

                  {batchProgress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing articles...</span>
                        <span>{batchProgress.processed}/{batchProgress.total}</span>
                      </div>
                      <Progress value={(batchProgress.processed / batchProgress.total) * 100} />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={runBatchClassification}
                      disabled={processing || !batchStatus.recommendations.shouldProcess}
                      className="flex-1"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 mr-2" />
                          Classify {batchStatus.summary.needsClassification} Articles
                        </>
                      )}
                    </Button>
                    <Button onClick={fetchBatchStatus} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Status
                    </Button>
                  </div>

                  {batchStatus.recommendations.estimatedProcessingTime > 0 && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Estimated processing time: {Math.round(batchStatus.recommendations.estimatedProcessingTime / 1000)} seconds
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>AI classification processing logs and events</CardDescription>
            </CardHeader>
            <CardContent>
              {status?.processing.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent AI processing activity
                </div>
              ) : (
                <div className="space-y-2">
                  {status?.processing.recentActivity.map((log, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">{log.message}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                        {log.processingTime && ` • ${log.processingTime}ms`}
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