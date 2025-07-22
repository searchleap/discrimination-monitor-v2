'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import { MapPin, TrendingUp, Globe } from 'lucide-react'

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@3/world-110m.json"

interface GeographicData {
  locations: Array<{
    id: string
    name: string
    code: string
    coordinates?: [number, number]
    value: number
    articles: number
    severity: {
      high: number
      medium: number
      low: number
    }
    categories: Array<{
      type: string
      count: number
    }>
  }>
  summary: {
    totalArticles: number
    totalLocations: number
    topLocation: string
    dateRange: {
      start: string
      end: string
    }
  }
}

interface GeographicHeatMapProps {
  timeRange?: string
  category?: string
  onLocationSelect?: (location: string) => void
}

export default function GeographicHeatMap({ 
  timeRange = '30',
  category = 'ALL',
  onLocationSelect
}: GeographicHeatMapProps) {
  const [data, setData] = useState<GeographicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch geographic data
  useEffect(() => {
    fetchGeographicData()
  }, [timeRange, category])

  const fetchGeographicData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        days: timeRange,
        ...(category !== 'ALL' && { category })
      })
      
      const response = await fetch(`/api/analytics/geographic?${params}`)
      if (!response.ok) throw new Error('Failed to fetch data')
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Geographic data fetch error:', err)
      setError('Failed to load geographic data')
    } finally {
      setLoading(false)
    }
  }

  // Create color scale for markers
  const getColorScale = () => {
    if (!data || data.locations.length === 0) return () => '#94a3b8'
    
    const maxValue = Math.max(...data.locations.map(loc => loc.articles))
    const minValue = Math.min(...data.locations.map(loc => loc.articles))
    
    return scaleLinear<string>()
      .domain([minValue, maxValue])
      .range(['#3b82f6', '#dc2626'])
  }

  const colorScale = getColorScale()

  const getMarkerSize = (articles: number) => {
    if (!data) return 8
    const maxValue = Math.max(...data.locations.map(loc => loc.articles))
    const minSize = 8
    const maxSize = 24
    return minSize + ((articles / maxValue) * (maxSize - minSize))
  }

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500', 
      low: 'bg-green-500'
    }
    return colors[severity]
  }

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location.id)
    onLocationSelect?.(location.id)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{error || 'Failed to load geographic data'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedLocationData = data.locations.find(loc => loc.id === selectedLocation)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{data.summary.totalArticles}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Locations</p>
                <p className="text-2xl font-bold">{data.summary.totalLocations}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Location</p>
                <p className="text-lg font-semibold truncate">{data.summary.topLocation}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Location</p>
                <p className="text-2xl font-bold">
                  {Math.round(data.summary.totalArticles / data.summary.totalLocations)}
                </p>
              </div>
              <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-red-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click markers to see detailed breakdowns
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <ComposableMap
                projection="geoNaturalEarth1"
                className="w-full h-96"
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#f1f5f9"
                        stroke="#e2e8f0"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "#e2e8f0" },
                          pressed: { outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>
                
                {/* Location Markers */}
                {data.locations
                  .filter(location => location.coordinates)
                  .map((location) => (
                    <Marker
                      key={location.id}
                      coordinates={location.coordinates!}
                      onClick={() => handleLocationClick(location)}
                    >
                      <circle
                        r={getMarkerSize(location.articles)}
                        fill={colorScale(location.articles)}
                        stroke="#fff"
                        strokeWidth={2}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <text
                        textAnchor="middle"
                        y={getMarkerSize(location.articles) + 20}
                        className="fill-gray-700 text-sm font-medium pointer-events-none"
                      >
                        {location.name}
                      </text>
                    </Marker>
                  ))
                }
              </ComposableMap>
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            {selectedLocationData ? (
              <p className="text-sm text-muted-foreground">
                {selectedLocationData.name}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a location to see details
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {selectedLocationData ? (
              <>
                {/* Articles Count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Articles</span>
                  <Badge variant="secondary">{selectedLocationData.articles}</Badge>
                </div>

                {/* Severity Breakdown */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Severity Distribution</p>
                  {(['high', 'medium', 'low'] as const).map(severity => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${getSeverityColor(severity)}`} />
                        <span className="text-sm capitalize">{severity}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {selectedLocationData.severity[severity]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Category Breakdown */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Top Categories</p>
                  {selectedLocationData.categories.slice(0, 5).map(category => (
                    <div key={category.type} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {category.type.replace('_', ' ')}
                      </span>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* Show top locations when none selected */}
                <p className="text-sm font-medium">Top Locations</p>
                {data.locations
                  .sort((a, b) => b.articles - a.articles)
                  .slice(0, 5)
                  .map(location => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleLocationClick(location)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: colorScale(location.articles) }}
                        />
                        <span className="text-sm">{location.name}</span>
                      </div>
                      <Badge variant="secondary">{location.articles}</Badge>
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}