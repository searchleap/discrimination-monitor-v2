import { Suspense } from 'react'
import { AdminPanel } from '@/components/dashboard/AdminPanel'
import { Loading } from '@/components/ui/Loading'

export const metadata = {
  title: 'Admin - Discrimination Monitor',
  description: 'System administration and configuration management',
}

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Administration</h1>
        <p className="text-gray-600">
          Manage system settings, RSS feeds, data sources, and monitoring configuration.
        </p>
      </div>
      
      <Suspense fallback={<Loading />}>
        <AdminPanel />
      </Suspense>
    </div>
  )
}