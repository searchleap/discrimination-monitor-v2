import { Suspense } from 'react'
import SimpleEnhancedAnalytics from '@/components/analytics/SimpleEnhancedAnalytics'
import { Loading } from '@/components/ui/Loading'

export const metadata = {
  title: 'Enhanced Analytics - Discrimination Monitor',
  description: 'Deep analytics and insights into discrimination patterns, trends, and geographic distribution.',
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SimpleEnhancedAnalytics />
    </Suspense>
  )
}