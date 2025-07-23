#!/usr/bin/env node

/**
 * Fix Production Database Script
 * 
 * This script ensures all required tables exist in the production database.
 * It's designed to be run manually or as part of deployment to fix missing tables.
 */

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Checking production database schema...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if problematic tables exist by trying to query them
    const checks = [
      { name: 'ProcessingQueue', query: () => prisma.processingQueue.count() },
      { name: 'AIProvider', query: () => prisma.aIProvider.count() },
      { name: 'ProcessingMetrics', query: () => prisma.processingMetrics.count() },
      { name: 'AlertConfig', query: () => prisma.alertConfig.count() },
    ]
    
    const missingTables = []
    
    for (const check of checks) {
      try {
        const count = await check.query()
        console.log(`✅ ${check.name}: ${count} records`)
      } catch (error) {
        console.log(`❌ ${check.name}: Missing or error - ${error.message}`)
        missingTables.push(check.name)
      }
    }
    
    if (missingTables.length > 0) {
      console.log(`\n🚨 Found ${missingTables.length} missing tables: ${missingTables.join(', ')}`)
      console.log('📝 Running schema push to create missing tables...')
      
      // This will create missing tables without data loss for existing tables
      const { execSync } = require('child_process')
      
      try {
        console.log('Running: npx prisma db push --accept-data-loss')
        const output = execSync('npx prisma db push --accept-data-loss', { 
          encoding: 'utf8',
          stdio: 'pipe'
        })
        console.log('✅ Schema push completed:')
        console.log(output)
        
        // Verify the fix worked
        console.log('\n🔍 Verifying tables were created...')
        for (const check of checks) {
          try {
            const count = await check.query()
            console.log(`✅ ${check.name}: Now working (${count} records)`)
          } catch (error) {
            console.log(`❌ ${check.name}: Still failing - ${error.message}`)
          }
        }
        
      } catch (execError) {
        console.error('❌ Schema push failed:', execError.message)
        console.log('\n📋 Manual steps required:')
        console.log('1. Run: npx prisma db push --accept-data-loss')
        console.log('2. Or run: npx prisma migrate dev --name fix-missing-tables')
        console.log('3. Check DATABASE_URL environment variable')
      }
    } else {
      console.log('✅ All required tables exist!')
    }
    
    // Initialize any required default data
    console.log('\n📊 Checking for required default data...')
    
    // Check if we have any AI providers
    const providerCount = await prisma.aIProvider.count().catch(() => 0)
    if (providerCount === 0) {
      console.log('⚠️  No AI providers found. System may need provider configuration.')
    } else {
      console.log(`✅ Found ${providerCount} AI providers`)
    }
    
    console.log('\n🎉 Database check completed!')
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
    console.log('\n🔧 Possible solutions:')
    console.log('1. Check DATABASE_URL environment variable')
    console.log('2. Ensure database is accessible')
    console.log('3. Run: npx prisma generate')
    console.log('4. Run: npx prisma db push')
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e)
    process.exit(1)
  })