-- AI Discrimination Dashboard v2.0 - Database Seeding Script
-- This script seeds the database with RSS feeds for monitoring

-- Clear existing feeds
DELETE FROM "Feed";

-- Insert RSS feeds
INSERT INTO "Feed" (name, url, category, priority, status, created_at, updated_at) VALUES
-- Civil Rights Organizations
('ACLU News', 'https://www.aclu.org/news/feed', 'CIVIL_RIGHTS', 1, 'ACTIVE', NOW(), NOW()),
('NAACP News', 'https://naacp.org/feed/', 'CIVIL_RIGHTS', 1, 'ACTIVE', NOW(), NOW()),
('Southern Poverty Law Center', 'https://www.splcenter.org/rss.xml', 'CIVIL_RIGHTS', 1, 'ACTIVE', NOW(), NOW()),
('Anti-Defamation League', 'https://www.adl.org/rss/news.xml', 'CIVIL_RIGHTS', 1, 'ACTIVE', NOW(), NOW()),
('Electronic Frontier Foundation', 'https://www.eff.org/rss/updates.xml', 'CIVIL_RIGHTS', 1, 'ACTIVE', NOW(), NOW()),

-- Michigan-Specific Sources
('Michigan Department of Civil Rights', 'https://www.michigan.gov/mdcr/feed', 'MICHIGAN_LOCAL', 1, 'ACTIVE', NOW(), NOW()),
('Detroit Free Press Civil Rights', 'https://www.freep.com/feeds/rss/civil-rights/', 'MICHIGAN_LOCAL', 1, 'ACTIVE', NOW(), NOW()),
('MLive Michigan News', 'https://www.mlive.com/news/rss.xml', 'MICHIGAN_LOCAL', 2, 'ACTIVE', NOW(), NOW()),
('Michigan Radio News', 'https://www.michiganradio.org/news/feed', 'MICHIGAN_LOCAL', 2, 'ACTIVE', NOW(), NOW()),
('Bridge Michigan', 'https://www.bridgemi.com/rss.xml', 'MICHIGAN_LOCAL', 2, 'ACTIVE', NOW(), NOW()),

-- Government Sources
('EEOC News', 'https://www.eeoc.gov/newsroom/rss_feeds/press_releases.xml', 'GOVERNMENT', 1, 'ACTIVE', NOW(), NOW()),
('Department of Justice Civil Rights', 'https://www.justice.gov/crt/rss', 'GOVERNMENT', 1, 'ACTIVE', NOW(), NOW()),
('FTC Technology News', 'https://www.ftc.gov/news-events/rss-feeds/technology', 'GOVERNMENT', 2, 'ACTIVE', NOW(), NOW()),
('White House Technology Policy', 'https://www.whitehouse.gov/ostp/rss/', 'GOVERNMENT', 2, 'ACTIVE', NOW(), NOW()),

-- Academic and Research
('AI Now Institute', 'https://ainowinstitute.org/feed/', 'ACADEMIC', 1, 'ACTIVE', NOW(), NOW()),
('Algorithmic Justice League', 'https://www.ajl.org/rss', 'ACADEMIC', 1, 'ACTIVE', NOW(), NOW()),
('Brookings AI Governance', 'https://www.brookings.edu/topic/artificial-intelligence/feed/', 'ACADEMIC', 2, 'ACTIVE', NOW(), NOW()),

-- Technology News
('MIT Technology Review AI', 'https://www.technologyreview.com/feed/', 'TECHNOLOGY', 2, 'ACTIVE', NOW(), NOW()),
('Wired AI News', 'https://www.wired.com/feed/tag/ai/latest/rss', 'TECHNOLOGY', 2, 'ACTIVE', NOW(), NOW()),
('Ars Technica AI', 'https://arstechnica.com/tag/artificial-intelligence/feed/', 'TECHNOLOGY', 2, 'ACTIVE', NOW(), NOW()),
('TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'TECHNOLOGY', 2, 'ACTIVE', NOW(), NOW()),
('VentureBeat AI', 'https://venturebeat.com/category/ai/feed/', 'TECHNOLOGY', 2, 'ACTIVE', NOW(), NOW()),

-- Legal News
('Law360 Employment Law', 'https://www.law360.com/employment/rss', 'LEGAL', 2, 'ACTIVE', NOW(), NOW()),
('JD Supra AI Law', 'https://www.jdsupra.com/rss/artificial-intelligence/', 'LEGAL', 2, 'ACTIVE', NOW(), NOW()),
('ABA Journal Technology', 'https://www.abajournal.com/news/rss/technology', 'LEGAL', 2, 'ACTIVE', NOW(), NOW()),

-- News Sources
('Reuters Technology', 'https://feeds.reuters.com/news/technology', 'NEWS', 2, 'ACTIVE', NOW(), NOW()),
('Associated Press Technology', 'https://apnews.com/rss/technology', 'NEWS', 2, 'ACTIVE', NOW(), NOW()),
('NPR Technology', 'https://feeds.npr.org/1019/rss.xml', 'NEWS', 2, 'ACTIVE', NOW(), NOW()),
('BBC Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml', 'NEWS', 2, 'ACTIVE', NOW(), NOW()),
('CNN Technology', 'https://rss.cnn.com/rss/edition.rss', 'NEWS', 2, 'ACTIVE', NOW(), NOW()),

-- Advocacy Organizations
('Center for Democracy & Technology', 'https://cdt.org/feed/', 'ADVOCACY', 1, 'ACTIVE', NOW(), NOW()),
('Electronic Privacy Information Center', 'https://epic.org/feed/', 'ADVOCACY', 1, 'ACTIVE', NOW(), NOW()),
('American Civil Liberties Union', 'https://www.aclu.org/feed', 'ADVOCACY', 1, 'ACTIVE', NOW(), NOW()),
('National Organization for Women', 'https://now.org/feed/', 'ADVOCACY', 1, 'ACTIVE', NOW(), NOW()),

-- International Sources
('European Commission Digital', 'https://ec.europa.eu/digital-single-market/en/rss', 'INTERNATIONAL', 2, 'ACTIVE', NOW(), NOW()),
('UN Human Rights', 'https://www.ohchr.org/en/rss-feeds/news-feed', 'INTERNATIONAL', 2, 'ACTIVE', NOW(), NOW()),
('AI Ethics Global', 'https://aiethics.org/feed/', 'INTERNATIONAL', 2, 'ACTIVE', NOW(), NOW());

-- Insert sample metrics
INSERT INTO "SystemMetrics" (id, total_articles, michigan_articles, national_articles, international_articles, high_severity_articles, processing_rate, last_rss_fetch, created_at, updated_at) VALUES
(1, 15, 5, 5, 3, 5, 95.5, NOW(), NOW(), NOW());

-- Display results
SELECT 
    category,
    COUNT(*) as feed_count,
    AVG(priority) as avg_priority
FROM "Feed" 
GROUP BY category
ORDER BY feed_count DESC;

SELECT 'Database seeded successfully! Total feeds: ' || COUNT(*) as result FROM "Feed";