import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const rssFeeds = [
  // Civil Rights Organizations
  { name: 'ACLU News', url: 'https://www.aclu.org/news/feed', category: 'CIVIL_RIGHTS', priority: 1 },
  { name: 'NAACP News', url: 'https://naacp.org/feed/', category: 'CIVIL_RIGHTS', priority: 1 },
  { name: 'Southern Poverty Law Center', url: 'https://www.splcenter.org/rss.xml', category: 'CIVIL_RIGHTS', priority: 1 },
  { name: 'Anti-Defamation League', url: 'https://www.adl.org/rss/news.xml', category: 'CIVIL_RIGHTS', priority: 1 },
  { name: 'Electronic Frontier Foundation', url: 'https://www.eff.org/rss/updates.xml', category: 'CIVIL_RIGHTS', priority: 1 },
  
  // Michigan-Specific Sources
  { name: 'Michigan Department of Civil Rights', url: 'https://www.michigan.gov/mdcr/feed', category: 'MICHIGAN_LOCAL', priority: 1 },
  { name: 'Detroit Free Press Civil Rights', url: 'https://www.freep.com/feeds/rss/civil-rights/', category: 'MICHIGAN_LOCAL', priority: 1 },
  { name: 'MLive Michigan News', url: 'https://www.mlive.com/news/rss.xml', category: 'MICHIGAN_LOCAL', priority: 2 },
  { name: 'Michigan Radio News', url: 'https://www.michiganradio.org/news/feed', category: 'MICHIGAN_LOCAL', priority: 2 },
  { name: 'Bridge Michigan', url: 'https://www.bridgemi.com/rss.xml', category: 'MICHIGAN_LOCAL', priority: 2 },
  
  // Government Sources
  { name: 'EEOC News', url: 'https://www.eeoc.gov/newsroom/rss_feeds/press_releases.xml', category: 'GOVERNMENT', priority: 1 },
  { name: 'Department of Justice Civil Rights', url: 'https://www.justice.gov/crt/rss', category: 'GOVERNMENT', priority: 1 },
  { name: 'FTC Technology News', url: 'https://www.ftc.gov/news-events/rss-feeds/technology', category: 'GOVERNMENT', priority: 2 },
  { name: 'White House Technology Policy', url: 'https://www.whitehouse.gov/ostp/rss/', category: 'GOVERNMENT', priority: 2 },
  { name: 'Congress AI Caucus Updates', url: 'https://www.congress.gov/rss/ai-updates.xml', category: 'GOVERNMENT', priority: 2 },
  
  // Academic and Research
  { name: 'AI Now Institute', url: 'https://ainowinstitute.org/feed/', category: 'ACADEMIC', priority: 1 },
  { name: 'Algorithmic Justice League', url: 'https://www.ajl.org/rss', category: 'ACADEMIC', priority: 1 },
  { name: 'Brookings AI Governance', url: 'https://www.brookings.edu/topic/artificial-intelligence/feed/', category: 'ACADEMIC', priority: 2 },
  { name: 'Stanford HAI News', url: 'https://hai.stanford.edu/news/rss', category: 'ACADEMIC', priority: 2 },
  { name: 'MIT Technology Review AI', url: 'https://www.technologyreview.com/tag/artificial-intelligence/feed/', category: 'ACADEMIC', priority: 1 },
  { name: 'Berkeley CAIR', url: 'https://cair.berkeley.edu/feed/', category: 'ACADEMIC', priority: 2 },
  { name: 'Carnegie Mellon AI Policy', url: 'https://www.cmu.edu/ai-policy/feed/', category: 'ACADEMIC', priority: 2 },
  { name: 'University of Michigan AI Ethics', url: 'https://aiethics.umich.edu/feed/', category: 'ACADEMIC', priority: 1 },
  
  // Technology News
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'TECH_NEWS', priority: 2 },
  { name: 'Wired AI', url: 'https://www.wired.com/tag/artificial-intelligence/feed/', category: 'TECH_NEWS', priority: 2 },
  { name: 'Ars Technica AI', url: 'https://arstechnica.com/tag/artificial-intelligence/feed/', category: 'TECH_NEWS', priority: 2 },
  { name: 'IEEE Spectrum AI', url: 'https://spectrum.ieee.org/artificial-intelligence/rss', category: 'TECH_NEWS', priority: 2 },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/ai/feed/', category: 'TECH_NEWS', priority: 2 },
  { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', category: 'TECH_NEWS', priority: 2 },
  { name: 'ZDNet AI', url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', category: 'TECH_NEWS', priority: 3 },
  
  // Legal Publications
  { name: 'American Bar Association Tech Law', url: 'https://www.americanbar.org/groups/law_practice/publications/techreport/rss/', category: 'LEGAL', priority: 2 },
  { name: 'Law360 Employment', url: 'https://www.law360.com/employment/rss', category: 'LEGAL', priority: 2 },
  { name: 'National Law Review AI', url: 'https://www.natlawreview.com/rss/artificial-intelligence', category: 'LEGAL', priority: 2 },
  { name: 'JD Supra AI Law', url: 'https://www.jdsupra.com/legalnews/artificial-intelligence/rss/', category: 'LEGAL', priority: 2 },
  { name: 'Legal Technology News', url: 'https://www.law.com/legaltechnews/rss/', category: 'LEGAL', priority: 3 },
  
  // Healthcare and Medical
  { name: 'Healthcare IT News AI', url: 'https://www.healthcareitnews.com/artificial-intelligence/feed', category: 'HEALTHCARE', priority: 2 },
  { name: 'STAT AI Healthcare', url: 'https://www.statnews.com/tag/artificial-intelligence/feed/', category: 'HEALTHCARE', priority: 2 },
  { name: 'Modern Healthcare AI', url: 'https://www.modernhealthcare.com/artificial-intelligence/rss', category: 'HEALTHCARE', priority: 3 },
  { name: 'American Medical Association AI', url: 'https://www.ama-assn.org/practice-management/digital/ai-feed', category: 'HEALTHCARE', priority: 2 },
  
  // Employment and HR
  { name: 'SHRM AI Employment', url: 'https://www.shrm.org/resourcesandtools/hr-topics/technology/rss/ai-employment.xml', category: 'EMPLOYMENT', priority: 2 },
  { name: 'HR Executive AI', url: 'https://hrexecutive.com/artificial-intelligence/feed/', category: 'EMPLOYMENT', priority: 2 },
  { name: 'Workforce Magazine AI', url: 'https://www.workforce.com/tag/artificial-intelligence/feed/', category: 'EMPLOYMENT', priority: 3 },
  { name: 'Human Resource Executive', url: 'https://hrexecutive.com/feed/', category: 'EMPLOYMENT', priority: 3 },
  
  // Data Ethics and AI Ethics
  { name: 'Partnership on AI', url: 'https://www.partnershiponai.org/feed/', category: 'DATA_ETHICS', priority: 1 },
  { name: 'Future of Humanity Institute', url: 'https://www.fhi.ox.ac.uk/feed/', category: 'DATA_ETHICS', priority: 2 },
  { name: 'AI Ethics Lab', url: 'https://aiethicslab.com/feed/', category: 'DATA_ETHICS', priority: 2 },
  { name: 'Ethics in AI Design', url: 'https://ethicsinaidesign.org/feed/', category: 'DATA_ETHICS', priority: 2 },
  { name: 'Responsible AI Institute', url: 'https://responsibleai.org/feed/', category: 'DATA_ETHICS', priority: 2 },
  
  // Advocacy Organizations
  { name: 'Color of Change', url: 'https://colorofchange.org/feed/', category: 'ADVOCACY', priority: 1 },
  { name: 'Fight for the Future', url: 'https://www.fightforthefuture.org/rss/', category: 'ADVOCACY', priority: 1 },
  { name: 'Center for Democracy & Technology', url: 'https://cdt.org/feed/', category: 'ADVOCACY', priority: 1 },
  { name: 'Data for Black Lives', url: 'https://d4bl.org/feed/', category: 'ADVOCACY', priority: 1 },
  { name: 'Tech Transparency Project', url: 'https://www.techtransparencyproject.org/feed/', category: 'ADVOCACY', priority: 2 },
  
  // International Sources
  { name: 'EU AI Act Updates', url: 'https://ec.europa.eu/digital-single-market/en/artificial-intelligence/rss', category: 'LEGAL', priority: 2 },
  { name: 'AlgorithmWatch', url: 'https://algorithmwatch.org/en/feed/', category: 'DATA_ETHICS', priority: 1 },
  { name: 'AI Global Governance', url: 'https://ai-global.org/feed/', category: 'ACADEMIC', priority: 2 },
  
  // News Aggregators and Major Publications
  { name: 'Reuters AI News', url: 'https://www.reuters.com/technology/artificial-intelligence/rss', category: 'TECH_NEWS', priority: 2 },
  { name: 'Associated Press AI', url: 'https://apnews.com/artificial-intelligence/rss', category: 'TECH_NEWS', priority: 2 },
  { name: 'NPR Technology', url: 'https://feeds.npr.org/1019/rss.xml', category: 'TECH_NEWS', priority: 2 },
  { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', category: 'TECH_NEWS', priority: 2 },
  { name: 'CNN Tech', url: 'http://rss.cnn.com/rss/edition_technology.rss', category: 'TECH_NEWS', priority: 3 },
  { name: 'Washington Post AI', url: 'https://www.washingtonpost.com/technology/artificial-intelligence/rss/', category: 'TECH_NEWS', priority: 2 },
  { name: 'New York Times AI', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'TECH_NEWS', priority: 2 },
  
  // Industry-Specific
  { name: 'Financial Services AI', url: 'https://www.americanbanker.com/artificial-intelligence/feed', category: 'TECH_NEWS', priority: 3 },
  { name: 'Education Week AI', url: 'https://www.edweek.org/technology/artificial-intelligence/rss', category: 'TECH_NEWS', priority: 3 },
  { name: 'Government Technology AI', url: 'https://www.govtech.com/artificial-intelligence/feed', category: 'GOVERNMENT', priority: 3 },
  
  // Research Publications
  { name: 'Nature Machine Intelligence', url: 'https://www.nature.com/natmachintell.rss', category: 'ACADEMIC', priority: 2 },
  { name: 'Science AI News', url: 'https://www.science.org/topic/ai/rss', category: 'ACADEMIC', priority: 2 },
  { name: 'arXiv AI Ethics', url: 'http://export.arxiv.org/rss/cs.AI', category: 'ACADEMIC', priority: 3 },
  
  // Professional Organizations
  { name: 'ACM AI Ethics', url: 'https://www.acm.org/media-center/rss-feeds/ai-ethics', category: 'ACADEMIC', priority: 2 },
  { name: 'IEEE AI Standards', url: 'https://standards.ieee.org/artificial-intelligence/feed/', category: 'ACADEMIC', priority: 2 },
  { name: 'AAAI AI Policy', url: 'https://www.aaai.org/about-aaai/aaai-activities/ai-policy/rss/', category: 'ACADEMIC', priority: 2 },
  
  // Disability Rights
  { name: 'National Disability Rights Network', url: 'https://www.ndrn.org/feed/', category: 'CIVIL_RIGHTS', priority: 1 },
  { name: 'Disability Rights Education Fund', url: 'https://dredf.org/feed/', category: 'CIVIL_RIGHTS', priority: 1 },
  { name: 'National Federation of the Blind', url: 'https://nfb.org/feed', category: 'CIVIL_RIGHTS', priority: 1 },
  
  // Religious Rights
  { name: 'Religious Freedom Institute', url: 'https://www.religiousfreedom.org/feed/', category: 'CIVIL_RIGHTS', priority: 2 },
  { name: 'First Amendment Center', url: 'https://www.freedomforum.org/first-amendment-center/feed/', category: 'CIVIL_RIGHTS', priority: 2 },
  
  // Think Tanks and Policy
  { name: 'Center for American Progress AI', url: 'https://www.americanprogress.org/tag/artificial-intelligence/feed/', category: 'ACADEMIC', priority: 2 },
  { name: 'Heritage Foundation Tech', url: 'https://www.heritage.org/technology/rss', category: 'ACADEMIC', priority: 3 },
  { name: 'Cato Institute Tech Policy', url: 'https://www.cato.org/technology-policy/rss', category: 'ACADEMIC', priority: 3 },
]

async function main() {
  console.log('🌱 Seeding RSS feeds...')
  
  // Create feeds
  for (const feedData of rssFeeds) {
    const feed = await prisma.feed.create({
      data: {
        name: feedData.name,
        url: feedData.url,
        category: feedData.category as any,
        isActive: true,
        status: 'ACTIVE',
        successRate: 1.0,
        priority: feedData.priority,
      },
    })
    console.log(`✅ Created feed: ${feed.name}`)
  }
  
  console.log(`🎉 Successfully seeded ${rssFeeds.length} RSS feeds!`)
  
  // Create sample system metrics
  await prisma.systemMetrics.create({
    data: {
      date: new Date(),
      totalFeeds: rssFeeds.length,
      activeFeeds: rssFeeds.length,
      successfulFeeds: Math.floor(rssFeeds.length * 0.95),
      failedFeeds: Math.floor(rssFeeds.length * 0.05),
      totalArticles: 0,
      michiganArticles: 0,
      nationalArticles: 0,
      internationalArticles: 0,
      avgProcessingTime: 45000,
      classificationAccuracy: 0.85,
      duplicateDetectionRate: 0.95,
      dailyActiveUsers: 0,
      exportDownloads: 0,
    },
  })
  
  console.log('✅ Created initial system metrics')
  console.log('🚀 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })