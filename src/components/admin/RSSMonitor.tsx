'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  ExternalLink,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface RSSStatus {
  stats: {
    totalFeeds: number
    activeFeeds: number  
    neverFetchedCount: number
    errorFeedsCount: number
    lastProcessingTime: string | null
    avgSuccessRate: number
  }
  neverFetchedFeeds: Array<{
    id: string
    name: string
    url: string
    category: string
    status: string
    errorMessage: string | null
    createdAt: string
  }>
  errorFeeds: Array<{
    id: string
    name: string
    url: string
    category: string
    status: string
    errorMessage: string | null
    lastFetched: string | null
  }>
  recentLogs: Array<{
    id: string
    type: string
    status: string
    message: string
    processingTime: number | null
    feedId: string | null
    createdAt: string
  }>
  feedStatus: Array<{
    id: string
    name: string
    url: string
    category: string
    status: string
    lastFetched: string | null
    errorMessage: string | null
    successRate: number
    articlesThisWeek: number
    needsAttention: boolean
  }>
}

interface ProcessingResult {
  success: boolean
  summary: {
    totalFeeds: number
    successfulFeeds: number
    failedFeeds: number
    totalNewArticles: number
    totalProcessed: number
    totalErrors: number
    processingTime: number
  }
  results: Record<string, any>
  processedFeeds: string[]
}

export function RSSMonitor() {
  const [status, setStatus] = useState<RSSStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [lastProcessingResult, setLastProcessingResult] = useState<ProcessingResult | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/rss-status')
      const data = await response.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  const startProcessing = async (feedIds?: string[]) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/process/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feedIds,
          maxFeeds: feedIds ? feedIds.length : 5 // Process more feeds when specific ones are selected
        })
      })
      const result = await response.json()
      setLastProcessingResult(result)
      
      // Refresh status after processing
      setTimeout(fetchStatus, 1000)
    } catch (error) {

    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'disabled': return 'text-gray-400'
      case 'maintenance': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading RSS status...
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8 text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Failed to load RSS status
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">RSS Feed Monitor</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => startProcessing()} 
            disabled={processing}
            className="bg-primary hover:bg-primary/90"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {processing ? 'Processing...' : 'Process All Feeds'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Feeds</p>
                <p className="text-2xl font-bold">{status.stats.totalFeeds}</p>
                <p className="text-xs text-gray-500">{status.stats.activeFeeds} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Never Fetched</p>
                <p className="text-2xl font-bold text-yellow-600">{status.stats.neverFetchedCount}</p>
                <p className="text-xs text-gray-500">Needs attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Error Feeds</p>
                <p className="text-2xl font-bold text-red-600">{status.stats.errorFeedsCount}</p>
                <p className="text-xs text-gray-500">Failed recently</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(status.stats.avgSuccessRate * 100)}%
                </p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Processing Result */}
      {lastProcessingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Last Processing Result</span>
              <Badge variant={lastProcessingResult.success ? "default" : "destructive"}>
                {lastProcessingResult.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Feeds Processed</p>
                <p className="font-semibold">{lastProcessingResult.summary.totalFeeds}</p>
              </div>
              <div>
                <p className="text-gray-600">New Articles</p>
                <p className="font-semibold text-green-600">{lastProcessingResult.summary.totalNewArticles}</p>
              </div>
              <div>
                <p className="text-gray-600">Success Rate</p>
                <p className="font-semibold">
                  {Math.round((lastProcessingResult.summary.successfulFeeds / lastProcessingResult.summary.totalFeeds) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">Processing Time</p>
                <p className="font-semibold">{Math.round(lastProcessingResult.summary.processingTime / 1000)}s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Never Fetched Feeds */}
      {status.neverFetchedFeeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Feeds Never Fetched</span>
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                {status.neverFetchedFeeds.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.neverFetchedFeeds.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{feed.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {feed.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{feed.url}</p>
                    {feed.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{feed.errorMessage}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created {formatTime(feed.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startProcessing([feed.id])}
                      disabled={processing}
                    >
                      {processing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={feed.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Feeds */}
      {status.errorFeeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Error Feeds</span>
              <Badge variant="destructive">
                {status.errorFeeds.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.errorFeeds.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{feed.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {feed.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{feed.url}</p>
                    {feed.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{feed.errorMessage}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Last fetched: {formatTime(feed.lastFetched)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startProcessing([feed.id])}
                      disabled={processing}
                    >
                      {processing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={feed.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Processing Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {status.recentLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              status.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'SUCCESS' ? 'bg-green-500' :
                      log.status === 'ERROR' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{log.message}</p>
                      <p className="text-xs text-gray-500">
                        {log.type} • {formatTime(log.createdAt)}
                        {log.processingTime && ` • ${Math.round(log.processingTime / 1000)}s`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    log.status === 'SUCCESS' ? 'text-green-600 border-green-200' :
                    log.status === 'ERROR' ? 'text-red-600 border-red-200' : 'text-yellow-600 border-yellow-200'
                  }>
                    {log.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}