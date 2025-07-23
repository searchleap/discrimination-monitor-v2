import { NextRequest, NextResponse } from 'next/server'
import { contentFilterMatcher } from '@/lib/content-filter'
import { z } from 'zod'

// Schema for testing content filters
const testFilterSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1)
})

// POST /api/admin/content-filters/test - Test filtering logic with sample text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content } = testFilterSchema.parse(body)

    const testResult = await contentFilterMatcher.testFilters(title, content)

    return NextResponse.json({
      input: { title, content },
      result: testResult.result,
      filterDetails: testResult.filterDetails,
      metadata: {
        textLength: (title + ' ' + content).length,
        testTimestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error testing content filters:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid test data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to test content filters' },
      { status: 500 }
    )
  }
}