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
  title: string
  url: string
  category: string
  is_active: boolean
  last_fetched: string | null
  article_count: number
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
    title: '',
    url: '',
    category: 'General'
  })

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    setLoading(true)
    try {
      // Fetch feeds
      const feedsResponse = await fetch('/api/feeds')
      if (feedsResponse.ok) {
        const feedsData = await feedsResponse.json()
        setFeeds(feedsData)
      }

      // Fetch system status
      const statusResponse = await fetch('/api/admin/status')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setSystemStatus(statusData)
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
        setNewFeed({ title: '', url: '', category: 'General' })
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
        body: JSON.stringify({ is_active: isActive })
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
                  placeholder="Feed Title"
                  value={newFeed.title}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, title: e.target.value }))}
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
            {feeds.map((feed) => (
              <div key={feed.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{feed.title}</h3>
                    <Badge variant="outline">{feed.category}</Badge>
                    {feed.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate max-w-md">{feed.url}</p>
                  <div className="text-xs text-gray-500">
                    {feed.article_count} articles • Last fetched: {
                      feed.last_fetched 
                        ? new Date(feed.last_fetched).toLocaleString()
                        : 'Never'
                    }
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={feed.is_active}
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
            ))}
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