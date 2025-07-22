import { Inter } from 'next/font/google'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Database, Home, Rss, Settings } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen bg-background ${inter.className}`}>
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                <Home className="w-5 h-5" />
                Admin Panel
              </Link>
              <nav className="flex items-center space-x-6">
                <Link 
                  href="/admin/ai" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  AI Management
                </Link>
                <Link 
                  href="/admin/feeds" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Feed Management
                </Link>
                <Link 
                  href="/admin/system" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  System Status
                </Link>
              </nav>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <main>{children}</main>
    </div>
  )
}