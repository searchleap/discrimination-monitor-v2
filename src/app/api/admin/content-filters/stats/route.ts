import { NextRequest, NextResponse } from 'next/server'
import { contentFilterMatcher } from '@/lib/content-filter'

// GET /api/admin/content-filters/stats - Get filtering statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await contentFilterMatcher.getStatistics()

    return NextResponse.json({
      ...stats,
      summary: {
        isActive: stats.config?.isActive || false,
        filterMode: stats.config?.filterMode || 'OR',
        totalArticlesProcessed: stats.articlesAccepted + stats.articlesFiltered,
        filteringRate: stats.articlesFiltered > 0 
          ? ((stats.articlesFiltered / (stats.articlesAccepted + stats.articlesFiltered)) * 100).toFixed(1)
          : '0.0',
        avgMatchesPerFilter: stats.activeFilters > 0 
          ? (stats.totalMatches / stats.activeFilters).toFixed(1)
          : '0.0'
      }
    })
  } catch (error) {
    console.error('Error fetching filtering statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filtering statistics' },
      { status: 500 }
    )
  }
}