'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Pause, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Zap,
  Timer,
  Bot,
  Settings,
  Activity
} from 'lucide-react'

interface AutoProcessingConfig {
  clientSideEnabled: boolean
  cronEnabled: boolean
  selfChainingEnabled: boolean
  pollInterval: number // seconds
  maxBatchesPerRun: number
  maxExecutionTime: number // seconds
}

interface AutoProcessingStatus {
  isActive: boolean
  lastTriggered?: string
  nextScheduled?: string
  totalAutoProcessed: number
  sessionsCompleted: number
}

export default function AutoProcessingSettings() {
  const [config, setConfig] = useState<AutoProcessingConfig>({
    clientSideEnabled: false,
    cronEnabled: true,
    selfChainingEnabled: false,
    pollInterval: 30,
    maxBatchesPerRun: 10,
    maxExecutionTime: 480
  })
  
  const [status, setStatus] = useState<AutoProcessingStatus>({
    isActive: false,
    totalAutoProcessed: 0,
    sessionsCompleted: 0
  })
  
  const [pendingCount, setPendingCount] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoProcessing, setAutoProcessing] = useState(false)

  // Client-side auto-polling effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (config.clientSideEnabled && !autoProcessing) {
      setIsPolling(true)
      
      intervalId = setInterval(async () => {
        try {
          // Check queue status
          const statusResponse = await fetch('/api/ai-queue/status')
          const statusData = await statusResponse.json()
          
          setPendingCount(statusData.data?.metrics?.pending || 0)
          
          // If there are pending articles, trigger processing
          if (statusData.data?.metrics?.pending > 0) {
            setAutoProcessing(true)
            
            const processResponse = await fetch('/api/ai-queue/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batchSize: 5,
                maxBatches: 2 // Smaller batches for client-side automation
              })
            })
            
            const processResult = await processResponse.json()
            
            setStatus(prev => ({
              ...prev,
              isActive: true,
              lastTriggered: new Date().toISOString(),
              totalAutoProcessed: prev.totalAutoProcessed + (processResult.summary?.totalProcessed || 0),
              sessionsCompleted: prev.sessionsCompleted + 1
            }))
          }
        } catch (error) {
          // Handle error
        } finally {
          setAutoProcessing(false)
        }
      }, config.pollInterval * 1000)
    } else {
      setIsPolling(false)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
        setIsPolling(false)
      }
    }
  }, [config.clientSideEnabled, config.pollInterval, autoProcessing])

  const handleToggleClientSide = (enabled: boolean) => {
    setConfig(prev => ({ ...prev, clientSideEnabled: enabled }))
    
    if (!enabled) {
      setStatus(prev => ({ ...prev, isActive: false }))
    }
  }

  const handleTriggerSelfChaining = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-queue/auto-process', {
        method: 'GET'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          lastTriggered: new Date().toISOString(),
          sessionsCompleted: prev.sessionsCompleted + 1
        }))
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const handleTestCron = async () => {
    setLoading(true)
    try {
      // Note: In production, this would need the CRON_SECRET
      const response = await fetch('/api/cron/process-queue', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`
        }
      })
      
      const result = await response.json()
      // Handle result
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/ai-queue/status')
        const data = await response.json()
        setPendingCount(data.data?.metrics?.pending || 0)
      } catch (error) {
        // Handle error
      }
    }
    
    fetchStatus()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Processing</h2>
          <p className="text-muted-foreground">
            Configure automatic article processing in serverless environment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={status.isActive ? "default" : "secondary"}>
            {status.isActive ? "Active" : "Inactive"}
          </Badge>
          {isPolling && (
            <Badge variant="outline" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Polling
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="client-side" className="space-y-4">
        <TabsList>
          <TabsTrigger value="client-side">Client-Side</TabsTrigger>
          <TabsTrigger value="self-chaining">Self-Chaining</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="client-side" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>Client-Side Auto-Processing</span>
              </CardTitle>
              <CardDescription>
                Automatically process articles while admin dashboard is open
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Auto-Processing</Label>
                  <p className="text-sm text-muted-foreground">
                    Polls queue every {config.pollInterval} seconds and processes pending articles
                  </p>
                </div>
                <Switch
                  checked={config.clientSideEnabled}
                  onCheckedChange={handleToggleClientSide}
                />
              </div>

              {config.clientSideEnabled && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Auto-processing is {isPolling ? 'active' : 'starting...'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>• Checking queue every {config.pollInterval} seconds</div>
                    <div>• Processing in 5-article batches</div>
                    <div>• Currently {pendingCount} articles pending</div>
                    {autoProcessing && (
                      <div className="flex items-center space-x-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Processing articles now...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Sessions Completed</div>
                  <div className="text-2xl font-bold text-blue-600">{status.sessionsCompleted}</div>
                </div>
                <div>
                  <div className="font-medium">Articles Processed</div>
                  <div className="text-2xl font-bold text-green-600">{status.totalAutoProcessed}</div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Client-side automation only works while this admin dashboard is open. 
                  For true background processing, use cron jobs or self-chaining functions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="self-chaining" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Self-Chaining Functions</span>
              </CardTitle>
              <CardDescription>
                Functions that recursively trigger themselves until queue is empty
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Recursive Processing</Label>
                  <p className="text-sm text-muted-foreground">
                    Trigger continuous processing that runs until queue is empty
                  </p>
                </div>
                <Button
                  onClick={handleTriggerSelfChaining}
                  disabled={loading || pendingCount === 0}
                  className="flex items-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  <span>Start Chain</span>
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingCount}
                    </Badge>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-sm text-amber-800 space-y-2">
                  <div><strong>How it works:</strong></div>
                  <div>• Processes 5 articles per batch</div>
                  <div>• After each batch, triggers itself again if more articles remain</div>
                  <div>• Includes safety limits: max 20 batches, 8-minute execution time</div>
                  <div>• Stops automatically when queue is empty</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Max Batches</div>
                  <div className="text-2xl font-bold text-purple-600">{config.maxBatchesPerRun}</div>
                </div>
                <div>
                  <div className="font-medium">Max Time</div>
                  <div className="text-2xl font-bold text-orange-600">{Math.round(config.maxExecutionTime / 60)}m</div>
                </div>
                <div>
                  <div className="font-medium">Batch Size</div>
                  <div className="text-2xl font-bold text-blue-600">5</div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Caution:</strong> Self-chaining functions use more resources and should be used judiciously. 
                  Include circuit breakers to prevent infinite loops.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cron" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Vercel Cron Jobs</span>
              </CardTitle>
              <CardDescription>
                Scheduled automatic processing using Vercel&apos;s native cron functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-800 space-y-2">
                    <div><strong>Active Cron Schedules:</strong></div>
                    <div>• Every 15 minutes (Mon-Fri, 9 AM - 5 PM)</div>
                    <div>• Every hour (Nights and weekends)</div>
                    <div>• Configured in vercel.json deployment settings</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Test Cron Endpoint</Label>
                    <p className="text-sm text-muted-foreground">
                      Manually trigger the cron processing endpoint for testing
                    </p>
                  </div>
                  <Button
                    onClick={handleTestCron}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Timer className="h-4 w-4" />
                    )}
                    <span>Test Cron</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Business Hours</div>
                  <div className="text-lg font-bold text-blue-600">Every 15min</div>
                  <div className="text-xs text-muted-foreground">Mon-Fri, 9 AM - 5 PM</div>
                </div>
                <div>
                  <div className="font-medium">Off Hours</div>
                  <div className="text-lg font-bold text-gray-600">Every 60min</div>
                  <div className="text-xs text-muted-foreground">Nights & weekends</div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommended:</strong> Cron jobs provide the most reliable automated processing 
                  in serverless environments with minimal resource usage.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Statistics</CardTitle>
                <CardDescription>Overview of automated processing performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{status.totalAutoProcessed}</div>
                    <p className="text-sm text-muted-foreground">Total Auto-Processed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{status.sessionsCompleted}</div>
                    <p className="text-sm text-muted-foreground">Sessions Completed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Queue:</span>
                    <span className="font-medium">{pendingCount} pending</span>
                  </div>
                  {status.lastTriggered && (
                    <div className="flex justify-between text-sm">
                      <span>Last Triggered:</span>
                      <span className="font-medium">
                        {new Date(status.lastTriggered).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Health</CardTitle>
                <CardDescription>Status of different automation approaches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm">Client-Side</span>
                  </div>
                  <Badge variant={config.clientSideEnabled ? "default" : "secondary"}>
                    {config.clientSideEnabled ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Cron Jobs</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Self-Chaining</span>
                  </div>
                  <Badge variant="secondary">On-Demand</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}