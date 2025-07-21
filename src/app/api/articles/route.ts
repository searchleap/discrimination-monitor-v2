import { NextRequest, NextResponse } from 'next/server'
import { Article } from '@/types'
import { formatDate } from '@/lib/utils'

// Mock article data - will be replaced with database queries
const mockArticles: Article[] = [
  {
    id: 'art-1',
    title: 'AI Hiring Tool Shows Bias Against Disability Applicants in Michigan',
    content: 'A major tech company\'s AI-powered hiring system has been found to discriminate against candidates with disabilities, particularly affecting applicants in Michigan. The system, used by several large employers in the Detroit area, was flagging resumes that mentioned disability accommodations or contained gaps in employment history often associated with disability-related challenges.',
    summary: 'A major tech company\'s AI-powered hiring system has been found to discriminate against candidates with disabilities, particularly affecting applicants in Michigan.',
    url: 'https://example.com/ai-hiring-bias-michigan',
    publishedAt: new Date('2025-01-08T14:30:00Z'),
    source: 'Michigan Tech News',
    feedId: 'feed-1',
    location: 'MICHIGAN',
    discriminationType: 'DISABILITY',
    severity: 'HIGH',
    organizations: ['TechCorp', 'Michigan Department of Civil Rights'],
    keywords: ['hiring', 'AI bias', 'disability discrimination', 'employment'],
    entities: {
      locations: ['Michigan', 'Detroit'],
      people: [],
      organizations: ['TechCorp', 'Michigan Department of Civil Rights']
    },
    processed: true,
    processingError: null,
    confidenceScore: 0.92,
    aiClassification: {
      model: 'gpt-4o-mini',
      timestamp: '2025-01-08T15:00:00Z',
      reasoning: 'Article specifically mentions Michigan, disability discrimination, and hiring bias'
    },
    createdAt: new Date('2025-01-08T14:35:00Z'),
    updatedAt: new Date('2025-01-08T15:00:00Z'),
  },
  {
    id: 'art-2',
    title: 'Religious Group Files Complaint Over AI Content Moderation',
    content: 'A religious organization has filed a complaint alleging that AI content moderation systems are unfairly targeting their religious content on social media platforms. The complaint suggests that the algorithm flags religious discussions as potentially harmful or controversial, leading to reduced visibility and engagement.',
    summary: 'A religious organization has filed a complaint alleging that AI content moderation systems are unfairly targeting their religious content.',
    url: 'https://example.com/religious-ai-moderation',
    publishedAt: new Date('2025-01-08T10:15:00Z'),
    source: 'Civil Rights Today',
    feedId: 'feed-2',
    location: 'NATIONAL',
    discriminationType: 'RELIGIOUS',
    severity: 'MEDIUM',
    organizations: ['Faith Coalition', 'Social Media Platform'],
    keywords: ['content moderation', 'religious discrimination', 'AI bias', 'social media'],
    entities: {
      locations: ['United States'],
      people: [],
      organizations: ['Faith Coalition', 'Social Media Platform']
    },
    processed: true,
    processingError: null,
    confidenceScore: 0.85,
    aiClassification: {
      model: 'gpt-4o-mini',
      timestamp: '2025-01-08T10:30:00Z',
      reasoning: 'National scope, religious discrimination, moderate severity'
    },
    createdAt: new Date('2025-01-08T10:20:00Z'),
    updatedAt: new Date('2025-01-08T10:30:00Z'),
  },
  {
    id: 'art-3',
    title: 'Study Reveals Racial Bias in AI Medical Diagnosis Tools',
    content: 'New research shows that AI diagnostic tools used in healthcare show significant racial bias, potentially affecting patient care quality. The study examined multiple AI systems used in radiology and pathology, finding that they performed less accurately for patients from minority backgrounds.',
    summary: 'New research shows that AI diagnostic tools used in healthcare show significant racial bias, potentially affecting patient care quality.',
    url: 'https://example.com/racial-bias-medical-ai',
    publishedAt: new Date('2025-01-07T16:45:00Z'),
    source: 'Healthcare AI Journal',
    feedId: 'feed-3',
    location: 'INTERNATIONAL',
    discriminationType: 'RACIAL',
    severity: 'HIGH',
    organizations: ['Medical AI Institute', 'Healthcare Coalition'],
    keywords: ['medical AI', 'racial bias', 'healthcare discrimination', 'diagnosis'],
    entities: {
      locations: ['International'],
      people: [],
      organizations: ['Medical AI Institute', 'Healthcare Coalition']
    },
    processed: true,
    processingError: null,
    confidenceScore: 0.88,
    aiClassification: {
      model: 'gpt-4o-mini',
      timestamp: '2025-01-07T17:00:00Z',
      reasoning: 'International scope, racial discrimination in healthcare, high severity'
    },
    createdAt: new Date('2025-01-07T16:50:00Z'),
    updatedAt: new Date('2025-01-07T17:00:00Z'),
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const discriminationType = searchParams.get('discriminationType')
    const severity = searchParams.get('severity')
    const search = searchParams.get('search')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Filter articles based on query parameters
    let filteredArticles = mockArticles

    if (location) {
      filteredArticles = filteredArticles.filter(article => 
        article.location === location
      )
    }

    if (discriminationType) {
      filteredArticles = filteredArticles.filter(article => 
        article.discriminationType === discriminationType
      )
    }

    if (severity) {
      filteredArticles = filteredArticles.filter(article => 
        article.severity === severity
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        article.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
    }

    if (source) {
      filteredArticles = filteredArticles.filter(article => 
        article.source === source
      )
    }

    // Sort articles
    filteredArticles.sort((a, b) => {
      let aValue = a[sortBy as keyof Article]
      let bValue = b[sortBy as keyof Article]

      if (sortBy === 'publishedAt' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })

    // Paginate results
    const paginatedArticles = filteredArticles.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedArticles,
      pagination: {
        total: filteredArticles.length,
        limit,
        offset,
        hasMore: offset + limit < filteredArticles.length
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.content || !body.url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, url' },
        { status: 400 }
      )
    }

    // Create new article
    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title: body.title,
      content: body.content,
      summary: body.summary || body.content.substring(0, 300) + '...',
      url: body.url,
      publishedAt: new Date(body.publishedAt || new Date()),
      source: body.source || 'Manual Entry',
      feedId: body.feedId || 'manual',
      location: body.location || 'NATIONAL',
      discriminationType: body.discriminationType || 'GENERAL_AI',
      severity: body.severity || 'LOW',
      organizations: body.organizations || [],
      keywords: body.keywords || [],
      entities: body.entities || null,
      processed: false,
      processingError: null,
      confidenceScore: null,
      aiClassification: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // In production, save to database
    // await db.article.create({ data: newArticle })

    return NextResponse.json({
      success: true,
      data: newArticle,
      message: 'Article created successfully'
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error creating article:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    )
  }
}