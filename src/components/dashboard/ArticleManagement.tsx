'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, ExternalLink, Filter, Search, Calendar, Tag, AlertTriangle } from 'lucide-react'
import { useArticleFilters } from '@/hooks/useArticleFilters'

interface Article {
  id: string
  title: string
  summary: string
  url: string
  publishedAt: string
  source: string
  discriminationType: string
  confidenceScore: number | null
  createdAt: string
}

const classificationColors = {
  'racial': 'bg-red-100 text-red-800',
  'disability': 'bg-purple-100 text-purple-800',
  'religious': 'bg-orange-100 text-orange-800',
  'general_ai': 'bg-blue-100 text-blue-800',
  'gender': 'bg-pink-100 text-pink-800',
  'age': 'bg-yellow-100 text-yellow-800',
  'neutral': 'bg-gray-100 text-gray-800'
}

export function ArticleManagement() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [feeds, setFeeds] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState(0)
  
  const { filters, updateFilter, getAPIParams } = useArticleFilters()

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const apiParams = getAPIParams()
      apiParams.append('limit', '100') // Show more articles in management view
      apiParams.append('sortBy', 'publishedAt')
      apiParams.append('sortOrder', 'desc')

      const response = await fetch(`/api/articles?${apiParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data.data || [])
        setTotalCount(data.pagination?.total || data.data?.length || 0)
      }
    } catch (error) {
      // Handle fetch error silently
    } finally {
      setLoading(false)
    }
  }, [getAPIParams])

  useEffect(() => {
    fetchArticles()
    fetchFeeds()
  }, [fetchArticles, filters])

  const fetchFeeds = async () => {
    try {
      // Fetch real sources from articles
      const response = await fetch('/api/articles?limit=1000') // Get all to extract unique sources
      if (response.ok) {
        const data = await response.json()
        const sources = data.data?.map((article: Article) => article.source).filter(Boolean) || []
        const uniqueSources = Array.from(new Set(sources)) as string[]
        setFeeds(uniqueSources.sort())
      }
    } catch (error) {
      // Handle feeds fetch error silently - fallback to empty array
      setFeeds([])
    }
  }

  const handleClassificationUpdate = async (articleId: string, classification: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classification })
      })

      if (response.ok) {
        // Refresh articles
        fetchArticles()
      }
    } catch (error) {
      // Handle classification update error silently
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Filter & Search Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filter & Search</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Advanced Filters
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Filter Options Toggle */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Filter Options</span>
          </div>
          
          {/* Filter Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search articles..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <Select value={filters.location || "all"} onValueChange={(value) => updateFilter('location', value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="michigan">Michigan</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select value={filters.discriminationType || "all"} onValueChange={(value) => updateFilter('discriminationType', value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="racial">Racial</SelectItem>
                  <SelectItem value="disability">Disability</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                  <SelectItem value="general_ai">General AI</SelectItem>
                  <SelectItem value="multiple">Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Severity</label>
              <Select value={filters.severity || "all"} onValueChange={(value) => updateFilter('severity', value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Source</label>
              <Input
                placeholder="Filter by source..."
                value={filters.source}
                onChange={(e) => updateFilter('source', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Articles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Articles</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {Math.min(articles.length, 50)} of {totalCount} articles
            </span>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              All Articles
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading articles...</span>
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later for new articles.</p>
              </CardContent>
            </Card>
          ) : (
            articles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(article.publishedAt)}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-600 line-clamp-3">{article.summary}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{article.source}</Badge>
                          {article.discriminationType && (
                            <Badge 
                              className={classificationColors[article.discriminationType.toLowerCase() as keyof typeof classificationColors] || 'bg-gray-100 text-gray-800'}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {article.discriminationType}
                              {article.confidenceScore && (
                                <span className="ml-1 text-xs">
                                  ({Math.round(article.confidenceScore * 100)}%)
                                </span>
                              )}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Select 
                            value={article.discriminationType || 'neutral'} 
                            onValueChange={(value) => handleClassificationUpdate(article.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RACIAL">Racial</SelectItem>
                              <SelectItem value="DISABILITY">Disability</SelectItem>
                              <SelectItem value="RELIGIOUS">Religious</SelectItem>
                              <SelectItem value="GENDER">Gender</SelectItem>
                              <SelectItem value="AGE">Age</SelectItem>
                              <SelectItem value="GENERAL_AI">General AI</SelectItem>
                              <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button size="sm" variant="outline" asChild>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Load More */}
      {articles.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={fetchArticles}>
            <Eye className="h-4 w-4 mr-2" />
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  )
}