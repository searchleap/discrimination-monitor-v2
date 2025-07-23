import { NextRequest, NextResponse } from 'next/server';
import { aiProcessingQueue } from '@/lib/ai-queue';
import { ServerlessAIWorker } from '@/lib/serverless-ai-worker';

interface ProcessingSession {
  sessionId: string;
  startTime: number;
  batchCount: number;
  totalProcessed: number;
  maxBatches: number;
  maxExecutionTime: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json().catch(() => ({}));
    
    // Initialize or continue session
    const session: ProcessingSession = {
      sessionId: body.sessionId || `auto-${Date.now()}`,
      startTime: body.startTime || startTime,
      batchCount: (body.batchCount || 0) + 1,
      totalProcessed: body.totalProcessed || 0,
      maxBatches: body.maxBatches || 20, // Maximum batches per auto-process session
      maxExecutionTime: body.maxExecutionTime || 240000 // 4 minutes max execution time
    };

    console.log(`🔄 Auto-processing batch ${session.batchCount}/${session.maxBatches} (Session: ${session.sessionId})`);

    // Safety checks to prevent infinite loops
    const elapsedTime = startTime - session.startTime;
    if (session.batchCount > session.maxBatches) {
      console.log('🛑 Max batches reached, stopping auto-processing');
      return NextResponse.json({
        success: true,
        message: 'Auto-processing completed - max batches reached',
        session,
        finalStats: {
          totalBatches: session.batchCount - 1,
          totalProcessed: session.totalProcessed,
          totalTime: elapsedTime
        }
      });
    }

    if (elapsedTime > session.maxExecutionTime) {
      console.log('🛑 Max execution time reached, stopping auto-processing');
      return NextResponse.json({
        success: true,
        message: 'Auto-processing completed - max time reached',
        session,
        finalStats: {
          totalBatches: session.batchCount - 1,
          totalProcessed: session.totalProcessed,
          totalTime: elapsedTime
        }
      });
    }

    // Check if there are pending articles
    const queueMetrics = await aiProcessingQueue.getQueueMetrics();
    if (queueMetrics.pending === 0) {
      console.log('✅ Queue empty, auto-processing completed');
      return NextResponse.json({
        success: true,
        message: 'Auto-processing completed - queue empty',
        session,
        finalStats: {
          totalBatches: session.batchCount - 1,
          totalProcessed: session.totalProcessed,
          totalTime: elapsedTime
        }
      });
    }

    // Process current batch
    const batchResult = await aiProcessingQueue.processQueue();
    session.totalProcessed += batchResult.processed;

    console.log(`📦 Batch ${session.batchCount} completed: ${batchResult.processed} processed (${batchResult.successful} successful)`);

    // If nothing was processed in this batch, stop to prevent infinite loops
    if (batchResult.processed === 0) {
      console.log('🛑 No articles processed in batch, stopping auto-processing');
      return NextResponse.json({
        success: true,
        message: 'Auto-processing completed - no articles processed',
        session,
        batchResult,
        finalStats: {
          totalBatches: session.batchCount,
          totalProcessed: session.totalProcessed,
          totalTime: elapsedTime
        }
      });
    }

    // Check remaining queue size and trigger next batch if needed
    const remainingArticles = await aiProcessingQueue.getQueueMetrics();
    
    if (remainingArticles.pending > 0 && session.batchCount < session.maxBatches && elapsedTime < session.maxExecutionTime - 15000) {
      // Trigger next batch asynchronously (fire-and-forget)
      console.log(`🔄 Triggering next batch - ${remainingArticles.pending} articles remaining`);
      
      // Use setTimeout to trigger next batch without blocking response
      setTimeout(async () => {
        try {
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}`
            : request.nextUrl.origin;
          
          await fetch(`${baseUrl}/api/ai-queue/auto-process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...session,
              batchCount: session.batchCount // Will be incremented in next call
            })
          });
        } catch (error) {
          console.error('Error triggering next batch:', error);
        }
      }, 2000); // 2 second delay between batches
    }

    return NextResponse.json({
      success: true,
      message: `Batch ${session.batchCount} completed`,
      session,
      batchResult,
      remainingInQueue: remainingArticles.pending,
      continuingProcessing: remainingArticles.pending > 0 && session.batchCount < session.maxBatches
    });

  } catch (error) {
    console.error('❌ Auto-processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Auto-processing failed',
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

// GET method to start auto-processing
export async function GET(request: NextRequest) {
  try {
    // Check queue status first
    const queueMetrics = await aiProcessingQueue.getQueueMetrics();
    
    if (queueMetrics.pending === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles to process',
        queueMetrics
      });
    }

    // Trigger auto-processing by making a POST request to self
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : request.nextUrl.origin;
    
    const response = await fetch(`${baseUrl}/api/ai-queue/auto-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: `auto-${Date.now()}`,
        startTime: Date.now()
      })
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Auto-processing initiated',
      queueMetrics,
      initialResult: result
    });

  } catch (error) {
    console.error('Error initiating auto-processing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initiate auto-processing' 
      },
      { status: 500 }
    );
  }
}