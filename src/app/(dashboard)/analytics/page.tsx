import { Suspense } from 'react'
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'
import { Loading } from '@/components/ui/Loading'

export const metadata = {
  title: 'Analytics - AI Discrimination Monitor',
  description: 'View detailed analytics and trends for AI discrimination monitoring',
}

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive analytics and insights on AI discrimination trends and patterns.
        </p>
      </div>
      
      <Suspense fallback={<Loading />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}