import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-sm text-gray-600">
              Real-time monitoring system for tracking AI-related discrimination incidents 
              affecting disability, racial, religious communities, and general AI discrimination concerns.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm text-gray-600 hover:text-primary">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-sm text-gray-600 hover:text-primary">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm text-gray-600 hover:text-primary">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-sm text-gray-600 hover:text-primary">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">
            © 2025 Perceptint, LLC. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2 sm:mt-0">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </footer>
  )
}