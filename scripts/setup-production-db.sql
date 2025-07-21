-- AI Discrimination Dashboard v2.0 - Production Database Setup
-- This script sets up the production database with required extensions and indexes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_location ON "Article"(location);
CREATE INDEX IF NOT EXISTS idx_articles_discrimination_type ON "Article"(discrimination_type);
CREATE INDEX IF NOT EXISTS idx_articles_severity ON "Article"(severity);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON "Article"(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON "Article"(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_articles_location_severity ON "Article"(location, severity);
CREATE INDEX IF NOT EXISTS idx_articles_discrimination_type_severity ON "Article"(discrimination_type, severity);

-- Create text search index for content search
CREATE INDEX IF NOT EXISTS idx_articles_content_search ON "Article" USING gin(to_tsvector('english', title || ' ' || summary || ' ' || content));

-- Create indexes for feeds
CREATE INDEX IF NOT EXISTS idx_feeds_category ON "Feed"(category);
CREATE INDEX IF NOT EXISTS idx_feeds_status ON "Feed"(status);
CREATE INDEX IF NOT EXISTS idx_feeds_last_fetched ON "Feed"(last_fetched);

-- Create indexes for logs
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON "ProcessingLog"(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_logs_type ON "ProcessingLog"(log_type);

-- Performance optimization settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET track_io_timing = on;

-- Reload configuration
SELECT pg_reload_conf();

-- Create a view for dashboard metrics
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
  COUNT(CASE WHEN location = 'MICHIGAN' THEN 1 END) as michigan_count,
  COUNT(CASE WHEN location = 'NATIONAL' THEN 1 END) as national_count,
  COUNT(CASE WHEN location = 'INTERNATIONAL' THEN 1 END) as international_count,
  COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_severity_count,
  COUNT(*) as total_count
FROM "Article"
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Grant permissions (adjust as needed)
GRANT SELECT ON dashboard_metrics TO PUBLIC;