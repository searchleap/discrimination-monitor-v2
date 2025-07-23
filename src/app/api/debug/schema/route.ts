import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check which tables exist by trying to count records
    const tableStatus = {}
    
    const tables = [
      'Article',
      'Feed', 
      'ProcessingLog',
      'ProcessingMetrics',
      'AlertConfig',
      'AlertHistory',
      'AIProvider',
      'ProcessingSchedule',
      'ScheduleExecution'
    ]
    
    for (const table of tables) {
      try {
        let count = 0
        switch (table) {
          case 'Article':
            count = await prisma.article.count()
            break
          case 'Feed':
            count = await prisma.feed.count()
            break
          case 'ProcessingLog':
            count = await prisma.processingLog.count()
            break
          case 'ProcessingMetrics':
            count = await prisma.processingMetrics.count()
            break
          case 'AlertConfig':
            count = await prisma.alertConfig.count()
            break
          case 'AlertHistory':
            count = await prisma.alertHistory.count()
            break
          case 'AIProvider':
            count = await prisma.aIProvider.count()
            break
          case 'ProcessingSchedule':
            count = await prisma.processingSchedule.count()
            break
          case 'ScheduleExecution':
            count = await prisma.scheduleExecution.count()
            break
        }
        tableStatus[table] = { exists: true, count }
      } catch (error) {
        tableStatus[table] = { 
          exists: false, 
          error: error.message,
          code: error.code 
        }
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableStatus,
      database: process.env.DATABASE_URL ? 'configured' : 'not_configured'
    })
  } catch (error) {
    console.error('Schema check failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}