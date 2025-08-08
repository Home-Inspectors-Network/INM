#!/usr/bin/env node

/**
 * Quick Enrichment Status Checker
 * Shows current state of inspector database and enrichment progress
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  console.log('📊 INSPECTOR DATABASE STATUS CHECK');
  console.log('==================================');
  console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Get all inspectors
    const { data: allInspectors, error } = await supabase
      .from('inspectors')
      .select('*');

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    // Basic counts
    const totalInspectors = allInspectors.length;
    const withWebsites = allInspectors.filter(i => i.website && i.website.trim() !== '').length;
    const withoutWebsites = totalInspectors - withWebsites;

    console.log('📋 BASIC STATISTICS:');
    console.log(`  Total Inspectors: ${totalInspectors}`);
    console.log(`  With Websites: ${withWebsites}`);
    console.log(`  Without Websites: ${withoutWebsites}`);
    console.log('');

    // Enrichment status breakdown
    const statusBreakdown = allInspectors.reduce((acc, inspector) => {
      const status = inspector.enrichment_status || 'not_started';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('🔄 ENRICHMENT STATUS:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      const percentage = ((count / totalInspectors) * 100).toFixed(1);
      console.log(`  ${status}: ${count} (${percentage}%)`);
    });
    console.log('');

    // Quality score analysis
    const qualityScores = allInspectors.map(i => i.quality_score || 0);
    const zeroScores = qualityScores.filter(score => score === 0).length;
    const excellentScores = qualityScores.filter(score => score >= 85).length;
    const goodScores = qualityScores.filter(score => score >= 70 && score < 85).length;
    const poorScores = qualityScores.filter(score => score > 0 && score < 50).length;
    const avgScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

    console.log('🏆 QUALITY SCORE DISTRIBUTION:');
    console.log(`  Average Score: ${avgScore.toFixed(1)}/100`);
    console.log(`  Zero Scores (0): ${zeroScores}`);
    console.log(`  Poor Scores (1-49): ${poorScores}`);
    console.log(`  Good Scores (70-84): ${goodScores}`);
    console.log(`  Excellent Scores (85+): ${excellentScores}`);
    console.log('');

    // Target progress
    const targetExcellent = 80;
    const progressPercent = ((excellentScores / targetExcellent) * 100).toFixed(1);

    console.log('🎯 TARGET PROGRESS:');
    console.log(`  Goal: ${targetExcellent} inspectors with excellent scores (85+)`);
    console.log(`  Current: ${excellentScores} excellent scores`);
    console.log(`  Progress: ${progressPercent}%`);
    console.log(`  Remaining: ${Math.max(0, targetExcellent - excellentScores)} needed`);
    console.log('');

    // Enrichment opportunities
    const needsEnrichment = allInspectors.filter(i => 
      i.website && 
      i.website.trim() !== '' && 
      (!i.enrichment_status || i.enrichment_status === 'pending' || i.enrichment_status === 'failed')
    );

    console.log('🔧 ENRICHMENT OPPORTUNITIES:');
    console.log(`  Inspectors ready for enrichment: ${needsEnrichment.length}`);
    
    if (needsEnrichment.length > 0) {
      console.log('  Sample inspectors ready:');
      needsEnrichment.slice(0, 5).forEach((inspector, index) => {
        console.log(`    ${index + 1}. ${inspector.business_name} - ${inspector.website}`);
      });
    }
    console.log('');

    // Feature completeness
    const withLogos = allInspectors.filter(i => i.logo_url).length;
    const withServices = allInspectors.filter(i => i.detailed_services && i.detailed_services.length > 0).length;
    const withPhotos = allInspectors.filter(i => i.photo_gallery && i.photo_gallery.length > 0).length;
    const withSocial = allInspectors.filter(i => i.social_media && Object.keys(i.social_media).length > 0).length;

    console.log('🚀 FEATURE COMPLETENESS:');
    console.log(`  Logos: ${withLogos} (${((withLogos/totalInspectors)*100).toFixed(1)}%)`);
    console.log(`  Detailed Services: ${withServices} (${((withServices/totalInspectors)*100).toFixed(1)}%)`);
    console.log(`  Photo Galleries: ${withPhotos} (${((withPhotos/totalInspectors)*100).toFixed(1)}%)`);
    console.log(`  Social Media: ${withSocial} (${((withSocial/totalInspectors)*100).toFixed(1)}%)`);
    console.log('');

    // System recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (needsEnrichment.length > 0) {
      console.log(`  ✅ Run enrichment on ${needsEnrichment.length} inspectors`);
    }
    if (zeroScores > 50) {
      console.log(`  ⚠️  High number of zero-score inspectors (${zeroScores})`);
    }
    if (excellentScores < targetExcellent) {
      console.log(`  📈 Need ${targetExcellent - excellentScores} more excellent scores to reach target`);
    }
    if (excellentScores >= targetExcellent) {
      console.log(`  🎉 TARGET ACHIEVED! ${excellentScores} excellent scores`);
    }

  } catch (error) {
    console.error('💥 Status check failed:', error.message);
  }
}

if (require.main === module) {
  checkStatus()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkStatus };