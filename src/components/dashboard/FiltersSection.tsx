import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Filter, Search } from 'lucide-react'

export function FiltersSection() {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Location
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
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
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
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
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
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
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              <Badge variant="secondary">
                Michigan
              </Badge>
              <Badge variant="secondary">
                High Severity
              </Badge>
              <button className="text-sm text-primary hover:text-primary/80">
                Clear all
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}