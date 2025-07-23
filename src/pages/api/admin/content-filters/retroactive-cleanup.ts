import { NextApiRequest, NextApiResponse } from 'next';
import { RetroactiveFilterService } from '../../../../services/retroactive-filter.service';

interface CleanupRequestBody {
  dryRun?: boolean;
  batchSize?: number;
  maxArticlesToDelete?: number;
  preserveRecentArticles?: boolean;
  recentArticleThresholdDays?: number;
  confirmed?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      dryRun = true,
      batchSize = 100,
      maxArticlesToDelete,
      preserveRecentArticles = false,
      recentArticleThresholdDays = 30,
      confirmed = false,
    }: CleanupRequestBody = req.body;

    // Safety check: require explicit confirmation for non-dry-run operations
    if (!dryRun && !confirmed) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required for destructive operations. Set confirmed: true in request body.',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🧹 Starting retroactive cleanup (dryRun: ${dryRun})...`);
    console.log(`⚙️ Options:`, {
      dryRun,
      batchSize,
      maxArticlesToDelete,
      preserveRecentArticles,
      recentArticleThresholdDays,
    });
    
    const filterService = new RetroactiveFilterService();
    
    const cleanupResult = await filterService.cleanupExistingArticles({
      dryRun,
      batchSize,
      maxArticlesToDelete,
      preserveRecentArticles,
      recentArticleThresholdDays,
    });
    
    await filterService.cleanup();

    const logMessage = dryRun 
      ? '✅ Retroactive cleanup analysis completed successfully'
      : '✅ Retroactive cleanup executed successfully';
    
    console.log(logMessage);
    console.log(`📊 Results: ${cleanupResult.articlesDeleted} deleted, ${cleanupResult.articlesPreserved} preserved`);
    
    res.status(200).json({
      success: true,
      data: cleanupResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error during retroactive cleanup:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

// Set longer timeout for cleanup operations
export const config = {
  api: {
    responseTimeout: 600000, // 10 minutes
  },
};