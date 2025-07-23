import { Suspense } from 'react'
import { HeroMetrics } from '@/components/dashboard/HeroMetrics'
import { ChartsSection } from '@/components/dashboard/ChartsSection'
import { FiltersSection } from '@/components/dashboard/FiltersSection'
import { ArticleGrid } from '@/components/dashboard/ArticleGrid'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <section className="animate-fadeIn">
        <Suspense fallback={<LoadingSpinner />}>
          <HeroMetrics />
        </Suspense>
      </section>

      {/* Interactive Charts */}
      <section className="animate-fadeIn">
        <Suspense fallback={<LoadingSpinner />}>
          <ChartsSection />
        </Suspense>
      </section>

      {/* Filters */}
      <section className="animate-fadeIn">
        <Suspense fallback={<LoadingSpinner />}>
          <FiltersSection />
        </Suspense>
      </section>

      {/* Article Grid */}
      <section className="animate-fadeIn">
        <Suspense fallback={<LoadingSpinner />}>
          <ArticleGrid />
        </Suspense>
      </section>
    </div>
  )
}