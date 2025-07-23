import { prisma } from './prisma'
import type { ContentFilter, FilteringConfig, FilterMode } from '@prisma/client'

export interface FilterResult {
  shouldStore: boolean
  matchedFilters: string[]
  reason: string
}

export class ContentFilterMatcher {
  private filters: ContentFilter[]
  private config: FilteringConfig | null
  private lastUpdated: Date | null = null
  
  constructor() {
    this.filters = []
    this.config = null
  }

  /**
   * Load active filters and configuration from database
   */
  async loadFilters(): Promise<void> {
    try {
      // Load active filters
      this.filters = await prisma.contentFilter.findMany({
        where: { isActive: true },
        orderBy: { term: 'asc' }
      })

      // Load active configuration
      this.config = await prisma.filteringConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })

      this.lastUpdated = new Date()
      
      console.log(`📚 Loaded ${this.filters.length} active content filters with mode: ${this.config?.filterMode || 'disabled'}`)
    } catch (error) {
      console.error('❌ Error loading content filters:', error)
      // Set safe defaults on error
      this.filters = []
      this.config = null
    }
  }

  /**
   * Check if an article should be stored based on content filters
   */
  async shouldStoreArticle(title: string, content: string): Promise<FilterResult> {
    // Reload filters if they haven't been loaded or are stale (1 minute for responsiveness)
    if (!this.lastUpdated || Date.now() - this.lastUpdated.getTime() > 60 * 1000) {
      await this.loadFilters()
    }

    // If filtering is disabled or no filters exist, allow all articles
    if (!this.config?.isActive || this.filters.length === 0) {
      return {
        shouldStore: true,
        matchedFilters: [],
        reason: this.config?.isActive === false 
          ? 'Filtering disabled' 
          : 'No active filters'
      }
    }

    const combinedText = `${title} ${content}`
    const textToSearch = this.config.caseSensitive ? combinedText : combinedText.toLowerCase()
    
    const matchedFilters: string[] = []
    
    // Check each filter
    for (const filter of this.filters) {
      if (this.matchesFilter(textToSearch, filter)) {
        matchedFilters.push(filter.term)
        
        // Update match count asynchronously (don't await to avoid slowing down processing)
        this.updateMatchCount(filter.id).catch(error => 
          console.warn(`Failed to update match count for filter ${filter.id}:`, error)
        )
      }
    }

    // Determine if article should be stored based on filter mode
    let shouldStore = false
    let reason = ''

    if (this.config.filterMode === 'OR') {
      shouldStore = matchedFilters.length > 0
      reason = shouldStore 
        ? `Matched ${matchedFilters.length} filter(s): ${matchedFilters.slice(0, 3).join(', ')}${matchedFilters.length > 3 ? '...' : ''}`
        : 'No filters matched (OR mode)'
    } else if (this.config.filterMode === 'AND') {
      shouldStore = matchedFilters.length === this.filters.length
      reason = shouldStore
        ? `All ${this.filters.length} filters matched`
        : `Only ${matchedFilters.length}/${this.filters.length} filters matched (AND mode)`
    }

    // Update statistics asynchronously
    this.updateStatistics(shouldStore).catch(error =>
      console.warn('Failed to update filtering statistics:', error)
    )

    return {
      shouldStore,
      matchedFilters,
      reason
    }
  }

  /**
   * Check if text matches a specific filter
   */
  private matchesFilter(text: string, filter: ContentFilter): boolean {
    const term = this.config?.caseSensitive ? filter.term : filter.term.toLowerCase()
    
    // Simple contains check - can be enhanced with regex support later
    return text.includes(term)
  }

  /**
   * Update match count for a filter
   */
  private async updateMatchCount(filterId: string): Promise<void> {
    await prisma.contentFilter.update({
      where: { id: filterId },
      data: { 
        matchCount: { increment: 1 },
        updatedAt: new Date()
      }
    })
  }

  /**
   * Update filtering statistics
   */
  private async updateStatistics(articleAccepted: boolean): Promise<void> {
    if (!this.config) return

    const updateData = articleAccepted 
      ? { articlesAccepted: { increment: 1 } }
      : { articlesFiltered: { increment: 1 } }

    await prisma.filteringConfig.update({
      where: { id: this.config.id },
      data: {
        ...updateData,
        lastApplied: new Date(),
        updatedAt: new Date()
      }
    })
  }

  /**
   * Get current filtering statistics
   */
  async getStatistics(): Promise<{
    config: FilteringConfig | null
    activeFilters: number
    totalMatches: number
    articlesAccepted: number
    articlesFiltered: number
    filterList: Array<{
      id: string
      term: string
      category: string | null
      matchCount: number
      isActive: boolean
    }>
  }> {
    await this.loadFilters()

    const totalMatches = this.filters.reduce((sum, filter) => sum + filter.matchCount, 0)

    return {
      config: this.config,
      activeFilters: this.filters.length,
      totalMatches,
      articlesAccepted: this.config?.articlesAccepted || 0,
      articlesFiltered: this.config?.articlesFiltered || 0,
      filterList: this.filters.map(filter => ({
        id: filter.id,
        term: filter.term,
        category: filter.category,
        matchCount: filter.matchCount,
        isActive: filter.isActive
      }))
    }
  }

  /**
   * Test filtering logic with sample text
   */
  async testFilters(title: string, content: string): Promise<{
    result: FilterResult
    filterDetails: Array<{
      term: string
      matched: boolean
      category: string | null
    }>
  }> {
    const result = await this.shouldStoreArticle(title, content)
    
    const combinedText = `${title} ${content}`
    const textToSearch = this.config?.caseSensitive ? combinedText : combinedText.toLowerCase()
    
    const filterDetails = this.filters.map(filter => ({
      term: filter.term,
      matched: this.matchesFilter(textToSearch, filter),
      category: filter.category
    }))

    return {
      result,
      filterDetails
    }
  }
}

// Singleton instance for use across the application
export const contentFilterMatcher = new ContentFilterMatcher()