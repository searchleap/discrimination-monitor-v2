# 🚀 Vercel Deployment Guide - Step by Step

## ✅ **Database Status: SEEDED AND READY**
- **30 RSS feeds** successfully added to database
- **Categories**: Civil Rights, Michigan Local, Government, Academic, Tech News, Legal, Advocacy, Data Ethics, Employment
- **Connection**: Verified and working

---

## 📋 **Step-by-Step Deployment Instructions**

### **Step 1: Access Vercel**
1. Go to: https://vercel.com/new
2. Sign in with your GitHub account
3. Look for "Import Git Repository" section

### **Step 2: Import Repository**
1. **Find your repository**: `Perceptint/Discrimination-Monitor-for-AI`
2. **Click "Import"** next to the repository
3. **Configure settings**:
   - **Project Name**: `discrimination-monitor-ai` (or your choice)
   - **Framework**: Next.js (should auto-detect)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### **Step 3: Add Environment Variables**
**CRITICAL**: Click "Environment Variables" and add these **before** deploying:

#### **Database (Required)**
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_3mZAvXP2Rcfy@ep-jolly-bonus-aejxsh9w-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environment: Production, Preview, Development
```

#### **AI Services (Add at least ONE)**
```
Name: OPENAI_API_KEY
Value: sk-your-openai-api-key-here
Environment: Production, Preview, Development
```

**OR/AND**

```
Name: ANTHROPIC_API_KEY
Value: sk-ant-your-anthropic-api-key-here
Environment: Production, Preview, Development
```

#### **Authentication (Required)**
```
Name: NEXTAUTH_SECRET
Value: your-32-character-secret-key-here
Environment: Production, Preview, Development
```

**Generate a secret**: You can use any 32-character string, or generate one at https://generate-secret.vercel.app/32

```
Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app
Environment: Production, Preview, Development
```

**Note**: You'll update this after deployment with your actual Vercel URL

#### **Optional: RSS Processing**
```
Name: RSS_PROCESSING_INTERVAL
Value: 0 6 * * *
Environment: Production, Preview, Development

Name: RSS_BATCH_SIZE
Value: 10
Environment: Production, Preview, Development
```

### **Step 4: Deploy**
1. **Click "Deploy"** button
2. **Wait for build** (2-3 minutes)
3. **Monitor build logs** for any errors
4. **Get your deployment URL** (e.g., `https://discrimination-monitor-ai.vercel.app`)

### **Step 5: Update NEXTAUTH_URL**
1. **Copy your actual Vercel URL**
2. **Go to**: Project Settings → Environment Variables
3. **Edit `NEXTAUTH_URL`** with your real URL
4. **Save** (will trigger auto-redeploy)

### **Step 6: Test Your Deployment**

#### **Health Check**
```bash
curl https://your-app.vercel.app/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T...",
  "version": "2.0.0",
  "services": {
    "database": "healthy",
    "ai": "healthy",
    "rss": "healthy"
  }
}
```

#### **Dashboard Test**
- Visit: `https://your-app.vercel.app/`
- Should show:
  - Hero cards with Michigan priority
  - Interactive filtering
  - 15 mock articles initially
  - Responsive design

#### **API Test**
```bash
curl https://your-app.vercel.app/api/articles
```

**Expected**: Empty array `[]` initially (no real articles until RSS processing)

#### **RSS Processing Test**
```bash
curl -X POST https://your-app.vercel.app/api/process/rss
```

**Expected**: RSS feeds start processing and articles begin appearing

---

## 🎯 **Post-Deployment Tasks**

### **1. Verify RSS Feed Processing**
- Check: `https://your-app.vercel.app/api/feeds`
- Should show 30 feeds with status information

### **2. Monitor Processing**
- RSS processing runs automatically
- Check logs in Vercel dashboard
- Monitor `/api/health` for system status

### **3. Test All Features**
- **Hero Cards**: Click to filter articles
- **Search**: Use search bar for keywords
- **Filters**: Test location, type, severity filters
- **Pagination**: "Load More" functionality
- **Mobile**: Test on mobile devices

---

## 🔧 **Troubleshooting**

### **Build Failures**
- **Check environment variables** are set correctly
- **Verify database connection** string
- **Check build logs** for specific errors

### **Runtime Errors**
- **Check `/api/health`** endpoint
- **Verify AI API keys** are valid
- **Check Vercel function logs**

### **Database Issues**
- **Connection string** must include `sslmode=require`
- **Database exists** and is accessible
- **Tables created** (should be automatic)

### **RSS Processing Issues**
- **Check AI API keys** are working
- **Monitor function timeouts** (configured for 60 seconds)
- **Check feed URLs** are accessible

---

## 📊 **Expected Performance**

### **Initial Load**
- **Dashboard**: < 3 seconds
- **API responses**: < 2 seconds
- **RSS processing**: < 30 seconds for all feeds

### **Features Working**
- ✅ **30 RSS feeds** ready for processing
- ✅ **Interactive dashboard** with Michigan priority
- ✅ **Real-time filtering** and search
- ✅ **Responsive design** for all devices
- ✅ **Health monitoring** and error handling

---

## 🎉 **Success Checklist**

- [ ] Repository imported to Vercel
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] Health check returns "healthy"
- [ ] Dashboard loads correctly
- [ ] Hero cards are clickable
- [ ] RSS processing works
- [ ] Articles appear after processing
- [ ] Mobile responsive
- [ ] All APIs responding

**Once all items are checked, your AI Discrimination Dashboard v2.0 is live and monitoring discrimination incidents with Michigan priority!**

---

## 🔗 **Quick Links**

- **Repository**: https://github.com/Perceptint/Discrimination-Monitor-for-AI
- **Database**: ✅ Seeded with 30 RSS feeds
- **Vercel**: https://vercel.com/new
- **Health Check**: `https://your-app.vercel.app/api/health`
- **Dashboard**: `https://your-app.vercel.app/`

---
*Deployment Guide Created: 2025-01-10*  
*Database Status: ✅ Seeded and Ready*  
*Ready for Production Deployment*