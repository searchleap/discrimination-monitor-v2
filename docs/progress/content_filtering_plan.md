# Content Filtering Implementation Plan

## Overview
Implement admin-controlled content filtering to only store RSS articles containing specific keywords/terms.

## Database Schema Changes

### New Table: ContentFilter
```sql
model ContentFilter {
  id          String    @id @default(cuid())
  term        String    // Keyword or phrase
  isActive    Boolean   @default(true)
  category    String?   // Optional grouping (e.g., "discrimination", "ai", "legal")
  description String?   // Admin notes about the filter
  matchCount  Int       @default(0) // Track how many articles matched
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String?   // Admin user who created it
  
  @@index([isActive])
  @@index([category])
}
```

### New Table: FilteringConfig
```sql
model FilteringConfig {
  id              String    @id @default(cuid())
  name            String    @unique
  isActive        Boolean   @default(true)
  filterMode      FilterMode @default(OR) // OR = any match, AND = all must match
  minTermLength   Int       @default(3)   // Minimum term length
  caseSensitive   Boolean   @default(false)
  
  // Statistics
  articlesFiltered    Int     @default(0)
  articlesAccepted    Int     @default(0)
  lastApplied         DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum FilterMode {
  OR   // Any filter matches = accept article
  AND  // All filters must match = accept article
}
```

## API Endpoints

### Content Filter Management
- `GET /api/admin/content-filters` - List all filters
- `POST /api/admin/content-filters` - Create new filter
- `PUT /api/admin/content-filters/[id]` - Update filter
- `DELETE /api/admin/content-filters/[id]` - Delete filter
- `GET /api/admin/content-filters/stats` - Get filtering statistics

### Filtering Configuration
- `GET /api/admin/filtering-config` - Get current config
- `PUT /api/admin/filtering-config` - Update config

## Core Logic Changes

### RSS Processor Enhancement
1. Load active content filters before processing articles
2. Apply filtering logic in `processArticle()` method
3. Only create article if it passes filter criteria
4. Track filtering statistics

### Filter Matching Algorithm
```typescript
class ContentFilterMatcher {
  private filters: ContentFilter[]
  private config: FilteringConfig
  
  async shouldStoreArticle(title: string, content: string): Promise<boolean> {
    if (!this.config.isActive || this.filters.length === 0) {
      return true // No filtering when disabled or no filters
    }
    
    const text = (title + ' ' + content).toLowerCase()
    
    if (this.config.filterMode === 'OR') {
      return this.filters.some(filter => this.matchesFilter(text, filter))
    } else {
      return this.filters.every(filter => this.matchesFilter(text, filter))
    }
  }
  
  private matchesFilter(text: string, filter: ContentFilter): boolean {
    const term = this.config.caseSensitive ? filter.term : filter.term.toLowerCase()
    return text.includes(term)
  }
}
```

## UI Components

### ContentFilterManager Component
- List existing filters with edit/delete actions
- Add new filter form
- Filter categories and grouping
- Match count statistics
- Bulk operations (enable/disable, delete)

### FilteringSettings Component
- Global filtering configuration
- Filter mode selection (OR/AND)
- Case sensitivity toggle
- Statistics dashboard
- Test mode (preview what would be filtered)

## Implementation Phases

### Phase 1: Database & API
- [ ] Add database schema migrations
- [ ] Create API endpoints for filter management
- [ ] Create filtering configuration endpoints
- [ ] Add basic filter matching logic

### Phase 2: RSS Integration
- [ ] Integrate filtering into RSS processor
- [ ] Add filtering statistics tracking
- [ ] Update processing logs to include filter results
- [ ] Add filter bypass for testing/debugging

### Phase 3: Admin UI
- [ ] Create content filter management interface
- [ ] Add filtering configuration panel
- [ ] Implement statistics dashboard
- [ ] Add filter testing/preview functionality

### Phase 4: Advanced Features
- [ ] Regex support for complex patterns
- [ ] Category-based filtering
- [ ] Whitelist/blacklist combinations
- [ ] Machine learning suggestions for new filters

## Testing Strategy

### Unit Tests
- Filter matching logic accuracy
- Edge cases (empty filters, malformed content)
- Performance with large filter sets

### Integration Tests
- RSS processing with filtering enabled
- Database operations for filter management
- API endpoint functionality

### E2E Tests
- Admin UI filter management workflow
- Article filtering in real RSS feeds
- Statistics accuracy verification

## Monitoring & Metrics

### Key Metrics
- Filter match rate
- Articles accepted/rejected ratio
- Most/least effective filters
- Processing performance impact

### Alerts
- No articles stored (over-filtering)
- Filter processing errors
- Unusual filtering patterns

## Migration Strategy

### Database Migration
```sql
-- Add new tables
-- Populate with default configuration
-- Add indexes for performance
```

### Rollback Plan
- Feature flag to disable filtering
- Database rollback scripts
- Preserve existing article processing

## Security Considerations

- Input validation for filter terms
- Rate limiting on filter management APIs
- Audit logging for filter changes
- Prevent filter injection attacks

## Performance Considerations

- Cache active filters in memory
- Optimize text matching algorithms  
- Monitor RSS processing latency impact
- Consider async filtering for large content

## Success Criteria

- Admin can manage content filters via UI
- RSS processing respects filter configuration
- No performance degradation > 10%
- Accurate filtering statistics
- Zero false positives in initial deployment