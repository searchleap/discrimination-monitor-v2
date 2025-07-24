import { Suspense } from 'react'
import { ArticleManagement } from '@/components/dashboard/ArticleManagement'
import { Loading } from '@/components/ui/Loading'

export const metadata = {
  title: 'Articles - Discrimination Monitor',
  description: 'Manage and review discrimination-related articles',
}

export default function ArticlesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Article Management</h1>
        <p className="text-gray-600">
          Review, classify, and manage AI-related discrimination articles from monitored sources.
        </p>
      </div>
      
      <Suspense fallback={<Loading />}>
        <ArticleManagement />
      </Suspense>
    </div>
  )
}