'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Edit, Plus, TestTube, BarChart3, Settings, RefreshCw, Database, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ContentFilter {
  id: string
  term: string
  isActive: boolean
  category: string | null
  description: string | null
  matchCount: number
  createdAt: string
  updatedAt: string
}

interface FilteringConfig {
  id: string | null
  name: string
  isActive: boolean
  filterMode: 'OR' | 'AND'
  minTermLength: number
  caseSensitive: boolean
  articlesFiltered: number
  articlesAccepted: number
  lastApplied: string | null
}

interface FilteringStats {
  config: FilteringConfig | null
  activeFilters: number
  totalMatches: number
  articlesAccepted: number
  articlesFiltered: number
  filterList: Array<{
    id: string
    term: string
    category: string | null
    matchCount: number
    isActive: boolean
  }>
  summary: {
    isActive: boolean
    filterMode: string
    totalArticlesProcessed: number
    filteringRate: string
    avgMatchesPerFilter: string
  }
}

const FILTER_CATEGORIES = [
  'discrimination',
  'ai',
  'legal',
  'employment',
  'healthcare',
  'education',
  'housing',
  'civil-rights',
  'technology'
]

export default function ContentFilterManager() {
  const [filters, setFilters] = useState<ContentFilter[]>([])
  const [config, setConfig] = useState<FilteringConfig | null>(null)
  const [stats, setStats] = useState<FilteringStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  
  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingFilter, setEditingFilter] = useState<ContentFilter | null>(null)
  const [newFilter, setNewFilter] = useState({
    term: '',
    category: '',
    description: '',
    isActive: true
  })
  
  // Test form states
  const [testTitle, setTestTitle] = useState('')
  const [testContent, setTestContent] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // Retroactive filtering states
  const [retroactiveAnalysis, setRetroactiveAnalysis] = useState<any>(null)
  const [retroactiveLoading, setRetroactiveLoading] = useState(false)
  const [showCleanupConfirmDialog, setShowCleanupConfirmDialog] = useState(false)
  const [cleanupOptions, setCleanupOptions] = useState({
    dryRun: true,
    batchSize: 100,
    maxArticlesToDelete: undefined as number | undefined,
    preserveRecentArticles: false,
    recentArticleThresholdDays: 30,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [filtersRes, configRes, statsRes] = await Promise.all([
        fetch('/api/admin/content-filters'),
        fetch('/api/admin/filtering-config'),
        fetch('/api/admin/content-filters/stats')
      ])

      const filtersData = await filtersRes.json()
      const configData = await configRes.json()
      const statsData = await statsRes.json()

      setFilters(filtersData.filters || [])
      setConfig(configData)
      setStats(statsData)
    } catch (error) {
      // console.error('Error loading data:', error)
      toast.error('Failed to load content filters')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFilter = async () => {
    if (!newFilter.term.trim()) {
      toast.error('Filter term is required')
      return
    }

    try {
      const response = await fetch('/api/admin/content-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: newFilter.term.trim(),
          category: newFilter.category || null,
          description: newFilter.description || null,
          isActive: newFilter.isActive
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create filter')
      }

      toast.success('Content filter created successfully')
      setShowAddDialog(false)
      setNewFilter({ term: '', category: '', description: '', isActive: true })
      loadData()
    } catch (error) {
      // console.error('Error creating filter:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create filter')
    }
  }

  const handleUpdateFilter = async (filter: ContentFilter) => {
    try {
      const response = await fetch(`/api/admin/content-filters/${filter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update filter')
      }

      toast.success('Filter updated successfully')
      setEditingFilter(null)
      loadData()
    } catch (error) {
      // console.error('Error updating filter:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update filter')
    }
  }

  const handleDeleteFilters = async (filterIds: string[]) => {
    if (filterIds.length === 0) return

    try {
      const response = await fetch(`/api/admin/content-filters?ids=${filterIds.join(',')}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete filters')
      }

      toast.success(`Deleted ${filterIds.length} filter(s)`)
      setSelectedFilters([])
      loadData()
    } catch (error) {
      // console.error('Error deleting filters:', error)
      toast.error('Failed to delete filters')
    }
  }

  const handleUpdateConfig = async (updates: Partial<FilteringConfig>) => {
    try {
      const response = await fetch('/api/admin/filtering-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update configuration')
      }

      const updatedConfig = await response.json()
      setConfig(updatedConfig)
      toast.success('Configuration updated successfully')
      loadData() // Reload stats
    } catch (error) {
      // console.error('Error updating config:', error)
      toast.error('Failed to update configuration')
    }
  }

  const handleTestFilters = async () => {
    if (!testTitle.trim() || !testContent.trim()) {
      toast.error('Both title and content are required for testing')
      return
    }

    try {
      setTesting(true)
      const response = await fetch('/api/admin/content-filters/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          content: testContent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to test filters')
      }

      const result = await response.json()
      setTestResult(result)
      toast.success('Filter test completed')
    } catch (error) {
      // console.error('Error testing filters:', error)
      toast.error('Failed to test filters')
    } finally {
      setTesting(false)
    }
  }

  const resetStatistics = async () => {
    try {
      const response = await fetch('/api/admin/filtering-config?action=reset-stats', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to reset statistics')
      }

      toast.success('Statistics reset successfully')
      loadData()
    } catch (error) {
      // console.error('Error resetting statistics:', error)
      toast.error('Failed to reset statistics')
    }
  }

  const runRetroactiveAnalysis = async () => {
    setRetroactiveLoading(true)
    setRetroactiveAnalysis(null)
    
    try {
      toast.info('Starting analysis of existing articles...')
      
      const response = await fetch('/api/admin/content-filters/retroactive-analysis', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to run retroactive analysis')
      }

      const result = await response.json()
      setRetroactiveAnalysis(result.data)
      toast.success('Retroactive analysis completed')
    } catch (error) {
      toast.error('Failed to run analysis')
    } finally {
      setRetroactiveLoading(false)
    }
  }

  const executeRetroactiveCleanup = async (dryRun: boolean = true) => {
    setRetroactiveLoading(true)
    
    try {
      const action = dryRun ? 'preview' : 'execute cleanup'
      toast.info(`Starting ${action}...`)
      
      const response = await fetch('/api/admin/content-filters/retroactive-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...cleanupOptions,
          dryRun,
          confirmed: !dryRun,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to execute cleanup')
      }

      const result = await response.json()
      
      // Update the analysis with cleanup results
      setRetroactiveAnalysis((prev: any) => ({
        ...prev,
        cleanupResult: result.data,
      }))
      
      const message = dryRun 
        ? `Cleanup preview completed: ${result.data.articlesDeleted} articles would be deleted`
        : `Cleanup executed: ${result.data.articlesDeleted} articles deleted`
      
      toast.success(message)
      
      if (!dryRun) {
        // Refresh main data after actual cleanup
        loadData()
        setShowCleanupConfirmDialog(false)
      }
      
    } catch (error) {
      toast.error('Failed to execute cleanup')
    } finally {
      setRetroactiveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Filtering</h2>
          <p className="text-muted-foreground">
            Control which RSS articles are stored based on keywords and phrases
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="filters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="test">Test Filters</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="retroactive">Retroactive Filtering</TabsTrigger>
        </TabsList>

        {/* Filter Management Tab */}
        <TabsContent value="filters" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
              {selectedFilters.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteFilters(selectedFilters)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedFilters.length})
                </Button>
              )}
            </div>
            <Badge variant={config?.isActive ? 'default' : 'secondary'}>
              Filtering {config?.isActive ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedFilters.length === filters.length && filters.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFilters(filters.map(f => f.id))
                            } else {
                              setSelectedFilters([])
                            }
                          }}
                        />
                      </th>
                      <th className="p-4">Term</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Matches</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filters.map((filter) => (
                      <tr key={filter.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedFilters.includes(filter.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFilters([...selectedFilters, filter.id])
                              } else {
                                setSelectedFilters(selectedFilters.filter(id => id !== filter.id))
                              }
                            }}
                          />
                        </td>
                        <td className="p-4 font-mono">{filter.term}</td>
                        <td className="p-4">
                          {filter.category ? (
                            <Badge variant="outline">{filter.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">{filter.matchCount}</td>
                        <td className="p-4">
                          <Badge variant={filter.isActive ? 'default' : 'secondary'}>
                            {filter.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingFilter(filter)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFilters([filter.id])}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Filtering Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Enable Content Filtering</div>
                  <div className="text-sm text-muted-foreground">
                    When enabled, only articles matching filters will be stored
                  </div>
                </div>
                <Switch
                  checked={config?.isActive || false}
                  onCheckedChange={(checked) => 
                    handleUpdateConfig({ isActive: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium">Filter Mode</label>
                <Select
                  value={config?.filterMode || 'OR'}
                  onValueChange={(value: 'OR' | 'AND') => 
                    handleUpdateConfig({ filterMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OR">OR - Match any filter</SelectItem>
                    <SelectItem value="AND">AND - Match all filters</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {config?.filterMode === 'OR' 
                    ? 'Articles matching any active filter will be stored'
                    : 'Articles must match all active filters to be stored'
                  }
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Case Sensitive Matching</div>
                  <div className="text-sm text-muted-foreground">
                    Whether filter matching should consider letter case
                  </div>
                </div>
                <Switch
                  checked={config?.caseSensitive || false}
                  onCheckedChange={(checked) => 
                    handleUpdateConfig({ caseSensitive: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Filters Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Test Content Filtering</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium">Article Title</label>
                <Input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Enter article title to test..."
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium">Article Content</label>
                <Textarea
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="Enter article content to test..."
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleTestFilters} 
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Filters
              </Button>

              {testResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Test Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Alert>
                      <AlertDescription>
                        <strong>Result:</strong> Article would be{' '}
                        <span className={testResult.result.shouldStore ? 'text-green-600' : 'text-red-600'}>
                          {testResult.result.shouldStore ? 'STORED' : 'FILTERED OUT'}
                        </span>
                        <br />
                        <strong>Reason:</strong> {testResult.result.reason}
                        {testResult.result.matchedFilters.length > 0 && (
                          <>
                            <br />
                            <strong>Matched Filters:</strong> {testResult.result.matchedFilters.join(', ')}
                          </>
                        )}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <h4 className="font-medium">Filter Details</h4>
                      <div className="space-y-1">
                        {testResult.filterDetails.map((detail: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="font-mono">{detail.term}</span>
                            <Badge variant={detail.matched ? 'default' : 'secondary'}>
                              {detail.matched ? 'Match' : 'No Match'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <div className="text-2xl font-bold">{stats.activeFilters}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">Active Filters</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.articlesAccepted}
                    </div>
                    <p className="text-xs text-muted-foreground">Articles Stored</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.articlesFiltered}
                    </div>
                    <p className="text-xs text-muted-foreground">Articles Filtered</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {stats.summary.filteringRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Filtering Rate</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Filter Performance</CardTitle>
                  <Button variant="outline" size="sm" onClick={resetStatistics}>
                    Reset Statistics
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.filterList.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between">
                        <span className="font-mono text-sm">{filter.term}</span>
                        <div className="flex items-center space-x-2">
                          {filter.category && (
                            <Badge variant="outline" className="text-xs">
                              {filter.category}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {filter.matchCount} matches
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Retroactive Filtering Tab */}
        <TabsContent value="retroactive" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will apply current filters to all existing articles in the database. 
              Articles that don&apos;t match any filters will be permanently deleted. Always run analysis first!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Analyze existing articles to see how many would be affected by current filters.
                  </p>
                  <Button 
                    onClick={runRetroactiveAnalysis}
                    disabled={retroactiveLoading}
                    className="w-full"
                  >
                    {retroactiveLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Run Analysis
                      </>
                    )}
                  </Button>
                </div>

                {retroactiveAnalysis && (
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {retroactiveAnalysis.articlesToKeep}
                        </div>
                        <div className="text-xs text-green-700">Articles to Keep</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {retroactiveAnalysis.articlesToRemove}
                        </div>
                        <div className="text-xs text-red-700">Articles to Remove</div>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Total Articles:</span>
                        <span className="font-mono">{retroactiveAnalysis.totalArticles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Filters Matched:</span>
                        <span className="font-mono">{retroactiveAnalysis.filterStats.matchedFilters.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage Reduction:</span>
                        <span className="font-mono">{retroactiveAnalysis.estimatedSavings.storageReduction}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cleanup Options */}
            <Card>
              <CardHeader>
                <CardTitle>Cleanup Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Preserve Recent Articles</label>
                    <Switch
                      checked={cleanupOptions.preserveRecentArticles}
                      onCheckedChange={(checked) => 
                        setCleanupOptions(prev => ({ ...prev, preserveRecentArticles: checked }))
                      }
                    />
                  </div>

                  {cleanupOptions.preserveRecentArticles && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Days to Preserve</label>
                      <Input
                        type="number"
                        value={cleanupOptions.recentArticleThresholdDays}
                        onChange={(e) => 
                          setCleanupOptions(prev => ({ 
                            ...prev, 
                            recentArticleThresholdDays: parseInt(e.target.value) || 30 
                          }))
                        }
                        min="1"
                        max="365"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Articles to Delete</label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={cleanupOptions.maxArticlesToDelete || ''}
                      onChange={(e) => 
                        setCleanupOptions(prev => ({ 
                          ...prev, 
                          maxArticlesToDelete: e.target.value ? parseInt(e.target.value) : undefined 
                        }))
                      }
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Batch Size</label>
                    <Input
                      type="number"
                      value={cleanupOptions.batchSize}
                      onChange={(e) => 
                        setCleanupOptions(prev => ({ 
                          ...prev, 
                          batchSize: parseInt(e.target.value) || 100 
                        }))
                      }
                      min="10"
                      max="1000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => executeRetroactiveCleanup(true)}
                    disabled={retroactiveLoading || !retroactiveAnalysis}
                    variant="outline"
                    className="w-full"
                  >
                    {retroactiveLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Preview Cleanup (Dry Run)
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={() => setShowCleanupConfirmDialog(true)}
                    disabled={retroactiveLoading || !retroactiveAnalysis}
                    variant="destructive"
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Execute Cleanup (Permanent)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          {retroactiveAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Sample Articles to Remove</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {retroactiveAnalysis.sampleArticlesToRemove.map((article: any, index: number) => (
                    <div key={article.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{article.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">
                        No matches
                      </Badge>
                    </div>
                  ))}
                </div>

                {retroactiveAnalysis.cleanupResult && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Last Cleanup Results</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-bold text-red-600">{retroactiveAnalysis.cleanupResult.articlesDeleted}</div>
                        <div className="text-xs">Deleted</div>
                      </div>
                      <div>
                        <div className="font-bold text-green-600">{retroactiveAnalysis.cleanupResult.articlesPreserved}</div>
                        <div className="text-xs">Preserved</div>
                      </div>
                      <div>
                        <div className="font-bold">{Math.round(retroactiveAnalysis.cleanupResult.processingTime)}ms</div>
                        <div className="text-xs">Processing Time</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Filter Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Filter Term *</label>
              <Input
                value={newFilter.term}
                onChange={(e) => setNewFilter({ ...newFilter, term: e.target.value })}
                placeholder="e.g., discrimination, AI bias, etc."
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Category</label>
              <Select
                value={newFilter.category}
                onValueChange={(value) => setNewFilter({ ...newFilter, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Description</label>
              <Textarea
                value={newFilter.description}
                onChange={(e) => setNewFilter({ ...newFilter, description: e.target.value })}
                placeholder="Optional description or notes about this filter"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Active</div>
                <div className="text-sm text-muted-foreground">
                  Enable this filter immediately
                </div>
              </div>
              <Switch
                checked={newFilter.isActive}
                onCheckedChange={(checked) => setNewFilter({ ...newFilter, isActive: checked })}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFilter}>
                Add Filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Filter Dialog */}
      <Dialog open={!!editingFilter} onOpenChange={() => setEditingFilter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Content Filter</DialogTitle>
          </DialogHeader>
          {editingFilter && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium">Filter Term *</label>
                <Input
                  value={editingFilter.term}
                  onChange={(e) => setEditingFilter({ ...editingFilter, term: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium">Category</label>
                <Select
                  value={editingFilter.category || ''}
                  onValueChange={(value) => setEditingFilter({ 
                    ...editingFilter, 
                    category: value || null 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-medium">Description</label>
                <Textarea
                  value={editingFilter.description || ''}
                  onChange={(e) => setEditingFilter({ 
                    ...editingFilter, 
                    description: e.target.value || null 
                  })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Active</div>
                  <div className="text-sm text-muted-foreground">
                    Filter is currently {editingFilter.isActive ? 'enabled' : 'disabled'}
                  </div>
                </div>
                <Switch
                  checked={editingFilter.isActive}
                  onCheckedChange={(checked) => setEditingFilter({ 
                    ...editingFilter, 
                    isActive: checked 
                  })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingFilter(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateFilter(editingFilter)}>
                  Update Filter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={showCleanupConfirmDialog} onOpenChange={setShowCleanupConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Permanent Cleanup
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>This action cannot be undone!</strong> You are about to permanently delete articles from the database.
              </AlertDescription>
            </Alert>

            {retroactiveAnalysis && (
              <div className="space-y-3">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Articles to be deleted:</h4>
                  <div className="text-2xl font-bold text-red-600">
                    {retroactiveAnalysis.articlesToRemove}
                  </div>
                  <div className="text-sm text-red-700">
                    out of {retroactiveAnalysis.totalArticles} total articles
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Filters that will be preserved:</span>
                    <span className="font-mono">{retroactiveAnalysis.filterStats.matchedFilters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated storage reduction:</span>
                    <span className="font-mono">{retroactiveAnalysis.estimatedSavings.storageReduction}</span>
                  </div>
                  {cleanupOptions.preserveRecentArticles && (
                    <div className="flex justify-between">
                      <span>Recent articles preservation:</span>
                      <span className="font-mono">{cleanupOptions.recentArticleThresholdDays} days</span>
                    </div>
                  )}
                  {cleanupOptions.maxArticlesToDelete && (
                    <div className="flex justify-between">
                      <span>Maximum deletions:</span>
                      <span className="font-mono">{cleanupOptions.maxArticlesToDelete}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCleanupConfirmDialog(false)}
                disabled={retroactiveLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => executeRetroactiveCleanup(false)}
                disabled={retroactiveLoading}
              >
                {retroactiveLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Yes, Delete Articles
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}