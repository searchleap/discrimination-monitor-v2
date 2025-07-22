# Production AI Deployment Guide

## 🚨 Current Status

The AI implementation is complete and tested locally, but the new API endpoints may need a deployment refresh on Vercel to become available in production.

## ✅ What's Ready

### **Local Implementation** (100% Complete)
- ✅ AI classification system integrated with RSS processing
- ✅ Admin interface at `/admin/ai` with full management capabilities
- ✅ API endpoints: `/api/ai/status`, `/api/ai/classify`, `/api/ai/batch-classify`
- ✅ Automatic classification of new articles during RSS processing
- ✅ Fallback classification system for high reliability
- ✅ All code committed and pushed to GitHub

### **Vercel Configuration** (API Keys Ready)
- ✅ OpenAI API key configured in Vercel environment variables
- ✅ Anthropic API key configured in Vercel environment variables
- ✅ Production database connected and operational (Neon PostgreSQL)

## 🔧 Production Deployment Steps

### **Step 1: Force Deployment Refresh**
The new AI API routes may need a fresh deployment to be recognized:

1. **Trigger new deployment** (can be done from Vercel dashboard or by pushing a minor commit)
2. **Wait for build completion** (typically 2-3 minutes)
3. **Test endpoints** after deployment completes

### **Step 2: Verify API Endpoints**
Once deployed, test these endpoints:

```bash
# Service Status (should show providers as "configured")
curl https://discrimination-monitor-v2.vercel.app/api/ai/status

# Admin Interface (should load without 404)
# Visit: https://discrimination-monitor-v2.vercel.app/admin/ai

# Health Check (should show AI as "healthy")
curl https://discrimination-monitor-v2.vercel.app/api/health
```

### **Step 3: Test Real AI Classification**
With production API keys, classification should be much more accurate:

```bash
# Get an article ID
ARTICLE_ID=$(curl -s https://discrimination-monitor-v2.vercel.app/api/articles?limit=1 | jq -r '.data[0].id')

# Classify with real AI (should show >70% confidence)
curl -X POST https://discrimination-monitor-v2.vercel.app/api/ai/classify \
  -H "Content-Type: application/json" \
  -d "{\"articleId\": \"$ARTICLE_ID\"}"
```

### **Step 4: Run Batch Re-Classification**
Improve accuracy of existing articles:

```bash
# Check batch status
curl https://discrimination-monitor-v2.vercel.app/api/ai/batch-classify

# Run batch classification (start small)
curl -X POST https://discrimination-monitor-v2.vercel.app/api/ai/batch-classify \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10, "forceReprocess": true}'
```

## 🎯 Expected Production Results

### **With Real API Keys**
- **Confidence Scores**: 70-95% (vs 30% with fallback)
- **Classification Accuracy**: Much higher precision in discrimination type detection
- **Entity Recognition**: Accurate extraction of organizations, people, locations
- **Reasoning**: Detailed AI-generated explanations for classifications
- **Processing Time**: 2-3 seconds per article (real API calls)

### **Service Health Dashboard**
- OpenAI: "configured" ✅
- Anthropic: "configured" ✅  
- Fallback Mode: false ✅
- Overall Health: "healthy" ✅

## 📊 Monitoring & Analytics

### **Key Metrics to Monitor**
1. **API Usage**: Track OpenAI/Anthropic token consumption
2. **Cost Analysis**: Monitor monthly API costs
3. **Classification Quality**: Review confidence score distribution
4. **Processing Performance**: Monitor response times and success rates

### **Admin Dashboard Features**
- Real-time service health monitoring
- Batch processing controls with progress tracking
- Classification statistics and confidence analysis
- Activity logs and error monitoring
- Service connectivity testing

## 🚨 Troubleshooting

### **If AI Endpoints Show 404**
1. Check Vercel deployment logs for build errors
2. Verify all dependencies are installed in production
3. Ensure API routes are properly structured in `src/app/api/ai/`
4. Try re-deploying from Vercel dashboard

### **If API Keys Not Working**
1. Verify environment variables are set in Vercel dashboard
2. Check API key format and validity
3. Test with service connectivity endpoint: `POST /api/ai/status`
4. Review Vercel function logs for authentication errors

### **If Classification Quality is Poor**
1. Check confidence score distribution
2. Review AI reasoning for patterns
3. Consider adjusting classification prompts
4. Monitor for rate limiting issues

## 🎬 Quick Start Commands

Once deployment is complete, run these commands to get started:

```bash
# 1. Check system health
curl https://discrimination-monitor-v2.vercel.app/api/health

# 2. Verify AI service status  
curl https://discrimination-monitor-v2.vercel.app/api/ai/status

# 3. Access admin interface
# Visit: https://discrimination-monitor-v2.vercel.app/admin/ai

# 4. Run small batch test
curl -X POST https://discrimination-monitor-v2.vercel.app/api/ai/batch-classify \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 5}'

# 5. Monitor results
curl https://discrimination-monitor-v2.vercel.app/api/analytics
```

## 📈 Success Indicators

You'll know the production AI is working when:

- ✅ `/api/ai/status` shows providers as "configured"
- ✅ Confidence scores are >70% for most articles
- ✅ Admin interface loads and shows accurate statistics
- ✅ New RSS articles are auto-classified with high confidence
- ✅ Batch processing works efficiently without errors

## 🔄 Next Phase Optimizations

After basic deployment works:

1. **Cost Optimization**: Implement intelligent batching to minimize API calls
2. **Quality Monitoring**: Set up alerts for low-confidence classifications  
3. **Performance Tuning**: Optimize batch sizes and processing schedules
4. **Custom Training**: Consider fine-tuning models on discrimination-specific data
5. **Advanced Analytics**: Add trend analysis and pattern recognition

---

**Status**: Ready for production deployment  
**Confidence**: High - all components tested locally  
**Risk**: Low - fallback system ensures no service disruption  
**Next Action**: Force fresh Vercel deployment and test endpoints