#!/usr/bin/env node
/**
 * Generate Baseline Metrics Script
 * Creates realistic historical metrics data for analytics dashboard
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateBaselineMetrics() {
  console.log('🔍 Generating baseline metrics data...')
  
  try {
    // Check if recent metrics exist (last 30 minutes)
    const recentCount = await prisma.processingMetrics.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    })
    
    const existingCount = await prisma.processingMetrics.count()
    console.log(`📊 Found ${existingCount} total metrics records, ${recentCount} recent`)
    
    if (recentCount > 10) {
      console.log('✅ Recent baseline metrics already exist, skipping generation')
      return
    } else if (existingCount > 0) {
      console.log('🔄 Generating fresh recent metrics data...')
    }

    const now = new Date()
    const metrics = []
    
    // Generate metrics for the last 2 hours, every 5 minutes (for recent data)
    // Plus some historical data for trends
    const timeRanges = [
      { days: 0, hours: 2, interval: 5 }, // Last 2 hours, every 5 min
      { days: 1, hours: 24, interval: 30 }, // Last day, every 30 min  
      { days: 7, hours: 24, interval: 60 }  // Last week, hourly
    ]
    
    for (const range of timeRanges) {
      for (let days = range.days; days >= 0; days--) {
        for (let hours = 0; hours < range.hours; hours++) {
          for (let minutes = 0; minutes < 60; minutes += range.interval) {
            const timestamp = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000))
          
          // Generate realistic metrics with some variation
          const baseProcessedCount = Math.floor(Math.random() * 10 + 5) // 5-15 articles
          const errorRate = Math.random() * 0.05 + 0.01 // 1-6% error rate
          const errorCount = Math.floor(baseProcessedCount * errorRate)
          const successCount = baseProcessedCount - errorCount
          const processingTime = Math.floor(Math.random() * 2000 + 1000) // 1-3 seconds per batch
          const queueDepth = Math.floor(Math.random() * 50 + 10) // 10-60 items in queue
          
          // Calculate derived metrics
          const throughput = baseProcessedCount > 0 ? (baseProcessedCount / (processingTime / 1000)) * 60 : 0
          const averageLatency = baseProcessedCount > 0 ? processingTime / baseProcessedCount : 0
          const errorRatePercent = baseProcessedCount > 0 ? (errorCount / baseProcessedCount) * 100 : 0
          
          metrics.push({
            timestamp,
            batchSize: Math.floor(Math.random() * 5 + 5), // 5-10 batch size
            processedCount: baseProcessedCount,
            successCount,
            errorCount,
            processingTime,
            queueDepth,
            workerStatus: errorRatePercent > 10 ? 'degraded' : 'healthy',
            providerId: Math.random() > 0.8 ? 'anthropic' : 'openai', // 80% OpenAI, 20% Anthropic
            throughput,
            averageLatency,
            errorRate: errorRatePercent,
            memoryUsage: Math.floor(Math.random() * 30 + 40), // 40-70% memory usage
            cpuUsage: Math.floor(Math.random() * 40 + 20) // 20-60% CPU usage
          })
          }
        }
      }
    }
    
    console.log(`📝 Generated ${metrics.length} metric records`)
    
    // Insert metrics in batches to avoid overwhelming the database
    const batchSize = 100
    for (let i = 0; i < metrics.length; i += batchSize) {
      const batch = metrics.slice(i, i + batchSize)
      await prisma.processingMetrics.createMany({
        data: batch
      })
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(metrics.length / batchSize)}`)
    }
    
    console.log('🎉 Baseline metrics generation complete!')
    
    // Verify data
    const totalCount = await prisma.processingMetrics.count()
    const avgThroughput = await prisma.processingMetrics.aggregate({
      _avg: {
        throughput: true,
        errorRate: true
      }
    })
    
    console.log(`📊 Total metrics records: ${totalCount}`)
    console.log(`📈 Average throughput: ${avgThroughput._avg.throughput?.toFixed(2)} items/min`)
    console.log(`📉 Average error rate: ${avgThroughput._avg.errorRate?.toFixed(2)}%`)
    
  } catch (error) {
    console.error('❌ Error generating baseline metrics:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
generateBaselineMetrics()