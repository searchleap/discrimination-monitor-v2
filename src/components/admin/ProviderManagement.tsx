'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Settings, 
  Trash2, 
  TestTube, 
  Activity,
  Clock,
  DollarSign,
  Zap,
  Edit,
  TrendingUp,
  Loader2
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  type: string
  enabled: boolean
  priority: number
  config: {
    model?: string
    maxTokens?: number
    temperature?: number
    timeout?: number
  }
  health: {
    status: 'healthy' | 'degraded' | 'down'
    responseTime?: number
    errorRate?: number
    lastChecked: string
    errorMessage?: string
  }
  usage: {
    requestCount: number
    successCount: number
    errorCount: number
    averageLatency?: number
    estimatedCost: number
    successRate: number
  }
  createdAt: string
  updatedAt: string
}

interface ProviderFormData {
  name: string
  type: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  timeout: number
  priority: number
}

export default function ProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    type: 'OPENAI',
    apiKey: '',
    model: '',
    maxTokens: 1000,
    temperature: 0.1,
    timeout: 30000,
    priority: 5
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers')
      const data = await response.json()
      
      if (data.success) {
        setProviders(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingProvider ? `/api/providers/${editingProvider.id}` : '/api/providers'
      const method = editingProvider ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          config: {
            apiKey: formData.apiKey,
            model: formData.model || undefined,
            maxTokens: formData.maxTokens,
            temperature: formData.temperature,
            timeout: formData.timeout
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchProviders()
        setShowAddDialog(false)
        setEditingProvider(null)
        resetForm()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return
    
    try {
      const response = await fetch(`/api/providers/${providerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProviders()
      }
    } catch (error) {
      console.error('Failed to delete provider:', error)
    }
  }

  const handleTest = async (providerId: string) => {
    setTestingProvider(providerId)
    
    try {
      const response = await fetch(`/api/providers/${providerId}/test`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Provider Test Successful!\n\nProvider: ${data.data.providerName}\nType: ${data.data.providerType}\nResponse Time: ${data.data.testResult.responseTime}ms\nStatus: ${data.data.testResult.status}`)
      } else {
        alert(`❌ Provider Test Failed!\n\nError: ${data.error}`)
      }
      
      await fetchProviders()
    } catch (error) {
      alert(`❌ Test failed: ${error}`)
    } finally {
      setTestingProvider(null)
    }
  }

  const handleToggleEnabled = async (providerId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        await fetchProviders()
      }
    } catch (error) {
      console.error('Failed to toggle provider:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'OPENAI',
      apiKey: '',
      model: '',
      maxTokens: 1000,
      temperature: 0.1,
      timeout: 30000,
      priority: 5
    })
  }

  const startEdit = (provider: Provider) => {
    setFormData({
      name: provider.name,
      type: provider.type,
      apiKey: '', // Don't pre-fill encrypted keys
      model: provider.config.model || '',
      maxTokens: provider.config.maxTokens || 1000,
      temperature: provider.config.temperature || 0.1,
      timeout: provider.config.timeout || 30000,
      priority: provider.priority
    })
    setEditingProvider(provider)
    setShowAddDialog(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'down': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'degraded': return 'secondary'
      case 'down': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading provider management...</p>
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
          <h3 className="text-2xl font-bold">AI Provider Management</h3>
          <p className="text-muted-foreground">
            Configure and monitor AI providers for article classification
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </DialogTitle>
              <DialogDescription>
                Configure a new AI provider for article classification
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Provider Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPENAI">OpenAI</SelectItem>
                      <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={editingProvider ? "Leave empty to keep current key" : "Enter API key"}
                  required={!editingProvider}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model (Optional)</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder={formData.type === 'OPENAI' ? 'gpt-4o-mini' : 'claude-3-haiku-20240307'}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1000"
                    max="120000"
                    step="1000"
                    value={formData.timeout}
                    onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProvider ? 'Update Provider' : 'Add Provider'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Provider List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Providers</CardTitle>
          <CardDescription>
            Manage AI providers and monitor their health and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No providers configured</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Provider
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {provider.name}
                            <Badge variant="outline">{provider.type}</Badge>
                            <Badge variant={getStatusColor(provider.enabled ? 'healthy' : 'down')}>
                              {provider.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Priority: {provider.priority} • Model: {provider.config.model || 'Default'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(provider.health.status)}
                        <div>
                          <Badge variant={getStatusColor(provider.health.status)}>
                            {provider.health.status}
                          </Badge>
                          {provider.health.responseTime && (
                            <div className="text-xs text-muted-foreground">
                              {provider.health.responseTime}ms
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{provider.usage.requestCount} requests</div>
                        <div className="text-muted-foreground">
                          {Math.round(provider.usage.successRate * 100)}% success
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {provider.usage.averageLatency ? (
                          <>
                            <div>{provider.usage.averageLatency}ms avg</div>
                            <div className="text-muted-foreground">
                              {provider.usage.errorCount} errors
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {provider.usage.estimatedCost.toFixed(4)}
                        </div>
                        <div className="text-muted-foreground">
                          {provider.usage.requestCount} reqs
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(checked) => handleToggleEnabled(provider.id, checked)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(provider.id)}
                          disabled={testingProvider === provider.id}
                        >
                          {testingProvider === provider.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <TestTube className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(provider)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(provider.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
            <p className="text-xs text-muted-foreground">
              {providers.filter(p => p.enabled).length} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Providers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.filter(p => p.health.status === 'healthy').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((providers.filter(p => p.health.status === 'healthy').length / Math.max(providers.length, 1)) * 100)}% healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${providers.reduce((sum, p) => sum + p.usage.estimatedCost, 0).toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              {providers.reduce((sum, p) => sum + p.usage.requestCount, 0)} total requests
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}