'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Clock, MapPin, AlertTriangle, Loader2 } from 'lucide-react'
import { useArticleFilters } from '@/hooks/useArticleFilters'

// Article interface matching the API response
interface APIArticle {
  id: string
  title: string
  content: string
  summary?: string
  url: string
  publishedAt: string
  source: string
  feedId: string
  location: 'MICHIGAN' | 'NATIONAL' | 'INTERNATIONAL'
  discriminationType: 'RACIAL' | 'RELIGIOUS' | 'DISABILITY' | 'GENERAL_AI' | 'MULTIPLE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  organizations: string[]
  keywords: string[]
  entities: any
  processed: boolean
  processingError?: string | null
  confidenceScore?: number | null
  aiClassification?: any
  createdAt: string
  updatedAt: string
  feed: {
    name: string
    category: string
  }
}

// Keep mock data as fallback for development
const mockArticles = [
  {
    id: '1',
    title: 'Hiring System Shows Bias Against Disability Applicants in Michigan',
    summary: 'A major tech company\'s automated hiring system has been found to discriminate against candidates with disabilities, particularly affecting applicants in Michigan.',
    url: 'https://example.com/article1',
    publishedAt: new Date('2025-01-08T14:30:00Z'),
    source: 'Michigan Tech News',
    location: 'MICHIGAN',
    discriminationType: 'DISABILITY',
    severity: 'HIGH',
    organizations: ['TechCorp', 'Michigan Department of Civil Rights'],
    keywords: ['hiring', 'bias', 'disability discrimination'],
  },
  {
    id: '2',
    title: 'Religious Group Files Complaint Over Content Moderation',
    summary: 'A religious organization has filed a complaint alleging that automated content moderation systems are unfairly targeting their religious content.',
    url: 'https://example.com/article2',
    publishedAt: new Date('2025-01-08T10:15:00Z'),
    source: 'Civil Rights Today',
    location: 'NATIONAL',
    discriminationType: 'RELIGIOUS',
    severity: 'MEDIUM',
    organizations: ['Faith Coalition', 'Social Media Platform'],
    keywords: ['content moderation', 'religious discrimination', 'bias'],
  },
  {
    id: '3',
    title: 'Study Reveals Racial Bias in Medical Diagnosis Tools',
    summary: 'New research shows that automated diagnostic tools used in healthcare show significant racial bias, potentially affecting patient care quality.',
    url: 'https://example.com/article3',
    publishedAt: new Date('2025-01-07T16:45:00Z'),
    source: 'Healthcare Technology Journal',
    location: 'INTERNATIONAL',
    discriminationType: 'RACIAL',
    severity: 'HIGH',
    organizations: ['Medical Technology Institute', 'Healthcare Coalition'],
    keywords: ['medical technology', 'racial bias', 'healthcare discrimination'],
  },
  {
    id: '4',
    title: 'Michigan Court Rules Against Discriminatory Screening System',
    summary: 'A Detroit court has ruled that an automated screening system used by local employers violates disability rights laws.',
    url: 'https://example.com/article4',
    publishedAt: new Date('2025-01-08T09:00:00Z'),
    source: 'Detroit Legal News',
    location: 'MICHIGAN',
    discriminationType: 'DISABILITY',
    severity: 'HIGH',
    organizations: ['Detroit District Court', 'Michigan Disability Rights Coalition'],
    keywords: ['court ruling', 'screening', 'disability rights'],
  },
  {
    id: '5',
    title: 'Grand Rapids Company Faces Discrimination Lawsuit Over Recruitment',
    summary: 'A Grand Rapids-based company is facing a class-action lawsuit alleging their automated recruitment software discriminates against minority candidates.',
    url: 'https://example.com/article5',
    publishedAt: new Date('2025-01-07T13:20:00Z'),
    source: 'Grand Rapids Business Journal',
    location: 'MICHIGAN',
    discriminationType: 'RACIAL',
    severity: 'MEDIUM',
    organizations: ['Grand Rapids Corp', 'Michigan NAACP'],
    keywords: ['recruitment', 'lawsuit', 'minority discrimination'],
  },
  {
    id: '6',
    title: 'University of Michigan Research Exposes Bias in Student Admissions',
    summary: 'Researchers at U-M have discovered significant bias in automated admissions systems affecting underrepresented student groups.',
    url: 'https://example.com/article6',
    publishedAt: new Date('2025-01-06T11:15:00Z'),
    source: 'Michigan Daily',
    location: 'MICHIGAN',
    discriminationType: 'MULTIPLE',
    severity: 'MEDIUM',
    organizations: ['University of Michigan', 'Student Equity Alliance'],
    keywords: ['admissions', 'university', 'student bias'],
  },
  {
    id: '7',
    title: 'Federal Investigation Launched into Discrimination Practices',
    summary: 'The Department of Justice has launched a federal investigation into widespread discrimination practices across multiple industries.',
    url: 'https://example.com/article7',
    publishedAt: new Date('2025-01-08T08:00:00Z'),
    source: 'Washington Post',
    location: 'NATIONAL',
    discriminationType: 'GENERAL_AI',
    severity: 'HIGH',
    organizations: ['Department of Justice', 'Federal Trade Commission'],
    keywords: ['federal investigation', 'DOJ', 'discrimination'],
  },
  {
    id: '8',
    title: 'EEOC Issues New Guidelines on Bias in Employment',
    summary: 'The Equal Employment Opportunity Commission has released comprehensive guidelines addressing bias in hiring and employment practices.',
    url: 'https://example.com/article8',
    publishedAt: new Date('2025-01-07T14:00:00Z'),
    source: 'Employment Law Daily',
    location: 'NATIONAL',
    discriminationType: 'GENERAL_AI',
    severity: 'MEDIUM',
    organizations: ['EEOC', 'National Employment Lawyers Association'],
    keywords: ['EEOC guidelines', 'employment bias', 'hiring practices'],
  },
  {
    id: '9',
    title: 'Major Tech Companies Pledge to Address Discrimination',
    summary: 'Leading technology companies have signed a pledge to implement stricter measures to prevent discrimination in their products and services.',
    url: 'https://example.com/article9',
    publishedAt: new Date('2025-01-06T16:30:00Z'),
    source: 'TechCrunch',
    location: 'NATIONAL',
    discriminationType: 'GENERAL_AI',
    severity: 'LOW',
    organizations: ['Google', 'Microsoft', 'Amazon', 'Meta'],
    keywords: ['tech companies', 'pledge', 'discrimination prevention'],
  },
  {
    id: '10',
    title: 'Senate Hearing on Bias Reveals Widespread Discrimination',
    summary: 'A Senate judiciary committee hearing has revealed extensive evidence of bias affecting protected classes across various sectors.',
    url: 'https://example.com/article10',
    publishedAt: new Date('2025-01-05T15:45:00Z'),
    source: 'Congressional Quarterly',
    location: 'NATIONAL',
    discriminationType: 'MULTIPLE',
    severity: 'HIGH',
    organizations: ['Senate Judiciary Committee', 'ACLU'],
    keywords: ['senate hearing', 'bias', 'protected classes'],
  },
  {
    id: '11',
    title: 'EU Legislation Influences Global Discrimination Standards',
    summary: 'The European Union\'s new legislation is setting global standards for preventing discrimination, influencing legislation worldwide.',
    url: 'https://example.com/article11',
    publishedAt: new Date('2025-01-08T12:00:00Z'),
    source: 'European Policy Review',
    location: 'INTERNATIONAL',
    discriminationType: 'GENERAL_AI',
    severity: 'MEDIUM',
    organizations: ['European Commission', 'Ethics Institute'],
    keywords: ['EU legislation', 'global standards', 'regulation'],
  },
  {
    id: '12',
    title: 'UN Report Highlights Global Discrimination Crisis',
    summary: 'A United Nations report has identified discrimination as a growing global crisis requiring immediate international cooperation.',
    url: 'https://example.com/article12',
    publishedAt: new Date('2025-01-07T10:30:00Z'),
    source: 'UN News',
    location: 'INTERNATIONAL',
    discriminationType: 'MULTIPLE',
    severity: 'HIGH',
    organizations: ['United Nations', 'UNESCO'],
    keywords: ['UN report', 'global crisis', 'international cooperation'],
  },
  {
    id: '13',
    title: 'Canadian Supreme Court Sets Precedent on Discrimination',
    summary: 'The Canadian Supreme Court has issued a landmark ruling on discrimination that is expected to influence international law.',
    url: 'https://example.com/article13',
    publishedAt: new Date('2025-01-06T14:15:00Z'),
    source: 'Canadian Legal Monitor',
    location: 'INTERNATIONAL',
    discriminationType: 'GENERAL_AI',
    severity: 'HIGH',
    organizations: ['Canadian Supreme Court', 'Canadian Civil Liberties Association'],
    keywords: ['supreme court', 'legal precedent', 'discrimination law'],
  },
  {
    id: '14',
    title: 'Michigan State Legislature Considers Discrimination Bill',
    summary: 'The Michigan State Legislature is considering comprehensive legislation to address discrimination in state government services.',
    url: 'https://example.com/article14',
    publishedAt: new Date('2025-01-05T11:00:00Z'),
    source: 'Lansing State Journal',
    location: 'MICHIGAN',
    discriminationType: 'GENERAL_AI',
    severity: 'MEDIUM',
    organizations: ['Michigan State Legislature', 'Michigan Civil Rights Commission'],
    keywords: ['state legislation', 'government services', 'regulation'],
  },
  {
    id: '15',
    title: 'Detroit Tech Startup Develops AI Bias Detection Tool',
    summary: 'A Detroit-based startup has developed innovative technology to detect and prevent AI bias in real-time applications.',
    url: 'https://example.com/article15',
    publishedAt: new Date('2025-01-04T09:45:00Z'),
    source: 'Detroit Tech Week',
    location: 'MICHIGAN',
    discriminationType: 'GENERAL_AI',
    severity: 'LOW',
    organizations: ['Detroit Tech Startup', 'Michigan Tech Innovation Hub'],
    keywords: ['bias detection', 'startup', 'AI technology'],
  },
]

