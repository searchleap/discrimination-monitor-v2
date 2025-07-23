'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface ArticleFilters {
  search: string
  location: string
  discriminationType: string
  severity: string
  dateRange: string
  source: string
}

const defaultFilters: ArticleFilters = {
  search: '',
  location: '',
  discriminationType: '',
  severity: '',
  dateRange: '30',
  source: ''
}

export function useArticleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL parameters with safe fallback
  const [filters, setFilters] = useState<ArticleFilters>(() => {
    // Handle case where searchParams might be null during SSR
    if (!searchParams) {
      return defaultFilters
    }
    
    return {
      search: searchParams.get('search') || defaultFilters.search,
      location: searchParams.get('location') || defaultFilters.location,
      discriminationType: searchParams.get('type') || defaultFilters.discriminationType,
      severity: searchParams.get('severity') || defaultFilters.severity,
      dateRange: searchParams.get('days') || defaultFilters.dateRange,
      source: searchParams.get('source') || defaultFilters.source
    }
  })

  // Update URL when filters change
  const updateURL = useCallback((newFilters: ArticleFilters) => {
    // Skip URL updates during SSR or if window is not available
    if (typeof window === 'undefined') {
      return
    }
    
    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== defaultFilters[key as keyof ArticleFilters]) {
        // Map internal filter names to URL parameter names
        const paramName = key === 'discriminationType' ? 'type' : 
                         key === 'dateRange' ? 'days' : key
        params.set(paramName, value)
      }
    })

    const queryString = params.toString()
    const newURL = queryString ? `?${queryString}` : window.location.pathname
    
    // Use replace to avoid cluttering browser history
    window.history.replaceState({}, '', newURL)
  }, [])

  // Update a single filter
  const updateFilter = useCallback((key: keyof ArticleFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  // Update multiple filters at once
  const updateFilters = useCallback((updates: Partial<ArticleFilters>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    updateURL(defaultFilters)
  }, [updateURL])

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    value !== defaultFilters[key as keyof ArticleFilters]
  )

  // Get active filter labels for display
  const getActiveFilterLabels = useCallback(() => {
    const labels: string[] = []
    
    if (filters.search) labels.push(`Search: "${filters.search}"`)
    if (filters.location) labels.push(`Location: ${filters.location.charAt(0).toUpperCase() + filters.location.slice(1)}`)
    if (filters.discriminationType) labels.push(`Type: ${filters.discriminationType.replace(/_/g, ' ')}`)
    if (filters.severity) labels.push(`Severity: ${filters.severity.charAt(0).toUpperCase() + filters.severity.slice(1)}`)
    if (filters.dateRange && filters.dateRange !== '30') {
      const days = parseInt(filters.dateRange)
      labels.push(`Last ${days} day${days !== 1 ? 's' : ''}`)
    }
    if (filters.source) labels.push(`Source: ${filters.source}`)
    
    return labels
  }, [filters])

  // Create API query parameters from filters
  const getAPIParams = useCallback(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.location) params.append('location', filters.location) // Send as-is, API will handle mapping
    if (filters.discriminationType) params.append('discriminationType', filters.discriminationType) // Send as-is, API will handle mapping
    if (filters.severity) params.append('severity', filters.severity) // Send as-is, API will handle mapping
    if (filters.dateRange) params.append('days', filters.dateRange)
    if (filters.source) params.append('source', filters.source)
    
    return params
  }, [filters])

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    getActiveFilterLabels,
    getAPIParams
  }
}