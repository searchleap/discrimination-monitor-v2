import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Test each critical table
    const tableTests = [
      { name: 'ProcessingQueue', test: () => prisma.processingQueue.count() },
      { name: 'AIProvider', test: () => prisma.aIProvider.count() },
      { name: 'ProcessingMetrics', test: () => prisma.processingMetrics.count() },
      { name: 'AlertConfig', test: () => prisma.alertConfig.count() },
    ]
    
    const results = []
    let missingTables = 0
    
    for (const table of tableTests) {
      try {
        const count = await table.test()
        results.push({
          table: table.name,
          status: 'exists',
          count,
          message: `Table exists with ${count} records`
        })
      } catch (error) {
        missingTables++
        results.push({
          table: table.name,
          status: 'missing',
          count: 0,
          message: `Table missing or inaccessible: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
    
    if (missingTables > 0) {
      // Try to create missing tables using direct SQL
      try {
        // Execute the Prisma schema push equivalent through raw SQL
        await prisma.$executeRaw`
          -- This would normally be handled by prisma db push
          -- For now, we'll report the issue
          SELECT 1;
        `
        
        return NextResponse.json({
          success: false,
          message: `Found ${missingTables} missing tables. Manual database migration required.`,
          tables: results,
          instructions: [
            'Run the following commands in your deployment environment:',
            '1. npx prisma generate',
            '2. npx prisma db push --accept-data-loss',
            '3. Restart the application',
            '',
            'Or use the fix script:',
            'node scripts/fix-production-database.js'
          ]
        })
      } catch (fixError) {
        return NextResponse.json({
          success: false,
          message: 'Cannot automatically fix missing tables',
          tables: results,
          error: fixError instanceof Error ? fixError.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'All required tables exist',
      tables: results
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database check failed',
        message: 'Failed to check database tables'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Just return the table status without trying to fix
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const tableTests = [
      { name: 'Article', test: () => prisma.article.count() },
      { name: 'Feed', test: () => prisma.feed.count() },
      { name: 'ProcessingQueue', test: () => prisma.processingQueue.count() },
      { name: 'ProcessingLog', test: () => prisma.processingLog.count() },
      { name: 'AIProvider', test: () => prisma.aIProvider.count() },
      { name: 'ProcessingMetrics', test: () => prisma.processingMetrics.count() },
      { name: 'AlertConfig', test: () => prisma.alertConfig.count() },
    ]
    
    const results = []
    
    for (const table of tableTests) {
      try {
        const count = await table.test()
        results.push({
          table: table.name,
          status: 'exists',
          count,
          message: `${count} records`
        })
      } catch (error) {
        results.push({
          table: table.name,
          status: 'missing',
          count: 0,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const missingCount = results.filter(r => r.status === 'missing').length
    
    return NextResponse.json({
      success: missingCount === 0,
      message: missingCount === 0 ? 'All tables exist' : `${missingCount} tables missing`,
      tables: results,
      summary: {
        total: results.length,
        existing: results.length - missingCount,
        missing: missingCount
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database check failed' 
      },
      { status: 500 }
    )
  }
}