# AI Discrimination Monitor v2: AI Implementation Roadmap

## **Objective**
Integrate AI-powered classification and analysis capabilities using OpenAI/Anthropic APIs to:
1. Automatically classify articles for discrimination type, severity, and location
2. Extract entities (people, organizations, locations) from article content
3. Generate confidence scores and reasoning for classifications
4. Provide intelligent keyword extraction and analysis
5. Enable batch processing and re-classification of existing articles

## **Current System Status**
- ✅ **AIClassifier class**: Implemented with OpenAI + Anthropic support
- ✅ **Types**: Full AIClassificationResult interface defined
- ✅ **Fallback logic**: Keyword-based classification when AI unavailable
- ❌ **API integration**: Not connected to RSS processing pipeline
- ❌ **Frontend UI**: No admin interface for AI operations
- ❌ **Batch processing**: No endpoint for re-classifying existing articles
- ❌ **API keys**: Not configured in environment

## **Acceptance Criteria**

### **Core AI Integration** ✅ Must Have
1. **API Endpoints**:
   - `POST /api/ai/classify` - Classify single article
   - `POST /api/ai/batch-classify` - Classify multiple articles
   - `POST /api/ai/reclassify-all` - Re-process all articles
   - `GET /api/ai/status` - Get AI service status and usage

2. **RSS Processing Integration**:
   - Auto-classify new articles during RSS processing
   - Store AI results in database (location, type, severity, entities)
   - Update confidence scores and reasoning

3. **Database Updates**:
   - Persist AI classification results in article records
   - Track processing status and errors
   - Store confidence scores and AI reasoning

### **Admin Interface** ⚠️ Should Have
1. **AI Management Dashboard** (`/admin/ai`):
   - View AI service status (API keys, rate limits)
   - Trigger batch re-classification
   - Monitor AI processing progress
   - Review low-confidence classifications

2. **Article Review Interface**:
   - Filter articles by confidence score
   - Manual review and correction of AI classifications
   - Batch approval/rejection workflow

### **Quality & Monitoring** 🔄 Could Have
1. **Confidence Tracking**:
   - Track accuracy over time
   - Alert on low-confidence patterns
   - A/B testing between AI providers

2. **Cost Management**:
   - API usage tracking
   - Rate limiting and queuing
   - Budget alerts and controls

## **Implementation Strategy**

### **Phase 1: Core AI Pipeline** (Day 1-2)
1. **Environment Setup**:
   - Add OpenAI/Anthropic API keys to environment
   - Test AI classifier with real article data
   - Validate classification accuracy

2. **API Endpoints**:
   - Create `/api/ai/*` endpoints for classification
   - Integrate with existing article data
   - Add error handling and rate limiting

3. **RSS Integration**:
   - Modify RSS processor to call AI classification
   - Update article schema with AI results
   - Test end-to-end pipeline

### **Phase 2: Admin Interface** (Day 3)
1. **AI Dashboard**:
   - Create admin interface for AI management
   - Add batch processing controls
   - Include status monitoring

2. **Article Review**:
   - Build interface for reviewing AI classifications
   - Add manual override capabilities
   - Include confidence-based filtering

### **Phase 3: Optimization** (Day 4)
1. **Performance**:
   - Implement batch processing with queuing
   - Add caching for repeated classifications
   - Optimize API call patterns

2. **Quality**:
   - Add classification accuracy tracking
   - Implement feedback loops
   - Monitor cost and usage

## **Technical Architecture**

### **AI Service Flow**
```
RSS Article → AI Classifier → Classification Result → Database → Analytics
```

### **Key Components**
1. **AIClassifier** (`src/lib/ai-classifier.ts`) - Core AI logic
2. **AI API Routes** (`src/app/api/ai/*`) - HTTP endpoints
3. **Admin Dashboard** (`src/app/admin/ai`) - Management interface
4. **Database Schema** - Extended with AI fields

### **Database Schema Changes**
```sql
-- Articles table already has:
- discriminationType
- location 
- severity
- confidenceScore
- aiClassification (JSON)
- entities (JSON)

-- Need to ensure proper utilization
```

## **Risks & Mitigations**

### **High Risk** 🔴
- **API Cost Explosion**: Uncontrolled API usage
  - *Mitigation*: Rate limiting, batch processing, budget alerts
- **Classification Accuracy**: Poor AI results affect analytics
  - *Mitigation*: Fallback classification, confidence thresholds

### **Medium Risk** 🟡  
- **Rate Limiting**: API quotas exceeded
  - *Mitigation*: Intelligent queuing, multiple API keys
- **Data Privacy**: Article content sent to AI APIs
  - *Mitigation*: Content sanitization, opt-out controls

### **Low Risk** 🟢
- **Service Downtime**: AI APIs unavailable
  - *Mitigation*: Fallback classification, retry logic

## **Test Hooks**

### **Unit Tests**
- AI classification accuracy with known articles
- Fallback classification when APIs unavailable
- Batch processing with rate limiting

### **Integration Tests**
- End-to-end RSS → AI → Database flow
- Admin interface batch operations
- API error handling and recovery

### **Manual Testing**
- Classify real EFF articles and validate results
- Test admin interface with existing data
- Verify analytics accuracy with AI classifications

## **Success Metrics**

### **Technical**
- **Classification Accuracy**: >80% correct classifications
- **API Response Time**: <3 seconds per article
- **System Reliability**: 99% uptime for AI pipeline

### **Business** 
- **Data Quality**: Higher confidence in analytics
- **Coverage**: 100% of articles classified
- **Cost Efficiency**: <$50/month for AI API usage

## **Dependencies**
- OpenAI API key with sufficient quota
- Anthropic API key as backup
- Redis for queuing (optional optimization)
- Admin authentication system (basic auth acceptable)

## **Post-Implementation**
1. Monitor AI classification accuracy vs manual review
2. Optimize API usage patterns based on costs
3. Expand AI capabilities (sentiment analysis, urgency detection)
4. Consider training custom models on historical data

---
**Created**: 2025-07-21  
**Status**: Planning → Implementation  
**Owner**: AI Development Team  
**Next Review**: After Phase 1 completion