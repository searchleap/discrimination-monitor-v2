import { PrismaClient } from '@prisma/client';

// Production database connection
const NEON_URL = "postgresql://neondb_owner:npg_AlRT2OHLKZv7@ep-green-hall-aef1l526-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: NEON_URL
    }
  }
});

interface FilterAnalysisResult {
  totalArticles: number;
  articlesToKeep: number;
  articlesToRemove: number;
  filterStats: {
    matchedFilters: string[];
    articlesPerFilter: Record<string, number>;
  };
  sampleArticlesToRemove: Array<{
    id: string;
    title: string;
    source: string;
    publishedAt: Date;
    reason: string;
  }>;
  estimatedSavings: {
    storageReduction: string;
    processingTimeReduction: string;
  };
}

interface CleanupResult {
  success: boolean;
  articlesDeleted: number;
  articlesPreserved: number;
  totalProcessed: number;
  processingTime: number;
  error?: string;
  deletedArticleIds: string[];
  statistics: {
    deletedBySource: Record<string, number>;
    deletedByDate: Record<string, number>;
  };
}

class ProductionRetroactiveFilter {
  
  /**
   * Load active filters and config from production database
   */
  async loadFiltersAndConfig() {
    const filters = await prisma.contentFilter.findMany({
      where: { isActive: true },
      orderBy: { term: 'asc' }
    });

    const config = await prisma.filteringConfig.findFirst({
      where: { isActive: true }
    });

    return { filters, config };
  }

  /**
   * Check if content matches filters based on config
   */
  async shouldKeepArticle(title: string, content: string, filters: any[], config: any): Promise<{
    shouldKeep: boolean;
    matchedFilters: string[];
  }> {
    if (!config?.isActive || filters.length === 0) {
      return { shouldKeep: true, matchedFilters: [] };
    }

    const textToCheck = `${title} ${content}`;
    const searchText = config.caseSensitive ? textToCheck : textToCheck.toLowerCase();
    const matchedFilters: string[] = [];

    for (const filter of filters) {
      const term = config.caseSensitive ? filter.term : filter.term.toLowerCase();
      if (searchText.includes(term)) {
        matchedFilters.push(filter.term);
      }
    }

    let shouldKeep = false;
    if (config.filterMode === 'OR') {
      shouldKeep = matchedFilters.length > 0;
    } else if (config.filterMode === 'AND') {
      shouldKeep = matchedFilters.length === filters.length;
    }

    return { shouldKeep, matchedFilters };
  }

  /**
   * Analyze production database articles
   */
  async analyzeProductionArticles(): Promise<FilterAnalysisResult> {
    console.log('🔍 Starting production database analysis...');
    const startTime = Date.now();

    const { filters, config } = await this.loadFiltersAndConfig();
    console.log(`📚 Loaded ${filters.length} active filters with mode: ${config?.filterMode}`);

    // Get total count
    const totalArticles = await prisma.article.count();
    console.log(`📊 Total articles to analyze: ${totalArticles}`);

    // Process in batches
    const batchSize = 100;
    let articlesToKeep = 0;
    let articlesToRemove = 0;
    const filterStats: Record<string, number> = {};
    const sampleArticlesToRemove: FilterAnalysisResult['sampleArticlesToRemove'] = [];

    for (let offset = 0; offset < totalArticles; offset += batchSize) {
      const articles = await prisma.article.findMany({
        take: batchSize,
        skip: offset,
        select: {
          id: true,
          title: true,
          content: true,
          source: true,
          publishedAt: true,
        },
      });

      for (const article of articles) {
        const { shouldKeep, matchedFilters } = await this.shouldKeepArticle(
          article.title, 
          article.content, 
          filters, 
          config
        );

        if (shouldKeep) {
          articlesToKeep++;
          matchedFilters.forEach(filter => {
            filterStats[filter] = (filterStats[filter] || 0) + 1;
          });
        } else {
          articlesToRemove++;
          if (sampleArticlesToRemove.length < 20) {
            sampleArticlesToRemove.push({
              id: article.id,
              title: article.title,
              source: article.source,
              publishedAt: article.publishedAt,
              reason: 'No filter matches found in content',
            });
          }
        }
      }

      // Progress logging
      if (offset % (batchSize * 5) === 0) {
        console.log(`📊 Processed ${offset + articles.length}/${totalArticles} articles`);
      }
    }

    const processingTime = Date.now() - startTime;
    const matchedFilters = Object.keys(filterStats);
    const avgArticleSize = 2000; // bytes
    const storageReduction = `${Math.round(articlesToRemove * avgArticleSize / 1024)} KB`;
    const processingTimeReduction = `${Math.round((articlesToRemove / totalArticles) * 100)}%`;

    console.log(`✅ Analysis complete in ${processingTime}ms`);
    console.log(`📈 Results: ${articlesToKeep} to keep, ${articlesToRemove} to remove`);

    return {
      totalArticles,
      articlesToKeep,
      articlesToRemove,
      filterStats: {
        matchedFilters,
        articlesPerFilter: filterStats,
      },
      sampleArticlesToRemove,
      estimatedSavings: {
        storageReduction,
        processingTimeReduction,
      },
    };
  }

