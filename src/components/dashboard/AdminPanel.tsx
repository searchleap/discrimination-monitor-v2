'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { RSSMonitor } from '@/components/admin/RSSMonitor'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'feeds' | 'monitor'>('overview')
  const [feeds, setFeeds] = useState<RSSFeed[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddFeed, setShowAddFeed] = useState(false)
  const [newFeed, setNewFeed] = useState({
    name: '',
    url: '',
    category: 'CIVIL_RIGHTS'
  })
  const [editingFeed, setEditingFeed] = useState<RSSFeed | null>(null)
  const [addFeedError, setAddFeedError] = useState<string | null>(null)

  const feedCategories = [
    'CIVIL_RIGHTS',
    'GOVERNMENT', 
    'ACADEMIC',
    'TECH_NEWS',
    'LEGAL',
    'HEALTHCARE',
    'MICHIGAN_LOCAL',
    'EMPLOYMENT',
    'DATA_ETHICS',
    'ADVOCACY'
  ]

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
          // API returns { success: boolean, data: Feed[], pagination: object }
          if (feedsData.success && Array.isArray(feedsData.data)) {
            setFeeds(feedsData.data)
          } else {
            setFeeds([])
          }
        } else {
          setFeeds([])
        }
      } catch (feedError) {
        // Failed to fetch feeds, using empty array as fallback
        setFeeds([])
      }

      // Fetch system status with error handling
      try {
        const statusResponse = await fetch('/api/admin/status')
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setSystemStatus(statusData)
        }
      } catch (statusError) {
        // Failed to fetch system status, using mock data
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
      // Failed to fetch system data
    } finally {
      setLoading(false)
    }
  }

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.includes('rss') || url.includes('feed') || url.includes('xml')
    } catch {
      return false
    }
  }

  const handleAddFeed = async () => {
    setAddFeedError(null)
    
    // Validate inputs
    if (!newFeed.name.trim()) {
      setAddFeedError('Feed name is required')
      return
    }
    
    if (!newFeed.url.trim()) {
      setAddFeedError('RSS URL is required')
      return
    }
    
    if (!validateUrl(newFeed.url)) {
      setAddFeedError('Please enter a valid RSS feed URL')
      return
    }

    try {
      const response = await fetch('/api/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFeed)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setNewFeed({ name: '', url: '', category: 'CIVIL_RIGHTS' })
        setShowAddFeed(false)
        setAddFeedError(null)
        fetchSystemData() // Refresh data
      } else {
        setAddFeedError(result.error || 'Failed to add feed')
      }
    } catch (error) {
      setAddFeedError('Network error. Please try again.')
    }
  }

  const handleEditFeed = async (feed: RSSFeed) => {
    setEditingFeed(feed)
  }

  const handleUpdateFeed = async () => {
    if (!editingFeed) return

    try {
      const response = await fetch(`/api/feeds/${editingFeed.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingFeed.name,
          url: editingFeed.url,
          category: editingFeed.category,
          isActive: editingFeed.isActive
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setEditingFeed(null)
        fetchSystemData() // Refresh data
      } else {
        alert(result.error || 'Failed to update feed')
      }
    } catch (error) {
      alert('Network error. Please try again.')
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
      // Handle update error silently
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
      // Handle delete error silently
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
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('feeds')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'feeds'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Rss className="h-4 w-4 inline mr-2" />
            RSS Feeds
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'monitor'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            RSS Monitor
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
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
      </>
      )}

      {activeTab === 'feeds' && (
        <>
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
                {addFeedError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{addFeedError}</p>
                  </div>
                )}
                <Input
                  placeholder="Feed Name (e.g., Michigan Civil Rights News)"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="RSS URL (e.g., https://example.com/feed.xml)"
                  value={newFeed.url}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, url: e.target.value }))}
                />
                <Select 
                  value={newFeed.category} 
                  onValueChange={(value) => setNewFeed(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleAddFeed} disabled={!newFeed.name.trim() || !newFeed.url.trim()}>
                    Add Feed
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddFeed(false)
                    setAddFeedError(null)
                    setNewFeed({ name: '', url: '', category: 'CIVIL_RIGHTS' })
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Feed Form */}
          {editingFeed && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Edit RSS Feed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Feed Name"
                  value={editingFeed.name}
                  onChange={(e) => setEditingFeed(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
                <Input
                  placeholder="RSS URL"
                  value={editingFeed.url}
                  onChange={(e) => setEditingFeed(prev => prev ? { ...prev, url: e.target.value } : null)}
                />
                <Select 
                  value={editingFeed.category} 
                  onValueChange={(value) => setEditingFeed(prev => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Active</label>
                  <Switch
                    checked={editingFeed.isActive}
                    onCheckedChange={(checked) => setEditingFeed(prev => prev ? { ...prev, isActive: checked } : null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateFeed}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditingFeed(null)}>Cancel</Button>
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
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Success Rate: {(feed.successRate * 100).toFixed(0)}% • 
                      Last fetched: {feed.lastFetched ? new Date(feed.lastFetched).toLocaleString() : 'Never'} •
                      Articles: {(feed as any)._count?.articles || 0}
                    </div>
                    {feed.errorMessage && (
                      <div className="text-red-600 font-medium">Error: {feed.errorMessage}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={feed.isActive}
                    onCheckedChange={(checked) => handleToggleFeed(feed.id, checked)}
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditFeed(feed)}
                  >
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

        </>
      )}

      {activeTab === 'monitor' && (
        <RSSMonitor />
      )}
    </div>
  )
}