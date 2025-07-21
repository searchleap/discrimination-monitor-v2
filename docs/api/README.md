# AI Discrimination Dashboard - API Documentation

## Overview

The AI Discrimination Dashboard provides a RESTful API for managing RSS feeds, articles, and dashboard statistics. All endpoints return JSON responses with consistent error handling.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

Currently, the API is open for read operations. Write operations may require authentication in future versions.

## Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": object | array,
  "error": string,
  "message": string,
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

## Endpoints

### Articles

#### Get Articles
```http
GET /api/articles
```

**Query Parameters:**
- `location` (string): Filter by location (`MICHIGAN`, `NATIONAL`, `INTERNATIONAL`)
- `discriminationType` (string): Filter by type (`RACIAL`, `RELIGIOUS`, `DISABILITY`, `GENERAL_AI`, `MULTIPLE`)
- `severity` (string): Filter by severity (`LOW`, `MEDIUM`, `HIGH`)
- `search` (string): Search in title and content
- `source` (string): Filter by source domain
- `limit` (number): Number of results (default: 20, max: 100)
- `offset` (number): Number of results to skip (default: 0)
- `sortBy` (string): Sort field (default: `publishedAt`)
- `sortOrder` (string): Sort direction (`asc`, `desc`, default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "art-1",
      "title": "AI Hiring Tool Shows Bias Against Disability Applicants",
      "content": "Full article content...",
      "summary": "Brief summary...",
      "url": "https://example.com/article",
      "publishedAt": "2025-01-08T14:30:00Z",
      "source": "Michigan Tech News",
      "location": "MICHIGAN",
      "discriminationType": "DISABILITY",
      "severity": "HIGH",
      "organizations": ["TechCorp", "Michigan Department of Civil Rights"],
      "keywords": ["hiring", "AI bias", "disability discrimination"],
      "processed": true,
      "confidenceScore": 0.92,
      "createdAt": "2025-01-08T14:35:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Article
```http
POST /api/articles
```

**Request Body:**
```json
{
  "title": "Article Title",
  "content": "Full article content",
  "summary": "Brief summary (optional)",
  "url": "https://example.com/article",
  "publishedAt": "2025-01-08T14:30:00Z",
  "source": "Source Name",
  "location": "MICHIGAN",
  "discriminationType": "DISABILITY",
  "severity": "HIGH"
}
```

### Feeds

#### Get Feeds
```http
GET /api/feeds
```

**Query Parameters:**
- `category` (string): Filter by category
- `status` (string): Filter by status (`ACTIVE`, `ERROR`, `DISABLED`)
- `limit` (number): Number of results (default: 50)
- `offset` (number): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "feed-1",
      "name": "Michigan Civil Rights News",
      "url": "https://example.com/rss",
      "category": "CIVIL_RIGHTS",
      "isActive": true,
      "lastFetched": "2025-01-09T06:00:00Z",
      "status": "ACTIVE",
      "successRate": 0.95,
      "priority": 1,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Feed
```http
POST /api/feeds
```

**Request Body:**
```json
{
  "name": "Feed Name",
  "url": "https://example.com/rss",
  "category": "CIVIL_RIGHTS",
  "isActive": true,
  "priority": 1
}
```

#### Get Single Feed
```http
GET /api/feeds/{id}
```

#### Update Feed
```http
PUT /api/feeds/{id}
```

#### Delete Feed
```http
DELETE /api/feeds/{id}
```

#### Test Feed Connectivity
```http
POST /api/feeds/test
```

**Request Body:**
```json
{
  "url": "https://example.com/rss"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedUrl": "https://example.com/rss",
    "status": "ACTIVE",
    "articlesFound": 15,
    "processingTime": 2500,
    "sampleArticles": [
      {
        "title": "Sample Article",
        "url": "https://example.com/article1",
        "publishedAt": "2025-01-08T14:30:00Z",
        "source": "example.com"
      }
    ]
  }
}
```

### Dashboard Statistics

#### Get Summary Statistics
```http
GET /api/stats/summary
```

**Query Parameters:**
- `days` (number): Number of days to include (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalArticles": 80,
      "michiganArticles": 12,
      "nationalArticles": 45,
      "internationalArticles": 23,
      "highSeverityArticles": 8,
      "mediumSeverityArticles": 28,
      "lowSeverityArticles": 44,
      "activeFeeds": 75,
      "successRate": 0.95,
      "lastUpdated": "2025-01-09T12:00:00Z"
    },
    "trends": {
      "michiganArticles": {
        "current": 12,
        "previous": 9,
        "change": 3,
        "percentage": 33
      }
    }
  }
}
```

### RSS Processing

#### Process RSS Feeds
```http
POST /api/process/rss
```

**Request Body:**
```json
{
  "feedIds": ["feed-1", "feed-2"],
  "classify": true,
  "maxFeeds": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalFeeds": 2,
      "successfulFeeds": 2,
      "totalArticles": 25,
      "michiganArticles": 4,
      "nationalArticles": 15,
      "internationalArticles": 6,
      "processingTime": 15000,
      "errors": 0
    },
    "articles": [...],
    "errors": [],
    "processingResults": [...]
  }
}
```

#### Get Processing Status
```http
GET /api/process/rss
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lastProcessed": "2025-01-09T06:00:00Z",
    "isProcessing": false,
    "nextScheduled": "2025-01-10T06:00:00Z",
    "activeFeeds": 75,
    "averageProcessingTime": 45000,
    "successRate": 0.95,
    "recentJobs": [...]
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

## Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Rate Limiting

- 1000 requests per minute per IP address
- Higher limits available for authenticated users

## Data Models

### Article
```typescript
interface Article {
  id: string
  title: string
  content: string
  summary?: string
  url: string
  publishedAt: Date
  source: string
  feedId: string
  location: 'MICHIGAN' | 'NATIONAL' | 'INTERNATIONAL'
  discriminationType: 'RACIAL' | 'RELIGIOUS' | 'DISABILITY' | 'GENERAL_AI' | 'MULTIPLE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  organizations: string[]
  keywords: string[]
  entities?: any
  processed: boolean
  processingError?: string
  confidenceScore?: number
  aiClassification?: any
  createdAt: Date
  updatedAt: Date
}
```

### Feed
```typescript
interface Feed {
  id: string
  name: string
  url: string
  category: FeedCategory
  isActive: boolean
  lastFetched?: Date
  status: 'ACTIVE' | 'ERROR' | 'DISABLED' | 'MAINTENANCE'
  errorMessage?: string
  successRate: number
  customHeaders?: any
  processingRules?: any
  priority: number
  createdAt: Date
  updatedAt: Date
}
```

### Feed Categories
- `CIVIL_RIGHTS`: Civil rights organizations
- `GOVERNMENT`: Government agencies and official sources
- `ACADEMIC`: Academic institutions and research
- `TECH_NEWS`: Technology news publications
- `LEGAL`: Legal publications and bar associations
- `HEALTHCARE`: Healthcare and medical AI
- `MICHIGAN_LOCAL`: Michigan-specific sources
- `EMPLOYMENT`: Employment and HR publications
- `DATA_ETHICS`: Data ethics and AI ethics organizations
- `ADVOCACY`: Advocacy organizations

## Examples

### Get Michigan Articles from Last 7 Days
```bash
curl "https://your-domain.com/api/articles?location=MICHIGAN&days=7&sortBy=publishedAt&sortOrder=desc"
```

### Search for Disability Discrimination Articles
```bash
curl "https://your-domain.com/api/articles?discriminationType=DISABILITY&search=employment&limit=10"
```

### Get High Severity Articles
```bash
curl "https://your-domain.com/api/articles?severity=HIGH&limit=5"
```

### Test RSS Feed
```bash
curl -X POST "https://your-domain.com/api/feeds/test" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com/rss"}'
```

### Process RSS Feeds
```bash
curl -X POST "https://your-domain.com/api/process/rss" \
     -H "Content-Type: application/json" \
     -d '{"classify": true, "maxFeeds": 5}'
```

## SDK Examples

### JavaScript/TypeScript
```typescript
// Install: npm install axios
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://your-domain.com/api'
})

// Get Michigan articles
const { data } = await api.get('/articles', {
  params: {
    location: 'MICHIGAN',
    limit: 10
  }
})

// Process RSS feeds
await api.post('/process/rss', {
  classify: true,
  maxFeeds: 10
})
```

### Python
```python
# Install: pip install requests
import requests

BASE_URL = 'https://your-domain.com/api'

# Get articles
response = requests.get(f'{BASE_URL}/articles', params={
    'location': 'MICHIGAN',
    'severity': 'HIGH'
})
articles = response.json()

# Process RSS feeds
response = requests.post(f'{BASE_URL}/process/rss', json={
    'classify': True,
    'maxFeeds': 10
})
```

## Webhooks (Future)

The API will support webhooks for real-time notifications:

- New high-severity articles
- RSS processing completion
- Feed failures
- System alerts

---

**Last Updated**: 2025-01-09
**Version**: 2.0.0
**Support**: [GitHub Issues](https://github.com/your-org/discrimination-monitor/issues)