// Type for both API and mock articles
type Article = APIArticle | typeof mockArticles[0]

function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-start justify-between space-x-2">
          <CardTitle className="text-lg leading-tight">
            {article.title}
          </CardTitle>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={`location-${article.location.toLowerCase()}`}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {article.location}
            </Badge>
            <Badge
              variant={article.severity === 'HIGH' ? 'destructive' : 'secondary'}
              className={`severity-${article.severity.toLowerCase()}`}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {article.severity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {article.summary || ('content' in article && article.content ? article.content.substring(0, 200) + '...' : 'No summary available')}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
          <span className="font-medium">
            {'feed' in article ? article.feed.name : article.source}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant="outline"
            className={`discrimination-${article.discriminationType.toLowerCase().replace('_', '-')}`}
          >
            {article.discriminationType.replace('_', ' ')}
          </Badge>
          {article.keywords.slice(0, 3).map((keyword, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {article.organizations.length} organizations mentioned
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-primary hover:text-primary/80"
          >
            <span>Read more</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

export function ArticleGrid() {
  const articlesPerPage = 6
  const [articles, setArticles] = useState<Article[]>([])
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { filters, hasActiveFilters, getActiveFilterLabels, getAPIParams } = useArticleFilters()
  const activeLabels = getActiveFilterLabels()
  // Fetch articles from API with filters
  useEffect(() => {
    async function fetchArticles() {
      try {
        setIsLoading(true)
        setError(null)
        
        const apiParams = getAPIParams()
        apiParams.append('limit', '50')
        apiParams.append('sortBy', 'publishedAt')
        apiParams.append('sortOrder', 'desc')
        
        const response = await fetch(`/api/articles?${apiParams.toString()}`)
        const data = await response.json()
        
        if (data.success) {
          const fetchedArticles = data.data as APIArticle[]
          setArticles(fetchedArticles)
          setDisplayedArticles(fetchedArticles.slice(0, articlesPerPage))
          setCurrentPage(1)
        } else {
          // Failed to fetch articles, using mock data
          setArticles(mockArticles)
          setDisplayedArticles(mockArticles.slice(0, articlesPerPage))
          setCurrentPage(1)
        }
      } catch (error) {
        setError('Failed to load articles')
        // Fallback to mock data  
        setArticles(mockArticles)
        setDisplayedArticles(mockArticles.slice(0, articlesPerPage))
        setCurrentPage(1)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchArticles()
  }, [filters, getAPIParams])

  // No longer needed - filters are handled by the hook and API calls
  
  const loadMoreArticles = () => {
    const nextPage = currentPage + 1
    const startIndex = nextPage * articlesPerPage
    const endIndex = startIndex + articlesPerPage
    const newArticles = articles.slice(startIndex, endIndex)
    
    setDisplayedArticles(prev => [...prev, ...newArticles])
    setCurrentPage(nextPage)
  }
  
  const hasMoreArticles = displayedArticles.length < articles.length
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4" id="articles-section">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading articles...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4" id="articles-section">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-primary hover:text-primary/80 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" id="articles-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {hasActiveFilters ? `Filtered Articles` : 'Recent Articles'}
          </h2>
          {hasActiveFilters && activeLabels.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{activeLabels[0]}</span>
              {activeLabels.length > 1 && (
                <span className="text-sm text-gray-500">+{activeLabels.length - 1} more</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Showing {displayedArticles.length} of {articles.length} articles
          </span>
          <Badge variant="outline">
            {hasActiveFilters ? 'Filtered' : 'All Articles'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      
      {articles.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p>No articles found for the selected filters.</p>
          {hasActiveFilters && (
            <p className="text-sm mt-2">Try adjusting your filter criteria or clearing all filters.</p>
          )}
        </div>
      )}

      {/* Load More Button */}
      {hasMoreArticles && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={loadMoreArticles}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Load More Articles ({articles.length - displayedArticles.length} remaining)
          </button>
        </div>
      )}
    </div>
  )
}