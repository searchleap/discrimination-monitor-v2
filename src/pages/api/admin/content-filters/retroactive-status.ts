import { NextApiRequest, NextApiResponse } from 'next';
import { RetroactiveFilterService } from '../../../../services/retroactive-filter.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filterService = new RetroactiveFilterService();
    const progressStatus = await filterService.getCleanupProgress();
    
    await filterService.cleanup();

    res.status(200).json({
      success: true,
      data: progressStatus,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error getting cleanup status:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}