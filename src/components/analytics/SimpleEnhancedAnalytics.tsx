'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, BarChart3, MapPin } from 'lucide-react'
import GeographicHeatMap from './GeographicHeatMap'
import { ChartsSection } from '../dashboard/ChartsSection'

export default function SimpleEnhancedAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

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
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">168</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Locations</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">84%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="geographic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2">
          <TabsTrigger value="geographic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geographic Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Time Series & Trends
          </TabsTrigger>
        </TabsList>

        {/* Geographic Analysis Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <GeographicHeatMap
            timeRange={selectedTimeRange}
            category={selectedCategory}
          />
        </TabsContent>

        {/* Time Series & Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <ChartsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}