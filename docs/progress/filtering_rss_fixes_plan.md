# Filtering & RSS Processing Fixes - Implementation Plan

## **Objective**
Fix filtering functionality issues and implement RSS processing progress monitoring system.

## **Acceptance Criteria**
1. ✅ All filters (location, severity, date range, source) work correctly on homepage and articles page
2. ✅ RSS processing has visual progress indicators and status monitoring  
3. ✅ Feeds that have never been fetched are clearly identified and addressed
4. ✅ Real-time processing status updates for admin users

## **Issues Identified**

### **Filtering Problems**
1. **Database Column Mismatch**: Frontend sends lowercase values, database expects uppercase enum values
2. **API Parameter Mapping**: Inconsistent parameter transformation between frontend and backend
3. **Filter State Synchronization**: URL parameters not properly mapping to API calls

### **RSS Processing Problems**  
1. **No Progress Indicators**: Users can't tell if processing is working or hung
2. **No Feed Status Tracking**: Feeds that never fetched aren't clearly identified
3. **Timeout Issues**: Long-running processes may timeout without feedback
4. **No Real-time Updates**: Admin panel doesn't show live processing status

## **Technical Implementation Plan**

### **Phase 1: Fix Filtering Issues**
1. Update API route to handle case-insensitive enum mapping
2. Fix hook parameter transformation logic
3. Add proper error handling and fallbacks
4. Test all filter combinations

### **Phase 2: RSS Processing Monitoring**
1. Create RSS processing status API endpoint
2. Implement progress tracking in database  
3. Add real-time status components
4. Create admin monitoring dashboard
5. Add visual indicators for never-fetched feeds

### **Phase 3: Testing & Validation**
1. Test all filter combinations with API
2. Verify RSS processing status updates
3. Validate real-time progress indicators
4. Performance test with multiple feeds

## **Risks**
- Database enum constraints may reject invalid values
- RSS processing timeouts on large feed sets  
- Real-time updates may impact performance
- API response time delays affecting UX

## **Test Hooks**
- `/api/articles?location=michigan&severity=high&discriminationType=racial`
- `/api/process/rss` with progress monitoring
- Real-time status updates via polling
- Database query performance validation

---
*Created: 2025-01-21*
*Status: In Progress*