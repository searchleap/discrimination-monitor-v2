import { Article, AIClassificationResult } from '@/types'

export class AIClassifier {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
  private static readonly ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
  
  private openaiKey: string | null = null
  private anthropicKey: string | null = null

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || null
    this.anthropicKey = process.env.ANTHROPIC_API_KEY || null
  }

  /**
   * Classify an article using AI
   */
  async classifyArticle(article: Article): Promise<AIClassificationResult> {
    try {
      // Try OpenAI first, then Anthropic as fallback
      if (this.openaiKey) {
        return await this.classifyWithOpenAI(article)
      } else if (this.anthropicKey) {
        return await this.classifyWithAnthropic(article)
      } else {
        return this.getFallbackClassification(article)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('AI classification failed:', error)
      return this.getFallbackClassification(article)
    }
  }

  /**
   * Classify using OpenAI
   */
  private async classifyWithOpenAI(article: Article): Promise<AIClassificationResult> {
    const prompt = this.buildClassificationPrompt(article)
    
    const response = await fetch(AIClassifier.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in AI ethics and discrimination analysis. Classify news articles about AI discrimination incidents.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    return this.parseClassificationResponse(content)
  }

  /**
   * Classify using Anthropic
   */
  private async classifyWithAnthropic(article: Article): Promise<AIClassificationResult> {
    const prompt = this.buildClassificationPrompt(article)
    
    const response = await fetch(AIClassifier.ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      throw new Error('No content in Anthropic response')
    }

    return this.parseClassificationResponse(content)
  }

  /**
   * Build classification prompt
   */
  private buildClassificationPrompt(article: Article): string {
    return `
Analyze this article about AI discrimination and provide a JSON response with the following structure:

{
  "location": "MICHIGAN" | "NATIONAL" | "INTERNATIONAL",
  "discriminationType": "RACIAL" | "RELIGIOUS" | "DISABILITY" | "GENERAL_AI" | "MULTIPLE",
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "confidenceScore": 0.0-1.0,
  "reasoning": "Brief explanation of classification",
  "entities": {
    "locations": ["location1", "location2"],
    "people": ["person1", "person2"],
    "organizations": ["org1", "org2"]
  },
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Classification Guidelines:

LOCATION:
- MICHIGAN: Incidents specifically in Michigan, mentions Michigan organizations, Michigan-specific laws/policies
- NATIONAL: US-wide incidents, federal policies, national organizations
- INTERNATIONAL: Global incidents, international organizations, non-US locations

DISCRIMINATION TYPE:
- RACIAL: AI systems showing bias against racial/ethnic groups
- RELIGIOUS: AI systems discriminating based on religious beliefs or practices
- DISABILITY: AI systems creating barriers for people with disabilities
- GENERAL_AI: Broad AI ethics concerns, algorithmic bias in general
- MULTIPLE: Multiple types of discrimination mentioned

SEVERITY:
- HIGH: Legal action, major incidents, policy changes, widespread impact
- MEDIUM: Reported discrimination, company responses, research findings
- LOW: General discussions, minor incidents, educational content

Article to analyze:
Title: ${article.title}
Content: ${article.content}
Source: ${article.source}
URL: ${article.url}

Provide only valid JSON response:
`
  }

  /**
   * Parse AI classification response
   */
  private parseClassificationResponse(content: string): AIClassificationResult {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (!parsed.location || !parsed.discriminationType || !parsed.severity) {
        throw new Error('Missing required classification fields')
      }

      return {
        location: parsed.location,
        discriminationType: parsed.discriminationType,
        severity: parsed.severity,
        confidenceScore: parsed.confidenceScore || 0.5,
        reasoning: parsed.reasoning || 'AI classification completed',
        entities: parsed.entities || { locations: [], people: [], organizations: [] },
        keywords: parsed.keywords || []
      }
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`)
    }
  }

  /**
   * Get fallback classification when AI is unavailable
   */
  private getFallbackClassification(article: Article): AIClassificationResult {
    // Simple keyword-based fallback classification
    const title = article.title.toLowerCase()
    const content = article.content.toLowerCase()
    const text = `${title} ${content}`

    // Location classification
    let location: 'MICHIGAN' | 'NATIONAL' | 'INTERNATIONAL' = 'NATIONAL'
    if (text.includes('michigan') || text.includes('detroit') || text.includes('lansing')) {
      location = 'MICHIGAN'
    } else if (text.includes('international') || text.includes('global') || text.includes('worldwide')) {
      location = 'INTERNATIONAL'
    }

    // Discrimination type classification
    let discriminationType: 'RACIAL' | 'RELIGIOUS' | 'DISABILITY' | 'GENERAL_AI' | 'MULTIPLE' = 'GENERAL_AI'
    const typeKeywords = {
      RACIAL: ['racial', 'race', 'ethnic', 'minority', 'discrimination', 'bias'],
      RELIGIOUS: ['religion', 'religious', 'faith', 'muslim', 'christian', 'jewish'],
      DISABILITY: ['disability', 'disabled', 'accessibility', 'ada', 'handicap'],
      GENERAL_AI: ['ai', 'artificial intelligence', 'algorithm', 'machine learning']
    }

    let maxMatches = 0
    let matchedTypes = 0
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        discriminationType = type as any
        matchedTypes = 1
      } else if (matches === maxMatches && matches > 0) {
        matchedTypes++
      }
    }

    if (matchedTypes > 1) {
      discriminationType = 'MULTIPLE'
    }

    // Severity classification
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
    if (text.includes('lawsuit') || text.includes('legal') || text.includes('settlement') || text.includes('court')) {
      severity = 'HIGH'
    } else if (text.includes('complaint') || text.includes('investigation') || text.includes('violation')) {
      severity = 'MEDIUM'
    }

    return {
      location,
      discriminationType,
      severity,
      confidenceScore: 0.3, // Low confidence for fallback
      reasoning: 'Fallback keyword-based classification',
      entities: {
        locations: this.extractLocations(text),
        people: [],
        organizations: this.extractOrganizations(text)
      },
      keywords: this.extractKeywords(text)
    }
  }

  /**
   * Extract locations from text
   */
  private extractLocations(text: string): string[] {
    const locations: string[] = []
    const locationKeywords = [
      'michigan', 'detroit', 'lansing', 'grand rapids', 'ann arbor',
      'california', 'new york', 'texas', 'florida', 'washington',
      'united states', 'usa', 'america', 'europe', 'asia'
    ]

    for (const location of locationKeywords) {
      if (text.includes(location)) {
        locations.push(location.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
      }
    }

    return Array.from(new Set(locations))
  }

  /**
   * Extract organizations from text
   */
  private extractOrganizations(text: string): string[] {
    const organizations: string[] = []
    const orgKeywords = [
      'microsoft', 'google', 'facebook', 'meta', 'amazon', 'apple',
      'openai', 'anthropic', 'ibm', 'oracle', 'salesforce',
      'aclu', 'eeoc', 'naacp', 'ada', 'department of justice'
    ]

    for (const org of orgKeywords) {
      if (text.includes(org)) {
        organizations.push(org.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
      }
    }

    return Array.from(new Set(organizations))
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = []
    const keywordPatterns = [
      'artificial intelligence', 'machine learning', 'algorithm', 'ai bias',
      'discrimination', 'hiring', 'recruitment', 'facial recognition',
      'civil rights', 'equal opportunity', 'accessibility', 'ada compliance'
    ]

    for (const keyword of keywordPatterns) {
      if (text.includes(keyword)) {
        keywords.push(keyword)
      }
    }

    return Array.from(new Set(keywords))
  }

  /**
   * Batch classify multiple articles
   */
  async classifyArticles(articles: Article[]): Promise<Map<string, AIClassificationResult>> {
    const results = new Map<string, AIClassificationResult>()
    
    // Process articles in batches to respect API limits
    const batchSize = 5
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async article => {
          const result = await this.classifyArticle(article)
          return { articleId: article.id, result }
        })
      )
      
      batchResults.forEach(({ articleId, result }) => {
        results.set(articleId, result)
      })
      
      // Rate limiting delay
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }
}