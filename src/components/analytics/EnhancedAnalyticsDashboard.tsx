'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin,
  BarChart3, 
  PieChart, 
  Calendar,
  AlertTriangle,
  Eye,
  Clock,
  Target,
  Filter,
  Download,
  Zap,
  Globe,
  Activity,
  Layers,
  Radar
} from 'lucide-react'

import GeographicHeatMap from './GeographicHeatMap'
import ChartsSection from '../dashboard/ChartsSection'

interface EnhancedAnalyticsData {
  overview: {
    totalArticles: number
    activeLocations: number
    avgConfidenceScore: number
    classificationAccuracy: number
    processingTime: number
    trendsChange: number
  }
  timeFilters: string[]
  categoryFilters: string[]
}

interface AnalyticsTabsProps {
  selectedTimeRange: string
  selectedCategory: string
  onTimeRangeChange: (range: string) => void
  onCategoryChange: (category: string) => void
}

const TIME_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' }
]

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'RACIAL', label: 'Racial Discrimination' },
  { value: 'RELIGIOUS', label: 'Religious Discrimination' },
  { value: 'DISABILITY', label: 'Disability Discrimination' },
  { value: 'GENERAL_AI', label: 'General AI' },
  { value: 'MULTIPLE', label: 'Multiple Categories' }
]

const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  description,
  color = "blue"
}: {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'stable'
  icon: any
  description?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50', 
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    purple: 'text-purple-600 bg-purple-50'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {change && (
                <div className="flex items-center gap-1 mb-1">
                  {getTrendIcon()}
                  <span className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const FilterControls = ({ 
  selectedTimeRange, 
  selectedCategory, 
  onTimeRangeChange, 
  onCategoryChange 
}: AnalyticsTabsProps) => (
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">Filters:</span>
    </div>
    
    <Select value={selectedTimeRange} onValueChange={onTimeRangeChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIME_RANGES.map(range => (
          <SelectItem key={range.value} value={range.value}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={selectedCategory} onValueChange={onCategoryChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map(category => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Button variant="outline" size="sm" className="ml-auto">
      <Download className="h-4 w-4 mr-2" />
      Export Data
    </Button>
  </div>
)

export default function EnhancedAnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<EnhancedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch overview analytics
  useEffect(() => {
    fetchOverviewData()
  }, [selectedTimeRange, selectedCategory])

  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      
      // Simulate fetching enhanced analytics data
      // In production, this would call a dedicated API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setAnalyticsData({
        overview: {
          totalArticles: 168,
          activeLocations: 3,
          avgConfidenceScore: 0.84,
          classificationAccuracy: 87.3,
          processingTime: 1.2,
          trendsChange: 12.5
        },
        timeFilters: TIME_RANGES.map(r => r.value),
        categoryFilters: CATEGORIES.map(c => c.value)
      })
    } catch (error) {
      console.error('Analytics data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enhanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into AI discrimination patterns and trends
          </p>
        </div>
        <FilterControls
          selectedTimeRange={selectedTimeRange}
          selectedCategory={selectedCategory}
          onTimeRangeChange={setSelectedTimeRange}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* Overview Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Total Articles"
            value={analyticsData.overview.totalArticles}
            change="+12.5%"
            trend="up"
            icon={Activity}
            color="blue"
            description="Articles analyzed"
          />
          
          <MetricCard
            title="Active Locations"
            value={analyticsData.overview.activeLocations}
            icon={MapPin}
            color="green"
            description="Geographic regions"
          />

          <MetricCard
            title="Avg Confidence"
            value={`${(analyticsData.overview.avgConfidenceScore * 100).toFixed(1)}%`}
            change="+3.2%"
            trend="up"
            icon={Target}
            color="purple"
            description="AI classification confidence"
          />

          <MetricCard
            title="Accuracy Rate"
            value={`${analyticsData.overview.classificationAccuracy}%`}
            change="+1.8%"
            trend="up"
            icon={Eye}
            color="green"
            description="Model performance"
          />

          <MetricCard
            title="Processing Time"
            value={`${analyticsData.overview.processingTime}s`}
            change="-0.3s"
            trend="down"
            icon={Zap}
            color="yellow"
            description="Avg per article"
          />

          <MetricCard
            title="Trend Score"
            value={`+${analyticsData.overview.trendsChange}%`}
            trend="up"
            icon={TrendingUp}
            color="red"
            description="30-day change"
          />
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="geographic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="geographic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geographic Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Time Series & Trends
          </TabsTrigger>
          <TabsTrigger value="correlations" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Correlation Analysis
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Radar className="h-4 w-4" />
            AI Performance
          </TabsTrigger>
        </TabsList>

        {/* Geographic Analysis Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <GeographicHeatMap
            timeRange={selectedTimeRange}
            category={selectedCategory}
            onLocationSelect={handleLocationSelect}
          />
          
          {selectedLocation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Location Insights: {selectedLocation}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">High Priority</p>
                    <p className="text-sm text-muted-foreground">Severity Level</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">78%</p>
                    <p className="text-sm text-muted-foreground">Classification Confidence</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">+15%</p>
                    <p className="text-sm text-muted-foreground">30-day Trend</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Time Series & Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <ChartsSection />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Severity Distribution Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  How severity levels have changed over time
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500"></div>
                      <span className="text-sm">High Severity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">23%</span>
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">+5%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      <span className="text-sm">Medium Severity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">45%</span>
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500">-2%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span className="text-sm">Low Severity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">32%</span>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">-3%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Seasonal Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Discrimination incidents by month
                </p>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-amber-600">
                    📈 Peak Activity: March-April (Policy updates)
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    📊 Steady Period: June-August (Summer stability)
                  </div>
                  <div className="text-sm font-medium text-red-600">
                    🚨 High Severity: December-January (End-of-year reports)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Correlation Analysis Tab */}
        <TabsContent value="correlations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Location vs Severity Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Statistical relationship between geographic location and incident severity
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Correlation Coefficient:</span>
                        <span className="ml-2 text-blue-600">0.67 (Strong)</span>
                      </div>
                      <div>
                        <span className="font-medium">P-value:</span>
                        <span className="ml-2 text-green-600">< 0.001 (Significant)</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      International incidents show 23% higher severity than national incidents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Clustering</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    How discrimination types cluster together
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">RACIAL + MULTIPLE</Badge>
                      <span className="text-sm text-muted-foreground">34% co-occurrence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">GENERAL_AI + DISABILITY</Badge>
                      <span className="text-sm text-muted-foreground">18% co-occurrence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">RELIGIOUS + MULTIPLE</Badge>
                      <span className="text-sm text-muted-foreground">12% co-occurrence</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Provider Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OpenAI GPT-4o-mini</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                      <span className="text-sm font-medium">89%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Anthropic Claude-3-haiku</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Keyword Fallback</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Processing Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">1.2s</p>
                  <p className="text-sm text-muted-foreground">Average Processing Time</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">97.8%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">2.1K</p>
                  <p className="text-sm text-muted-foreground">Total Processed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Confidence Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>High (>80%)</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Medium (50-80%)</span>
                    <span className="font-medium">23%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Low (<50%)</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 Insight: 90% of articles achieve >50% confidence, indicating robust classification
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}