  /**
   * Execute cleanup on production database
   */
  async cleanupProductionArticles(options: {
    dryRun: boolean;
    batchSize: number;
    maxArticlesToDelete?: number;
  }): Promise<CleanupResult> {
    console.log(`🧹 Starting production cleanup (dryRun: ${options.dryRun})...`);
    const startTime = Date.now();

    const { filters, config } = await this.loadFiltersAndConfig();
    
    let articlesDeleted = 0;
    let articlesPreserved = 0;
    let totalProcessed = 0;
    const deletedArticleIds: string[] = [];
    const statistics = {
      deletedBySource: {} as Record<string, number>,
      deletedByDate: {} as Record<string, number>,
    };

    try {
      const totalArticles = await prisma.article.count();
      const batchSize = options.batchSize || 100;

      for (let offset = 0; offset < totalArticles; offset += batchSize) {
        if (options.maxArticlesToDelete && articlesDeleted >= options.maxArticlesToDelete) {
          console.log(`⏹️ Reached maximum deletion limit: ${options.maxArticlesToDelete}`);
          break;
        }

        const articles = await prisma.article.findMany({
          take: batchSize,
          skip: offset,
          select: {
            id: true,
            title: true,
            content: true,
            source: true,
            publishedAt: true,
          },
        });

        if (articles.length === 0) break;

        const toDelete: string[] = [];
        const toKeep: string[] = [];

        for (const article of articles) {
          const { shouldKeep } = await this.shouldKeepArticle(
            article.title,
            article.content,
            filters,
            config
          );

          if (shouldKeep) {
            toKeep.push(article.id);
            articlesPreserved++;
          } else {
            toDelete.push(article.id);
            
            // Update statistics
            const source = article.source || 'Unknown';
            statistics.deletedBySource[source] = (statistics.deletedBySource[source] || 0) + 1;
            
            const monthKey = article.publishedAt.toISOString().substring(0, 7);
            statistics.deletedByDate[monthKey] = (statistics.deletedByDate[monthKey] || 0) + 1;
          }
        }

        totalProcessed += articles.length;

        if (!options.dryRun && toDelete.length > 0) {
          // Actually delete articles
          const deleteResult = await prisma.article.deleteMany({
            where: {
              id: {
                in: toDelete,
              },
            },
          });

          articlesDeleted += deleteResult.count;
          deletedArticleIds.push(...toDelete);
          console.log(`🗑️ Deleted ${deleteResult.count} articles in batch`);
        } else {
          // Dry run - just count
          articlesDeleted += toDelete.length;
          deletedArticleIds.push(...toDelete);
        }

        // Progress logging
        if (totalProcessed % (batchSize * 5) === 0) {
          console.log(`🔄 Processed ${totalProcessed}/${totalArticles} articles`);
          console.log(`📊 Current stats: ${articlesDeleted} to delete, ${articlesPreserved} to keep`);
        }
      }

      const processingTime = Date.now() - startTime;

      // Update filtering config statistics
      if (!options.dryRun) {
        await prisma.filteringConfig.updateMany({
          where: { isActive: true },
          data: {
            articlesFiltered: {
              increment: articlesDeleted,
            },
            articlesAccepted: {
              increment: articlesPreserved,
            },
            lastApplied: new Date(),
          },
        });
      }

      console.log(`✅ Cleanup complete in ${processingTime}ms`);
      console.log(`📊 Final results: ${articlesDeleted} deleted, ${articlesPreserved} preserved`);

      return {
        success: true,
        articlesDeleted,
        articlesPreserved,
        totalProcessed,
        processingTime,
        deletedArticleIds,
        statistics,
      };

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return {
        success: false,
        articlesDeleted,
        articlesPreserved,
        totalProcessed,
        processingTime: Date.now() - startTime,
        deletedArticleIds,
        statistics,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

// Export for use
export const productionRetroactiveFilter = new ProductionRetroactiveFilter();