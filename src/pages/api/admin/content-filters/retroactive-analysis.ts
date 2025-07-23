import { NextApiRequest, NextApiResponse } from 'next';
import { RetroactiveFilterService } from '../../../../services/retroactive-filter.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Starting retroactive analysis...');
    
    const filterService = new RetroactiveFilterService();
    const analysisResult = await filterService.analyzeExistingArticles();
    
    await filterService.cleanup();

    console.log('✅ Retroactive analysis completed successfully');
    
    res.status(200).json({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error during retroactive analysis:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

// Set longer timeout for analysis operations
export const config = {
  api: {
    responseTimeout: 300000, // 5 minutes
  },
};