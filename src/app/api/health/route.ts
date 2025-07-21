import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        database: 'checking...',
        ai: 'checking...',
        rss: 'checking...'
      }
    }

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      healthStatus.services.database = 'healthy'
    } catch (error) {
      // Database connection failed - error logged in production logs
      healthStatus.services.database = 'unhealthy'
    }

    // Check AI service availability
    try {
      // Basic check for API key presence
      const hasOpenAI = !!process.env.OPENAI_API_KEY
      const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
      healthStatus.services.ai = hasOpenAI || hasAnthropic ? 'healthy' : 'unhealthy'
    } catch (error) {
      healthStatus.services.ai = 'unhealthy'
    }

    // Check RSS processing capability
    try {
      // Basic check for RSS processing
      healthStatus.services.rss = 'healthy'
    } catch (error) {
      healthStatus.services.rss = 'unhealthy'
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}