'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle, MapPin, Globe, Building, Info, Loader } from 'lucide-react'

interface DashboardData {
  metrics: {
    totalArticles: number
    michiganArticles: number
    nationalArticles: number
    internationalArticles: number
    highSeverityArticles: number
    mediumSeverityArticles: number
    lowSeverityArticles: number
    activeFeeds: number
    successRate: number
    lastUpdated: string
  }
  trends: {
    michiganArticles: { change: number; percentage: number }
    nationalArticles: { change: number; percentage: number }
    internationalArticles: { change: number; percentage: number }
    highSeverityArticles: { change: number; percentage: number }
  }
}

// Metric configuration template
const metricTemplates = [
  {
    title: 'Michigan Incidents',
    key: 'michiganArticles',
    icon: MapPin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Last 30 days',
    info: 'AI discrimination incidents specifically occurring in Michigan. These are prioritized for immediate attention by local civil rights officials and advocates.',
    filter: { location: 'MICHIGAN' },
    filterLabel: 'Michigan incidents',
  },
  {
    title: 'National Incidents',
    key: 'nationalArticles',
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Last 30 days',
    info: 'AI discrimination incidents across the United States, including federal policy changes, nationwide corporate practices, and broader civil rights concerns.',
    filter: { location: 'NATIONAL' },
    filterLabel: 'National incidents',
  },
  {
    title: 'International',
    key: 'internationalArticles',
    icon: Globe,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Last 30 days',
    info: 'Global AI discrimination incidents that may influence U.S. policy, provide legal precedents, or represent emerging trends in AI governance worldwide.',
    filter: { location: 'INTERNATIONAL' },
    filterLabel: 'International incidents',
  },
  {
    title: 'High Severity',
    key: 'highSeverityArticles',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Requires attention',
    info: 'Critical incidents involving legal action, policy violations, or significant harm. These require immediate response from civil rights advocates, legal teams, and policymakers.',
    filter: { severity: 'HIGH' },
    filterLabel: 'High severity incidents',
  },
]

function MetricCard({ 
  template, 
  value, 
  trend 
}: { 
  template: typeof metricTemplates[0]
  value: number
  trend?: { change: number; percentage: number }
}) {
  const Icon = template.icon
  const trendDirection = trend && trend.percentage > 0 ? 'up' : 'down'
  const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown
  
  const handleCardClick = () => {
    // Scroll to articles section
    const articlesSection = document.getElementById('articles-section')
    if (articlesSection) {
      articlesSection.scrollIntoView({ behavior: 'smooth' })
    }
    
    // Apply filter based on metric
    const filterParams = new URLSearchParams()
    Object.entries(template.filter).forEach(([key, value]) => {
      if (value) {
        filterParams.set(key, value)
      }
    })
    const currentUrl = new URL(window.location.href)
    currentUrl.search = filterParams.toString()
    
    // Update URL without page reload
    window.history.pushState({}, '', currentUrl.toString())
    
    // Dispatch custom event to update filters
    window.dispatchEvent(new CustomEvent('applyFilter', { 
      detail: { 
        filter: template.filter, 
        label: template.filterLabel 
      } 
    }))
  }
  
  return (
    <Card 
      className="card-hover cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      aria-label={`View ${template.filterLabel} - ${value} articles`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {template.title}
          </CardTitle>
          <div className="group relative">
            <Info 
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" 
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking info icon
            />
            <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
              {template.info}
            </div>
          </div>
        </div>
        <div className={`p-2 rounded-full ${template.bgColor}`}>
          <Icon className={`h-4 w-4 ${template.color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
          {trend && trend.percentage !== 0 && (
            <Badge
              variant={trendDirection === 'up' ? 'destructive' : 'secondary'}
              className="flex items-center space-x-1"
            >
              <TrendIcon className="h-3 w-3" />
              <span className="text-xs">
                {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
              </span>
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {template.description}
        </p>
        <div className="mt-2 text-xs text-primary font-medium opacity-0 hover:opacity-100 transition-opacity duration-200">
          Click to view articles →
        </div>
      </CardContent>
    </Card>
  )
}

export function HeroMetrics() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/stats/summary?days=30')
        const result = await response.json()
        
        if (result.success) {
          setDashboardData(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch dashboard data')
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading dashboard metrics...</span>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <span className="ml-3 text-gray-600">
            {error || 'Failed to load dashboard data'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            AI Discrimination Monitoring Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time tracking of AI-related discrimination incidents across Michigan and beyond
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            Last updated: {new Date(dashboardData.metrics.lastUpdated).toLocaleString()}
          </p>
          <Badge variant="outline" className="mt-1">
            Live Data
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricTemplates.map((template, index) => {
          const value = dashboardData.metrics[template.key as keyof typeof dashboardData.metrics] as number
          const trend = dashboardData.trends[template.key as keyof typeof dashboardData.trends]
          
          return (
            <MetricCard 
              key={index} 
              template={template} 
              value={value}
              trend={trend}
            />
          )
        })}
      </div>
    </div>
  )
}