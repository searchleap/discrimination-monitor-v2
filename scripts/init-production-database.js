#!/usr/bin/env node

/**
 * Production Database Initialization Script
 * 
 * This script initializes the production database with:
 * 1. Schema/table creation (db push)
 * 2. RSS feed seeding
 * 3. Initial system metrics
 * 
 * Usage: node scripts/init-production-database.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(`✅ ${stdout.trim()}`);
    if (stderr && !stderr.includes('warn')) console.log(`⚠️  ${stderr.trim()}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function initProductionDatabase() {
  console.log('🚀 Initializing Production Database for AI Discrimination Monitor v2');
  console.log('=====================================\n');

  // Check environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.error('Please ensure your production database URL is configured.');
    process.exit(1);
  }

  console.log('📊 Database URL:', process.env.DATABASE_URL.replace(/\/\/[^@]+@/, '//***:***@'));

  const steps = [
    {
      command: 'npx prisma generate',
      description: 'Generating Prisma Client'
    },
    {
      command: 'npx prisma db push --accept-data-loss',
      description: 'Creating database schema (tables, indexes, constraints)'
    },
    {
      command: 'npx prisma db seed',
      description: 'Seeding RSS feeds and initial data'
    }
  ];

  let allSuccess = true;

  for (const step of steps) {
    const success = await runCommand(step.command, step.description);
    if (!success) {
      allSuccess = false;
      break;
    }
  }

  if (allSuccess) {
    console.log('\n🎉 Production Database Initialization Complete!');
    console.log('✅ Database schema created');
    console.log('✅ RSS feeds seeded'); 
    console.log('✅ System ready for deployment');
    console.log('\nNext steps:');
    console.log('1. Visit /api/debug to verify table counts');
    console.log('2. Check /api/admin/status for connection status');
    console.log('3. Test /articles page for data display');
  } else {
    console.log('\n❌ Database initialization failed');
    console.log('Please check the errors above and try again.');
    process.exit(1);
  }
}

// Run the initialization
initProductionDatabase().catch(console.error);