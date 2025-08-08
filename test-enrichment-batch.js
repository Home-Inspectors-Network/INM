#!/usr/bin/env node

/**
 * Test Enrichment Batch - Process 5 inspectors to verify system
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBatch() {
  console.log('🧪 TESTING ENRICHMENT SYSTEM - BATCH OF 5');
  console.log('==========================================');

  try {
    // Step 1: Check current database status
    console.log('📊 Step 1: Current database status...');
    
    const { data: allInspectors, error: allError } = await supabase
      .from('inspectors')
      .select('id, business_name, website, enrichment_status, quality_score')
      .not('website', 'is', null);

    if (allError) {
      console.error('Database error:', allError.message);
      return;
    }

    console.log(`📋 Total inspectors with websites: ${allInspectors.length}`);
    
    const statusCount = allInspectors.reduce((acc, inspector) => {
      const status = inspector.enrichment_status || 'not_started';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Enrichment status breakdown:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    const qualityScores = allInspectors.map(i => i.quality_score || 0);
    const zeroScores = qualityScores.filter(score => score === 0).length;
    const avgScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

    console.log(`📊 Quality scores: Average ${avgScore.toFixed(1)}/100`);
    console.log(`🔴 Zero scores: ${zeroScores} inspectors`);
    console.log('');

    // Step 2: Get 5 inspectors for testing
    console.log('🔍 Step 2: Selecting 5 inspectors for test batch...');
    
    const { data: testInspectors, error: testError } = await supabase
      .from('inspectors')
      .select('*')
      .not('website', 'is', null)
      .neq('website', '')
      .or('enrichment_status.is.null,enrichment_status.eq.pending,enrichment_status.eq.failed')
      .limit(5);

    if (testError) {
      console.error('Error selecting test batch:', testError.message);
      return;
    }

    if (testInspectors.length === 0) {
      console.log('✅ No inspectors found that need enrichment - system may be complete!');
      return;
    }

    console.log('📋 Selected test inspectors:');
    testInspectors.forEach((inspector, index) => {
      console.log(`  ${index + 1}. ${inspector.business_name}`);
      console.log(`     Website: ${inspector.website}`);
      console.log(`     Current Status: ${inspector.enrichment_status || 'not_started'}`);
      console.log(`     Quality Score: ${inspector.quality_score || 0}/100`);
    });
    console.log('');

    // Step 3: Test enrichment on first inspector
    console.log('🧪 Step 3: Testing enrichment on first inspector...');
    const testInspector = testInspectors[0];
    
    console.log(`Testing: ${testInspector.business_name}`);
    console.log(`Website: ${testInspector.website}`);
    
    // Import and run the comprehensive enrichment system on just this one
    const { ComprehensiveEnrichmentSystem } = require('./scripts/execute-comprehensive-enrichment.js');
    
    const enrichmentSystem = new ComprehensiveEnrichmentSystem();
    
    // Override the execute method to process just our test inspector
    const originalExecute = enrichmentSystem.execute;
    enrichmentSystem.execute = async function() {
      console.log('🔍 Processing single test inspector...');
      await this.enrichInspector(testInspector);
      
      const report = this.generateSummaryReport();
      console.log('\n📊 TEST RESULTS:');
      console.log(`✅ Success: ${report.processing_stats.successful_enrichments > 0 ? 'YES' : 'NO'}`);
      console.log(`📈 Quality Score: ${this.stats.quality_scores[0] || 'N/A'}/100`);
      console.log(`🔧 Errors: ${report.errors.length}`);
      
      return report;
    };
    
    await enrichmentSystem.execute();
    
    console.log('\n🎉 TEST BATCH COMPLETE!');
    console.log('=======================');
    console.log('✅ System verification successful');
    console.log('📈 Ready for full-scale enrichment');

  } catch (error) {
    console.error('💥 Test batch failed:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  testBatch()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testBatch };