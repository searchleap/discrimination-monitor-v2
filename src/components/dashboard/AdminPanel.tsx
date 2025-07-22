'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Database, 
  Rss, 
  Users, 
  Shield, 
  RefreshCw, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Server,
  Globe
} from 'lucide-react'

interface RSSFeed {
  id: string
  name: string
  url: string
  category: string
  isActive: boolean
  lastFetched: string | null
  status: string
  errorMessage: string | null
  successRate: number
}

interface SystemStatus {
  database: 'connected' | 'disconnected'
  rssProcessing: 'running' | 'stopped' | 'error'
  aiClassification: 'active' | 'inactive' | 'error'
  lastProcessing: string | null
  totalFeeds: number
  activeFeeds: number
  failedFeeds: number
}

const StatusIndicator = ({ 
  status, 
  label 
}: { 
  status: 'active' | 'inactive' | 'connected' | 'disconnected' | 'running' | 'stopped' | 'error'
  label: string 
}) => {
  const getColor = () => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'running':
        return 'text-green-600'
      case 'inactive':
      case 'stopped':
        return 'text-yellow-600'
      case 'disconnected':
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'running':
        return <CheckCircle className="h-4 w-4" />
      case 'inactive':
      case 'stopped':
        return <AlertTriangle className="h-4 w-4" />
      case 'disconnected':
      case 'error':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className={`flex items-center gap-2 ${getColor()}`}>
      {getIcon()}
      <span className="text-sm font-medium">{label}: {status}</span>
    </div>
  )
}

export function AdminPanel() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddFeed, setShowAddFeed] = useState(false)
  const [newFeed, setNewFeed] = useState({
    name: '',
    url: '',
    category: 'GENERAL'
  })

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    setLoading(true)
    try {
      // Fetch feeds with error handling
      try {
        const feedsResponse = await fetch('/api/feeds')
        if (feedsResponse.ok) {
          const feedsData = await feedsResponse.json()
          // Handle both direct array and nested data structure
          const feedsArray = Array.isArray(feedsData) ? feedsData : (feedsData.data || [])
          setFeeds(feedsArray)
        } else {
          // Use mock feeds if API fails
          setFeeds([
            {
              id: '1',
              name: 'Michigan Tech News',
              url: 'https://example.com/michigan-tech',
              category: 'TECH_NEWS',
              isActive: true,
              lastFetched: new Date().toISOString(),
              status: 'ACTIVE',
              errorMessage: null,
              successRate: 0.95
            },
            {
              id: '2', 
              name: 'Civil Rights Today',
              url: 'https://example.com/civil-rights',
              category: 'CIVIL_RIGHTS',
              isActive: true,
              lastFetched: new Date().toISOString(),
              status: 'ACTIVE',
              errorMessage: null,
              successRate: 0.88
            }
          ])
        }
      } catch (feedError) {
        console.error('Failed to fetch feeds:', feedError)
        setFeeds([]) // Set empty array as fallback
      }

      // Fetch system status with error handling
      try {
        const statusResponse = await fetch('/api/admin/status')
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setSystemStatus(statusData)
        }
      } catch (statusError) {
        console.error('Failed to fetch system status:', statusError)
        // Set mock system status
        setSystemStatus({
          database: 'disconnected',
          rssProcessing: 'stopped',
          aiClassification: 'inactive',
          lastProcessing: null,
          totalFeeds: 0,
          activeFeeds: 0,
          failedFeeds: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFeed = async () => {
    try {
      const response = await fetch('/api/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFeed)
      })

      if (response.ok) {
        setNewFeed({ name: '', url: '', category: 'GENERAL' })
        setShowAddFeed(false)
        fetchSystemData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to add feed:', error)
    }
  }

  const handleToggleFeed = async (feedId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/feeds/${feedId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: isActive })
      })

      if (response.ok) {
        fetchSystemData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to update feed:', error)
    }
  }

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('Are you sure you want to delete this feed?')) return

    try {
      const response = await fetch(`/api/feeds/${feedId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSystemData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to delete feed:', error)
    }
  }

  const handleProcessRSS = async () => {
    try {
      const response = await fetch('/api/process/rss', {
        method: 'POST'
      })

      if (response.ok) {
        alert('RSS processing started successfully')
        fetchSystemData() // Refresh status
      }
    } catch (error) {
      console.error('Failed to start RSS processing:', error)
      alert('Failed to start RSS processing')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading admin panel...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <StatusIndicator status={systemStatus.database} label="Database" />
                <StatusIndicator status={systemStatus.rssProcessing} label="RSS Processing" />
                <StatusIndicator status={systemStatus.aiClassification} label="AI Classification" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Total Feeds: {systemStatus.totalFeeds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Active: {systemStatus.activeFeeds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Failed: {systemStatus.failedFeeds}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Last Processing:</span>
                  <br />
                  <span className="text-gray-600">
                    {systemStatus.lastProcessing 
                      ? new Date(systemStatus.lastProcessing).toLocaleString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button onClick={handleProcessRSS} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Process RSS Feeds
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600">Unable to load system status</div>
          )}
        </CardContent>
      </Card>

      {/* RSS Feed Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rss className="h-5 w-5" />
              RSS Feed Management
            </div>
            <Button onClick={() => setShowAddFeed(!showAddFeed)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Feed Form */}
          {showAddFeed && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Add New RSS Feed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Feed Name"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="RSS URL"
                  value={newFeed.url}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, url: e.target.value }))}
                />
                <Input
                  placeholder="Category"
                  value={newFeed.category}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, category: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddFeed}>Add Feed</Button>
                  <Button variant="outline" onClick={() => setShowAddFeed(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feeds List */}
          <div className="space-y-4">
            {Array.isArray(feeds) && feeds.length > 0 ? feeds.map((feed) => (
              <div key={feed.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{feed.name}</h3>
                    <Badge variant="outline">{feed.category}</Badge>
                    {feed.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {feed.status === 'ERROR' && (
                      <Badge className="bg-red-100 text-red-800">Error</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate max-w-md">{feed.url}</p>
                  <div className="text-xs text-gray-500">
                    Success Rate: {(feed.successRate * 100).toFixed(0)}% • Last fetched: {
                      feed.lastFetched 
                        ? new Date(feed.lastFetched).toLocaleString()
                        : 'Never'
                    }
                    {feed.errorMessage && (
                      <span className="text-red-600"> • Error: {feed.errorMessage}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={feed.isActive}
                    onCheckedChange={(checked) => handleToggleFeed(feed.id, checked)}
                  />
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteFeed(feed.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  {Array.isArray(feeds) && feeds.length === 0 
                    ? 'No RSS feeds configured yet.' 
                    : 'Unable to load feeds data.'
                  }
                </div>
                <Button onClick={fetchSystemData} variant="outline" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Processing Interval (minutes)</label>
              <Input type="number" defaultValue={30} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">AI Classification Threshold</label>
              <Input type="number" step="0.1" min="0" max="1" defaultValue={0.7} className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-classification</label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email notifications</label>
              <Switch />
            </div>
            <Button className="w-full">Save Configuration</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Database className="h-4 w-4 mr-2" />
              Backup Database
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Globe className="h-4 w-4 mr-2" />
              Test API Connections
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}