import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const initialFilters = [
  // Core discrimination terms
  { term: 'discrimination', category: 'discrimination', description: 'Core discrimination keyword' },
  { term: 'bias', category: 'discrimination', description: 'Bias-related content' },
  { term: 'prejudice', category: 'discrimination', description: 'Prejudice and discrimination' },
  { term: 'civil rights', category: 'civil-rights', description: 'Civil rights issues' },
  { term: 'equal opportunity', category: 'civil-rights', description: 'Equal opportunity and fairness' },
  
  // AI-specific terms
  { term: 'artificial intelligence', category: 'ai', description: 'AI-related content' },
  { term: 'machine learning', category: 'ai', description: 'Machine learning bias' },
  { term: 'algorithm', category: 'ai', description: 'Algorithmic discrimination' },
  { term: 'facial recognition', category: 'ai', description: 'Facial recognition bias' },
  
  // Employment discrimination
  { term: 'workplace discrimination', category: 'employment', description: 'Workplace discrimination' },
  { term: 'hiring bias', category: 'employment', description: 'Hiring and recruitment bias' },
  { term: 'equal pay', category: 'employment', description: 'Pay equity issues' },
  
  // Healthcare discrimination
  { term: 'healthcare bias', category: 'healthcare', description: 'Healthcare discrimination' },
  { term: 'medical bias', category: 'healthcare', description: 'Medical treatment bias' },
  
  // Housing discrimination
  { term: 'housing discrimination', category: 'housing', description: 'Housing and lending bias' },
  { term: 'redlining', category: 'housing', description: 'Housing redlining practices' },
  
  // Education discrimination
  { term: 'educational equity', category: 'education', description: 'Educational discrimination' },
  { term: 'school segregation', category: 'education', description: 'School segregation issues' },
  
  // Legal terms
  { term: 'Title VII', category: 'legal', description: 'Civil Rights Act Title VII' },
  { term: 'Americans with Disabilities Act', category: 'legal', description: 'ADA compliance' },
  { term: 'Fair Housing Act', category: 'legal', description: 'Fair housing violations' }
]

// POST /api/admin/content-filters/seed - Seed the database with initial filters
export async function POST(request: NextRequest) {
  try {
    // Clear existing filters
    await prisma.contentFilter.deleteMany({})
    
    // Create new filters
    const created = await prisma.contentFilter.createMany({
      data: initialFilters.map(filter => ({
        ...filter,
        isActive: true,
        matchCount: 0
      }))
    })
    
    // Verify filtering configuration exists
    let config = await prisma.filteringConfig.findFirst({
      where: { name: 'Default Filtering' }
    })
    
    if (!config) {
      config = await prisma.filteringConfig.create({
        data: {
          name: 'Default Filtering',
          isActive: false, // Start disabled for testing
          filterMode: 'OR',
          minTermLength: 3,
          caseSensitive: false
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${created.count} content filters`,
      filtersCreated: created.count,
      config: config
    })
    
  } catch (error) {
    console.error('Error seeding content filters:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed content filters',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}