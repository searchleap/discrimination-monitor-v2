'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  AlertTriangle,
  Eye,
  Clock,
  Target,
  Filter
} from 'lucide-react'

interface AnalyticsData {
  totalArticles: number
  classificationType: Record<string, number>
  feedActivity: Array<{ feed: string; count: number }>
  timeSeriesData: Array<{ date: string; count: number; classification: string }>
  topKeywords: Array<{ keyword: string; frequency: number }>
  summary: {
    avgArticlesPerDay: number
    discriminationTrend: 'up' | 'down' | 'stable'
    mostActiveFeed: string
    confidenceScore: number
  }
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  description 
}: {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'stable'
  icon: any
  description?: string
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="h-6 w-6 text-gray-400" />
          {change && (
            <div className={`flex items-center mt-2 text-xs ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {change}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?days=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Unavailable</h3>
          <p className="text-gray-600">Unable to load analytics data. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Articles"
          value={analytics.totalArticles.toLocaleString()}
          change={`Avg ${analytics.summary.avgArticlesPerDay.toFixed(1)}/day`}
          icon={Eye}
          description="Articles monitored"
        />
        
        <MetricCard
          title="Discrimination Cases"
          value={analytics.classificationType.discrimination || 0}
          change={`${analytics.summary.discriminationTrend} trend`}
          trend={analytics.summary.discriminationTrend}
          icon={AlertTriangle}
          description="Classified as discrimination"
        />
        
        <MetricCard
          title="Active Feeds"
          value={analytics.feedActivity.length}
          icon={Target}
          description={`Top: ${analytics.summary.mostActiveFeed}`}
        />
        
        <MetricCard
          title="Confidence Score"
          value={`${(analytics.summary.confidenceScore * 100).toFixed(1)}%`}
          icon={TrendingUp}
          description="AI classification accuracy"
        />
      </div>

      {/* Classification Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Classification Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.classificationType).map(([type, count]) => {
                const percentage = ((count / analytics.totalArticles) * 100).toFixed(1)
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        type === 'discrimination' ? 'bg-red-500' :
                        type === 'bias' ? 'bg-orange-500' :
                        type === 'fairness' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{count}</span>
                      <span className="text-sm text-gray-600 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Feed Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.feedActivity.slice(0, 5).map((feed) => {
                const percentage = ((feed.count / analytics.totalArticles) * 100).toFixed(1)
                return (
                  <div key={feed.feed} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {feed.feed}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <span className="text-sm font-bold text-gray-900">{feed.count}</span>
                      <span className="text-xs text-gray-600 block">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keywords Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Trending Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analytics.topKeywords.slice(0, 20).map((keyword) => (
              <Badge 
                key={keyword.keyword} 
                variant="secondary" 
                className="flex items-center gap-1"
              >
                {keyword.keyword}
                <span className="text-xs opacity-70">({keyword.frequency})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline (Last {timeRange} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analytics.timeSeriesData.slice(-10).map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.count} articles</Badge>
                  <Badge 
                    className={
                      item.classification === 'discrimination' ? 'bg-red-100 text-red-800' :
                      item.classification === 'bias' ? 'bg-orange-100 text-orange-800' :
                      item.classification === 'fairness' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {item.classification}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}