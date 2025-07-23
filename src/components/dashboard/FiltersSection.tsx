'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Filter, Search, X } from 'lucide-react'
import { useArticleFilters } from '@/hooks/useArticleFilters'

export function FiltersSection() {
  const { 
    filters, 
    updateFilter, 
    clearFilters, 
    hasActiveFilters, 
    getActiveFilterLabels 
  } = useArticleFilters()

  const activeLabels = getActiveFilterLabels()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Filter & Search
        </h2>
        <Badge variant="outline">
          Advanced Filters
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Location
              </label>
              <select 
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Locations</option>
                <option value="michigan">Michigan</option>
                <option value="national">National</option>
                <option value="international">International</option>
              </select>
            </div>

            {/* Discrimination Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Type
              </label>
              <select 
                value={filters.discriminationType}
                onChange={(e) => updateFilter('discriminationType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="racial">Racial</option>
                <option value="religious">Religious</option>
                <option value="disability">Disability</option>
                <option value="general_ai">General AI</option>
                <option value="multiple">Multiple</option>
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Severity
              </label>
              <select 
                value={filters.severity}
                onChange={(e) => updateFilter('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Severity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Date Range
              </label>
              <select 
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Source
              </label>
              <input
                type="text"
                placeholder="Filter by source..."
                value={filters.source}
                onChange={(e) => updateFilter('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {activeLabels.map((label, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {label}
                  </Badge>
                ))}
                <button 
                  onClick={clearFilters}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}