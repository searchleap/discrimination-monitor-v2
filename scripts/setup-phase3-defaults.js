#!/usr/bin/env node
/**
 * Setup Phase 3 Default Configurations
 * Initializes alert configs, AI providers, and processing schedules
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupPhase3Defaults() {
  console.log('⚙️ Setting up Phase 3 default configurations...')
  
  try {
    // Check and create AI Providers
    const existingProviders = await prisma.aIProvider.count()
    if (existingProviders === 0) {
      console.log('🤖 Creating AI providers...')
      
      await prisma.aIProvider.createMany({
        data: [
          {
            id: 'openai',
            name: 'OpenAI GPT-4o',
            type: 'OPENAI',
            endpoint: 'https://api.openai.com/v1',
            enabled: true,
            priority: 1,
            costPerToken: 0.0000025, // $2.50 per 1M tokens
            requestCount: 0,
            successRate: 0.95,
            averageLatency: 2500,
            errorCount: 0,
            estimatedCost: 0.0,
            lastUsed: new Date()
          },
          {
            id: 'anthropic',
            name: 'Anthropic Claude 3.5 Sonnet',
            type: 'ANTHROPIC',
            endpoint: 'https://api.anthropic.com/v1',
            enabled: false, // Start with OpenAI as primary
            priority: 2,
            costPerToken: 0.000003, // $3.00 per 1M tokens
            requestCount: 0,
            successRate: 0.97,
            averageLatency: 1800,
            errorCount: 0,
            estimatedCost: 0.0,
            lastUsed: new Date()
          }
        ]
      })
      console.log('✅ AI providers created')
    } else {
      console.log(`🤖 Found ${existingProviders} existing AI providers`)
    }
    
    // Check and create Alert Configurations
    const existingAlerts = await prisma.alertConfig.count()
    if (existingAlerts === 0) {
      console.log('🚨 Creating alert configurations...')
      
      await prisma.alertConfig.createMany({
        data: [
          {
            id: 'queue-backlog-warning',
            name: 'Queue Backlog Warning',
            type: 'QUEUE_BACKLOG',
            enabled: true,
            severity: 'MEDIUM',
            threshold: 50,
            cooldownPeriod: 300000, // 5 minutes
            channels: ['email'],
            message: 'Processing queue has {{value}} items (threshold: {{threshold}})',
            escalationRules: { maxEscalations: 2, escalationInterval: 600000 },
            tags: ['performance', 'queue']
          },
          {
            id: 'processing-failures-critical',
            name: 'Processing Failures Critical',
            type: 'PROCESSING_FAILURE',
            enabled: true,
            severity: 'HIGH',
            threshold: 10, // 10% error rate
            cooldownPeriod: 600000, // 10 minutes
            channels: ['email', 'webhook'],
            message: 'High processing failure rate: {{value}}% (threshold: {{threshold}}%)',
            escalationRules: { maxEscalations: 3, escalationInterval: 900000 },
            tags: ['critical', 'processing']
          },
          {
            id: 'system-health-degraded',
            name: 'System Health Degraded',
            type: 'SYSTEM_HEALTH',
            enabled: true,
            severity: 'MEDIUM',
            threshold: 70, // Health score below 70
            cooldownPeriod: 900000, // 15 minutes
            channels: ['email'],
            message: 'System health score degraded: {{value}}/100 (threshold: {{threshold}})',
            escalationRules: { maxEscalations: 2, escalationInterval: 1800000 },
            tags: ['health', 'performance']
          },
          {
            id: 'latency-warning',
            name: 'High Latency Warning',
            type: 'LATENCY',
            enabled: true,
            severity: 'LOW',
            threshold: 5000, // 5 seconds
            cooldownPeriod: 600000, // 10 minutes
            channels: ['email'],
            message: 'High processing latency detected: {{value}}ms (threshold: {{threshold}}ms)',
            escalationRules: { maxEscalations: 1, escalationInterval: 1200000 },
            tags: ['performance', 'latency']
          },
          {
            id: 'memory-usage-critical',
            name: 'Memory Usage Critical',
            type: 'MEMORY_USAGE',
            enabled: true,
            severity: 'HIGH',
            threshold: 90, // 90% memory usage
            cooldownPeriod: 300000, // 5 minutes
            channels: ['email', 'webhook'],
            message: 'Critical memory usage: {{value}}% (threshold: {{threshold}}%)',
            escalationRules: { maxEscalations: 3, escalationInterval: 600000 },
            tags: ['critical', 'resources']
          }
        ]
      })
      console.log('✅ Alert configurations created')
    } else {
      console.log(`🚨 Found ${existingAlerts} existing alert configurations`)
    }
    
    // Check and create Processing Schedules
    const existingSchedules = await prisma.processingSchedule.count()
    if (existingSchedules === 0) {
      console.log('📅 Creating processing schedules...')
      
      await prisma.processingSchedule.createMany({
        data: [
          {
            id: 'high-priority-processing',
            name: 'High Priority Processing',
            cronExpression: '*/5 * * * *', // Every 5 minutes
            taskType: 'AI_CLASSIFICATION',
            priority: 'HIGH',
            enabled: true,
            batchSize: 10,
            maxRetries: 3,
            retryDelay: 60000, // 1 minute
            slaThreshold: 600000, // 10 minutes
            description: 'High priority article classification every 5 minutes'
          },
          {
            id: 'regular-processing',
            name: 'Regular Processing',
            cronExpression: '*/30 * * * *', // Every 30 minutes
            taskType: 'AI_CLASSIFICATION',
            priority: 'MEDIUM',
            enabled: true,
            batchSize: 25,
            maxRetries: 2,
            retryDelay: 120000, // 2 minutes
            slaThreshold: 1800000, // 30 minutes
            description: 'Regular article classification every 30 minutes'
          },
          {
            id: 'overnight-cleanup',
            name: 'Overnight Cleanup',
            cronExpression: '0 2 * * *', // Daily at 2 AM
            taskType: 'CLEANUP',
            priority: 'LOW',
            enabled: true,
            batchSize: 100,
            maxRetries: 1,
            retryDelay: 300000, // 5 minutes
            slaThreshold: 3600000, // 1 hour
            description: 'Daily cleanup and maintenance tasks'
          }
        ]
      })
      console.log('✅ Processing schedules created')
    } else {
      console.log(`📅 Found ${existingSchedules} existing processing schedules`)
    }
    
    // Verify setup
    const summary = {
      providers: await prisma.aIProvider.count(),
      alerts: await prisma.alertConfig.count(),
      schedules: await prisma.processingSchedule.count(),
      metrics: await prisma.processingMetrics.count()
    }
    
    console.log('\n📊 Phase 3 Setup Summary:')
    console.log(`  AI Providers: ${summary.providers}`)
    console.log(`  Alert Configs: ${summary.alerts}`)
    console.log(`  Processing Schedules: ${summary.schedules}`)
    console.log(`  Metrics Records: ${summary.metrics}`)
    console.log('\n🎉 Phase 3 default configurations setup complete!')
    
  } catch (error) {
    console.error('❌ Error setting up Phase 3 defaults:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
setupPhase3Defaults()