import { PrismaClient, AlertType, AlertSeverity, ProviderType, SchedulePriority } from '@prisma/client'

const prisma = new PrismaClient()

async function setupDefaultAlerts() {
  console.log('🚀 Setting up Phase 3 default alert configurations...')

  try {
    // Clean up existing alerts (optional, for fresh setup)
    await prisma.alertConfig.deleteMany({})
    console.log('✅ Cleaned up existing alert configurations')

    // Default alert configurations
    const alertConfigs = [
      {
        name: 'High Queue Backlog',
        type: AlertType.QUEUE_BACKLOG,
        severity: AlertSeverity.HIGH,
        threshold: {
          metric: 'queueDepth',
          operator: 'gt',
          value: 50,
          timeWindow: 5
        },
        channels: [
          {
            type: 'email',
            enabled: true,
            config: {
              to: ['admin@discrimination-monitor.com'],
              subject: 'High Queue Backlog Alert'
            }
          }
        ],
        config: {
          emailSettings: {
            smtp: {
              host: 'localhost',
              port: 587
            }
          }
        },
        escalationDelay: 15, // minutes
        escalationTo: [
          {
            type: 'webhook',
            enabled: true,
            config: {
              url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
              method: 'POST'
            }
          }
        ]
      },
      {
        name: 'Critical Processing Failure Rate',
        type: AlertType.PROCESSING_FAILURE,
        severity: AlertSeverity.CRITICAL,
        threshold: {
          metric: 'errorRate',
          operator: 'gt',
          value: 25,
          timeWindow: 10
        },
        channels: [
          {
            type: 'email',
            enabled: true,
            config: {
              to: ['admin@discrimination-monitor.com', 'ops@discrimination-monitor.com']
            }
          }
        ],
        config: {
          urgentAlert: true,
          autoEscalate: true
        },
        escalationDelay: 5,
        escalationTo: [
          {
            type: 'webhook',
            enabled: true,
            config: {
              url: 'https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK'
            }
          }
        ]
      },
      {
        name: 'System Health Warning',
        type: AlertType.SYSTEM_HEALTH,
        severity: AlertSeverity.MEDIUM,
        threshold: {
          metric: 'healthScore',
          operator: 'lt',
          value: 70,
          timeWindow: 5
        },
        channels: [
          {
            type: 'email',
            enabled: true,
            config: {
              to: ['admin@discrimination-monitor.com']
            }
          }
        ],
        config: {
          healthMonitoring: true
        }
      },
      {
        name: 'High Response Time',
        type: AlertType.PERFORMANCE_DEGRADATION,
        severity: AlertSeverity.MEDIUM,
        threshold: {
          metric: 'averageLatency',
          operator: 'gt',
          value: 3000,
          timeWindow: 15
        },
        channels: [
          {
            type: 'email',
            enabled: true,
            config: {
              to: ['admin@discrimination-monitor.com']
            }
          }
        ],
        config: {
          performanceMonitoring: true
        }
      },
      {
        name: 'Memory Usage Critical',
        type: AlertType.RESOURCE_EXHAUSTION,
        severity: AlertSeverity.CRITICAL,
        threshold: {
          metric: 'memoryUsage',
          operator: 'gt',
          value: 90,
          timeWindow: 5
        },
        channels: [
          {
            type: 'email',
            enabled: true,
            config: {
              to: ['admin@discrimination-monitor.com', 'ops@discrimination-monitor.com']
            }
          }
        ],
        config: {
          resourceMonitoring: true,
          criticalAlert: true
        },
        escalationDelay: 5,
        escalationTo: [
          {
            type: 'webhook',
            enabled: true,
            config: {
              url: 'https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK'
            }
          }
        ]
      }
    ]

    // Create alert configurations
    for (const config of alertConfigs) {
      await prisma.alertConfig.create({
        data: config
      })
      console.log(`✅ Created alert: ${config.name}`)
    }

    console.log(`🎉 Successfully created ${alertConfigs.length} default alert configurations`)

  } catch (error) {
    console.error('❌ Failed to setup default alerts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function setupDefaultProviders() {
  console.log('🤖 Setting up default AI providers...')

  try {
    // Clean up existing providers
    await prisma.aIProvider.deleteMany({})
    console.log('✅ Cleaned up existing AI providers')

    const providers = [
      {
        name: 'OpenAI GPT-4',
        type: ProviderType.OPENAI,
        enabled: true,
        priority: 1,
        config: {
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY || '',
          endpoint: 'https://api.openai.com/v1',
          maxTokens: 2000,
          temperature: 0.1
        },
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 10000
        }
      },
      {
        name: 'Anthropic Claude',
        type: ProviderType.ANTHROPIC,
        enabled: false, // Disabled by default
        priority: 2,
        config: {
          model: 'claude-3-sonnet-20240229',
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          endpoint: 'https://api.anthropic.com/v1',
          maxTokens: 2000
        },
        rateLimits: {
          requestsPerMinute: 50,
          tokensPerMinute: 8000
        }
      }
    ]

    for (const provider of providers) {
      await prisma.aIProvider.create({
        data: provider
      })
      console.log(`✅ Created AI provider: ${provider.name}`)
    }

    console.log(`🎉 Successfully created ${providers.length} AI provider configurations`)

  } catch (error) {
    console.error('❌ Failed to setup AI providers:', error)
    throw error
  }
}

async function setupDefaultSchedules() {
  console.log('⏰ Setting up default processing schedules...')

  try {
    // Clean up existing schedules
    await prisma.processingSchedule.deleteMany({})
    console.log('✅ Cleaned up existing schedules')

    const schedules = [
      {
        name: 'High Priority Processing',
        description: 'Process high priority items every 5 minutes during business hours',
        cronExpression: '*/5 9-17 * * 1-5', // Every 5 minutes, 9 AM to 5 PM, Monday to Friday
        priority: SchedulePriority.HIGH,
        enabled: true,
        config: {
          batchSize: 10,
          timeout: 300000, // 5 minutes
          priority: 'HIGH',
          filters: {
            priority: ['HIGH']
          }
        },
        nextRun: new Date(Date.now() + 5 * 60 * 1000), // Next 5 minutes
        slaTarget: 5 // 5 minutes SLA
      },
      {
        name: 'Regular Processing',
        description: 'Process regular items every 30 minutes',
        cronExpression: '*/30 * * * *', // Every 30 minutes
        priority: SchedulePriority.MEDIUM,
        enabled: true,
        config: {
          batchSize: 20,
          timeout: 600000, // 10 minutes
          priority: 'MEDIUM'
        },
        nextRun: new Date(Date.now() + 30 * 60 * 1000), // Next 30 minutes
        slaTarget: 30 // 30 minutes SLA
      },
      {
        name: 'Overnight Cleanup',
        description: 'Process low priority items and cleanup during off-hours',
        cronExpression: '0 2 * * *', // Daily at 2 AM
        priority: SchedulePriority.LOW,
        enabled: true,
        config: {
          batchSize: 50,
          timeout: 1800000, // 30 minutes
          priority: 'LOW',
          includeCleanup: true
        },
        nextRun: new Date(new Date().setHours(2, 0, 0, 0)), // Next 2 AM
        slaTarget: 60 // 1 hour SLA
      }
    ]

    for (const schedule of schedules) {
      await prisma.processingSchedule.create({
        data: schedule
      })
      console.log(`✅ Created schedule: ${schedule.name}`)
    }

    console.log(`🎉 Successfully created ${schedules.length} processing schedules`)

  } catch (error) {
    console.error('❌ Failed to setup schedules:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Phase 3 Advanced Features Setup Starting...')
  
  await setupDefaultAlerts()
  await setupDefaultProviders()
  await setupDefaultSchedules()
  
  console.log('🎉 Phase 3 Advanced Features Setup Complete!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Configure email settings in .env (SMTP_HOST, SMTP_USER, etc.)')
  console.log('2. Update Slack webhook URLs in alert configurations')
  console.log('3. Set API keys for AI providers (OPENAI_API_KEY, ANTHROPIC_API_KEY)')
  console.log('4. Test alert configurations in the Advanced Monitoring dashboard')
}

if (require.main === module) {
  main().catch(console.error)
}

export { setupDefaultAlerts, setupDefaultProviders, setupDefaultSchedules }