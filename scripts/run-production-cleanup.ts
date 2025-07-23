#!/usr/bin/env tsx

import { productionRetroactiveFilter } from './production-retroactive-filter';

async function main() {
  try {
    console.log('🚀 PRODUCTION RETROACTIVE FILTERING EXECUTION');
    console.log('============================================');
    
    // Step 1: Analyze production database
    console.log('\n📊 STEP 1: ANALYZING PRODUCTION DATABASE');
    console.log('----------------------------------------');
    
    const analysis = await productionRetroactiveFilter.analyzeProductionArticles();
    
    console.log('\n📈 ANALYSIS RESULTS:');
    console.log(`📚 Total Articles: ${analysis.totalArticles}`);
    console.log(`✅ Articles to Keep: ${analysis.articlesToKeep} (${Math.round((analysis.articlesToKeep / analysis.totalArticles) * 100)}%)`);
    console.log(`🗑️  Articles to Remove: ${analysis.articlesToRemove} (${Math.round((analysis.articlesToRemove / analysis.totalArticles) * 100)}%)`);
    console.log(`💾 Storage Reduction: ${analysis.estimatedSavings.storageReduction}`);
    console.log(`⚡ Processing Time Reduction: ${analysis.estimatedSavings.processingTimeReduction}`);
    
    console.log(`\n🎯 MATCHED FILTERS (${analysis.filterStats.matchedFilters.length}):`);
    analysis.filterStats.matchedFilters.forEach(filter => {
      console.log(`   • ${filter}: ${analysis.filterStats.articlesPerFilter[filter]} matches`);
    });
    
    console.log(`\n📋 SAMPLE ARTICLES TO REMOVE:`);
    analysis.sampleArticlesToRemove.slice(0, 5).forEach((article, i) => {
      console.log(`   ${i + 1}. "${article.title}" (${article.source})`);
    });
    
    // Step 2: Ask for confirmation
    console.log('\n⚠️  CONFIRMATION REQUIRED');
    console.log('-------------------------');
    console.log('This operation will PERMANENTLY DELETE articles from the production database.');
    console.log(`${analysis.articlesToRemove} articles will be deleted.`);
    console.log('This action CANNOT be undone.');
    
    // For automated execution, we'll do a dry run first
    console.log('\n🧪 STEP 2: DRY RUN PREVIEW');
    console.log('-------------------------');
    
    const dryRunResult = await productionRetroactiveFilter.cleanupProductionArticles({
      dryRun: true,
      batchSize: 100,
      maxArticlesToDelete: undefined,
    });
    
    console.log(`\n🔍 DRY RUN RESULTS:`);
    console.log(`📊 Would delete: ${dryRunResult.articlesDeleted} articles`);
    console.log(`📊 Would preserve: ${dryRunResult.articlesPreserved} articles`);
    console.log(`⏱️  Processing time: ${dryRunResult.processingTime}ms`);
    
    console.log(`\n📈 DELETION BREAKDOWN BY SOURCE:`);
    Object.entries(dryRunResult.statistics.deletedBySource)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`   • ${source}: ${count} articles`);
      });
    
    console.log(`\n📅 DELETION BREAKDOWN BY DATE:`);
    Object.entries(dryRunResult.statistics.deletedByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, count]) => {
        console.log(`   • ${date}: ${count} articles`);
      });
    
    // For safety, let's not auto-execute the actual cleanup
    console.log('\n⚠️  MANUAL CONFIRMATION REQUIRED FOR ACTUAL EXECUTION');
    console.log('To execute the actual cleanup, run this script with --execute flag');
    console.log('Example: npm run cleanup:production -- --execute');
    
    // Check if --execute flag is provided
    const shouldExecute = process.argv.includes('--execute');
    
    if (shouldExecute) {
      console.log('\n🚨 STEP 3: EXECUTING PRODUCTION CLEANUP');
      console.log('=======================================');
      console.log('⚠️  PROCEEDING WITH PERMANENT DELETION...');
      
      const cleanupResult = await productionRetroactiveFilter.cleanupProductionArticles({
        dryRun: false,
        batchSize: 100,
      });
      
      if (cleanupResult.success) {
        console.log('\n✅ CLEANUP COMPLETED SUCCESSFULLY!');
        console.log(`🗑️  Articles deleted: ${cleanupResult.articlesDeleted}`);
        console.log(`📚 Articles preserved: ${cleanupResult.articlesPreserved}`);
        console.log(`⏱️  Total processing time: ${cleanupResult.processingTime}ms`);
        console.log(`\n🎉 Production database has been cleaned up!`);
      } else {
        console.error('\n❌ CLEANUP FAILED!');
        console.error(`Error: ${cleanupResult.error}`);
        process.exit(1);
      }
    } else {
      console.log('\n✋ STOPPING - No --execute flag provided');
      console.log('This was a preview run only. No changes were made to the database.');
    }
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  } finally {
    await productionRetroactiveFilter.disconnect();
  }
}

// Run the script
main().catch(console.error);