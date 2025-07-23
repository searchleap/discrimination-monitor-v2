const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initializeProviders() {
  console.log('🤖 Initializing AI providers...')

  try {
    // Check if providers already exist
    const existingProviders = await prisma.aIProvider.findMany()
    
    if (existingProviders.length > 0) {
      console.log(`✅ Found ${existingProviders.length} existing providers`)
      console.log('Providers:')
      existingProviders.forEach(provider => {
        console.log(`  - ${provider.name} (${provider.type}) - ${provider.enabled ? 'Enabled' : 'Disabled'}`)
      })
      return
    }

    console.log('📝 Creating default providers...')

    // Create OpenAI provider if API key exists
    if (process.env.OPENAI_API_KEY) {
      const openaiProvider = await prisma.aIProvider.create({
        data: {
          name: 'OpenAI GPT-4',
          type: 'OPENAI',
          enabled: true,
          priority: 10,
          config: {
            apiKey: Buffer.from(process.env.OPENAI_API_KEY).toString('base64'),
            model: 'gpt-4o-mini',
            maxTokens: 1000,
            temperature: 0.1,
            timeout: 30000
          },
          rateLimits: {
            requestsPerMinute: 500,
            tokensPerMinute: 10000
          }
        }
      })
      console.log(`✅ Created OpenAI provider: ${openaiProvider.id}`)
    } else {
      console.log('⚠️  OpenAI API key not found in environment variables')
    }

    // Create Anthropic provider if API key exists
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicProvider = await prisma.aIProvider.create({
        data: {
          name: 'Anthropic Claude',
          type: 'ANTHROPIC',
          enabled: true,
          priority: 8,
          config: {
            apiKey: Buffer.from(process.env.ANTHROPIC_API_KEY).toString('base64'),
            model: 'claude-3-haiku-20240307',
            maxTokens: 1000,
            temperature: 0.1,
            timeout: 30000
          },
          rateLimits: {
            requestsPerMinute: 1000,
            tokensPerDay: 100000
          }
        }
      })
      console.log(`✅ Created Anthropic provider: ${anthropicProvider.id}`)
    } else {
      console.log('⚠️  Anthropic API key not found in environment variables')
    }

    // Verify created providers
    const providers = await prisma.aIProvider.findMany({
      orderBy: { priority: 'desc' }
    })

    console.log('\n🎉 Provider initialization complete!')
    console.log(`Total providers: ${providers.length}`)
    
    providers.forEach(provider => {
      console.log(`  - ${provider.name} (${provider.type}) - Priority: ${provider.priority}`)
    })

    if (providers.length === 0) {
      console.log('\n❌ No providers were created!')
      console.log('Make sure to set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file')
    }

  } catch (error) {
    console.error('❌ Error initializing providers:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  initializeProviders()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { initializeProviders }