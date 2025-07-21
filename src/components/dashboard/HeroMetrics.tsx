'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle, MapPin, Globe, Building, Info } from 'lucide-react'

// Mock data - will be replaced with real data from API
const metrics = [
  {
    title: 'Michigan Incidents',
    value: '12',
    change: '+15%',
    trend: 'up',
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
    value: '45',
    change: '+8%',
    trend: 'up',
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
    value: '23',
    change: '-3%',
    trend: 'down',
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
    value: '8',
    change: '+2',
    trend: 'up',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Requires attention',
    info: 'Critical incidents involving legal action, policy violations, or significant harm. These require immediate response from civil rights advocates, legal teams, and policymakers.',
    filter: { severity: 'HIGH' },
    filterLabel: 'High severity incidents',
  },
]

function MetricCard({ metric }: { metric: typeof metrics[0] }) {
  const Icon = metric.icon
  const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown
  
  const handleCardClick = () => {
    // Scroll to articles section
    const articlesSection = document.getElementById('articles-section')
    if (articlesSection) {
      articlesSection.scrollIntoView({ behavior: 'smooth' })
    }
    
    // Apply filter based on metric
    const filterParams = new URLSearchParams()
    Object.entries(metric.filter).forEach(([key, value]) => {
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
        filter: metric.filter, 
        label: metric.filterLabel 
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
      aria-label={`View ${metric.filterLabel} - ${metric.value} articles`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {metric.title}
          </CardTitle>
          <div className="group relative">
            <Info 
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" 
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking info icon
            />
            <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
              {metric.info}
            </div>
          </div>
        </div>
        <div className={`p-2 rounded-full ${metric.bgColor}`}>
          <Icon className={`h-4 w-4 ${metric.color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-gray-900">
            {metric.value}
          </div>
          <Badge
            variant={metric.trend === 'up' ? 'destructive' : 'secondary'}
            className="flex items-center space-x-1"
          >
            <TrendIcon className="h-3 w-3" />
            <span className="text-xs">{metric.change}</span>
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {metric.description}
        </p>
        <div className="mt-2 text-xs text-primary font-medium opacity-0 hover:opacity-100 transition-opacity duration-200">
          Click to view articles →
        </div>
      </CardContent>
    </Card>
  )
}

export function HeroMetrics() {
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
            Last updated: {new Date().toLocaleString()}
          </p>
          <Badge variant="outline" className="mt-1">
            Live Data
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
    </div>
  )
}