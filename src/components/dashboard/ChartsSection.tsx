import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ChartsSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Trends & Analytics
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Incident Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Timeline chart will be implemented here</p>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Category breakdown chart will be implemented here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}