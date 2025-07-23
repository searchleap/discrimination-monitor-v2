import { NextRequest, NextResponse } from 'next/server';
import { ServerlessAIWorker } from '@/lib/serverless-ai-worker';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  // Verify this is a legitimate cron request from Vercel
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid cron secret' },
      { status: 401 }
    );
  }

  try {
    console.log('Cron job: Starting automated queue processing');
    
    // Check if there are pending articles
    const pendingCount = await prisma.processingQueue.count({
      where: { status: 'PENDING' }
    });

    if (pendingCount === 0) {
      console.log('Cron job: No pending articles to process');
      return NextResponse.json({
        message: 'No pending articles',
        pendingCount,
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Cron job: Found ${pendingCount} pending articles`);
    
    // Use existing serverless worker to process articles
    const worker = new ServerlessAIWorker({
      batchSize: 5,
      maxProcessingTime: 540000 // 9 minutes (safe buffer for 10min limit)
    });
    const result = await worker.startProcessing();

    console.log('Cron job: Processing complete', {
      batchesCompleted: result.summary?.batchesCompleted || 0,
      totalProcessed: result.summary?.totalProcessed || 0,
      success: result.success
    });

    return NextResponse.json({
      message: 'Automated processing completed',
      success: result.success,
      summary: result.summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job: Error during processing:', error);
    
    return NextResponse.json(
      { 
        message: 'Cron processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST method for manual triggering with cron authorization
export async function POST(request: NextRequest) {
  return GET(request);
}