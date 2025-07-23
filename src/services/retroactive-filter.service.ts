import { PrismaClient } from '@prisma/client';
import { contentFilterMatcher } from '../lib/content-filter';

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

interface CleanupOptions {
  dryRun: boolean;
  batchSize: number;
  maxArticlesToDelete?: number;
  preserveRecentArticles?: boolean;
  recentArticleThresholdDays?: number;
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
    deletedByFilter: Record<string, number>;
    deletedBySource: Record<string, number>;
    deletedByDate: Record<string, number>;
  };
}

interface BatchResult {
  processed: number;
  toDelete: string[];
  toKeep: string[];
  filterMatches: Record<string, number>;
}

export class RetroactiveFilterService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Analyze existing articles without making changes
   */
  async analyzeExistingArticles(): Promise<FilterAnalysisResult> {
    console.log('🔍 Starting retroactive analysis of existing articles...');
    
    const startTime = Date.now();
    
    // Get total count
    const totalArticles = await this.prisma.article.count();
    
    // Process in batches to avoid memory issues
    const batchSize = 100;
    let articlesToKeep = 0;
    let articlesToRemove = 0;
    const filterStats: Record<string, number> = {};
    const sampleArticlesToRemove: FilterAnalysisResult['sampleArticlesToRemove'] = [];
    
    for (let offset = 0; offset < totalArticles; offset += batchSize) {
      const articles = await this.prisma.article.findMany({
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

      const batchResult = await this.processArticlesBatch(articles);
      
      articlesToKeep += batchResult.toKeep.length;
      articlesToRemove += batchResult.toDelete.length;
      
      // Update filter statistics
      Object.entries(batchResult.filterMatches).forEach(([filter, count]) => {
        filterStats[filter] = (filterStats[filter] || 0) + count;
      });
      
      // Collect sample articles to remove (up to 20)
      if (sampleArticlesToRemove.length < 20) {
        const samplesToAdd = articles
          .filter(article => batchResult.toDelete.includes(article.id))
          .slice(0, 20 - sampleArticlesToRemove.length)
          .map(article => ({
            id: article.id,
            title: article.title,
            source: article.source,
            publishedAt: article.publishedAt,
            reason: 'No filter matches found in content',
          }));
        
        sampleArticlesToRemove.push(...samplesToAdd);
      }
      
      // Log progress
      if (offset % (batchSize * 5) === 0) { // Every 5 batches
        console.log(`📊 Processed ${offset + articles.length}/${totalArticles} articles`);
      }
    }

    const processingTime = Date.now() - startTime;

    // Get matched filter names
    const matchedFilters = Object.keys(filterStats);
    
    // Calculate estimates
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
   * Execute cleanup of articles that don't match filters
   */
  async cleanupExistingArticles(options: CleanupOptions): Promise<CleanupResult> {
    console.log(`🧹 Starting retroactive cleanup (dryRun: ${options.dryRun})...`);
    
    const startTime = Date.now();
    let articlesDeleted = 0;
    let articlesPreserved = 0;
    let totalProcessed = 0;
    const deletedArticleIds: string[] = [];
    const statistics = {
      deletedByFilter: {} as Record<string, number>,
      deletedBySource: {} as Record<string, number>,
      deletedByDate: {} as Record<string, number>,
    };

    try {
      // Get total count
      const totalArticles = await this.prisma.article.count();
      
      // Apply recent article preservation if requested
      let whereClause = {};
      if (options.preserveRecentArticles && options.recentArticleThresholdDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.recentArticleThresholdDays);
        whereClause = {
          publishedAt: {
            lt: cutoffDate,
          },
        };
      }

      const batchSize = options.batchSize || 100;
      let processedCount = 0;

      for (let offset = 0; offset < totalArticles; offset += batchSize) {
        if (options.maxArticlesToDelete && articlesDeleted >= options.maxArticlesToDelete) {
          console.log(`⏹️ Reached maximum deletion limit: ${options.maxArticlesToDelete}`);
          break;
        }

        const articles = await this.prisma.article.findMany({
          take: batchSize,
          skip: offset,
          where: whereClause,
          select: {
            id: true,
            title: true,
            content: true,
            source: true,
            publishedAt: true,
          },
        });

        if (articles.length === 0) break;

        const batchResult = await this.processArticlesBatch(articles);
        totalProcessed += batchResult.processed;
        articlesPreserved += batchResult.toKeep.length;

        // Update statistics
        articles.forEach(article => {
          if (batchResult.toDelete.includes(article.id)) {
            // By source
            const source = article.source || 'Unknown';
            statistics.deletedBySource[source] = (statistics.deletedBySource[source] || 0) + 1;
            
            // By date (month)
            const monthKey = article.publishedAt.toISOString().substring(0, 7); // YYYY-MM
            statistics.deletedByDate[monthKey] = (statistics.deletedByDate[monthKey] || 0) + 1;
          }
        });

        if (!options.dryRun && batchResult.toDelete.length > 0) {
          // Delete articles in this batch
          const deleteResult = await this.prisma.article.deleteMany({
            where: {
              id: {
                in: batchResult.toDelete,
              },
            },
          });

          articlesDeleted += deleteResult.count;
          deletedArticleIds.push(...batchResult.toDelete);

          console.log(`🗑️ Deleted ${deleteResult.count} articles in batch`);
        } else {
          // Dry run - just count
          articlesDeleted += batchResult.toDelete.length;
          deletedArticleIds.push(...batchResult.toDelete);
        }

        processedCount += articles.length;
        
        // Progress logging
        if (processedCount % (batchSize * 5) === 0) {
          console.log(`🔄 Processed ${processedCount}/${totalArticles} articles`);
          console.log(`📊 Current stats: ${articlesDeleted} to delete, ${articlesPreserved} to keep`);
        }
      }

      const processingTime = Date.now() - startTime;

      // Update filtering config statistics
      if (!options.dryRun) {
        await this.prisma.filteringConfig.updateMany({
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
        statistics: statistics as CleanupResult['statistics'],
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
        statistics: statistics as CleanupResult['statistics'],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process a batch of articles and determine which to keep/delete
   */
  private async processArticlesBatch(
    articles: Array<{ id: string; title: string; content: string; source: string; publishedAt: Date }>
  ): Promise<BatchResult> {
    const toDelete: string[] = [];
    const toKeep: string[] = [];
    const filterMatches: Record<string, number> = {};

    for (const article of articles) {
      const matchResult = await contentFilterMatcher.shouldStoreArticle(article.title, article.content);
      
      if (matchResult.shouldStore) {
        toKeep.push(article.id);
        
        // Track which filters matched
        matchResult.matchedFilters?.forEach(filter => {
          filterMatches[filter] = (filterMatches[filter] || 0) + 1;
        });
      } else {
        toDelete.push(article.id);
      }
    }

    return {
      processed: articles.length,
      toDelete,
      toKeep,
      filterMatches,
    };
  }

  /**
   * Get progress of ongoing cleanup operation
   */
  async getCleanupProgress(): Promise<{
    isRunning: boolean;
    progress?: {
      processed: number;
      total: number;
      percentage: number;
      estimatedTimeRemaining?: number;
    };
  }> {
    // This would typically be stored in Redis or similar for real-time tracking
    // For now, return a simple status
    return {
      isRunning: false,
    };
  }

  /**
   * Close database connections
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}