#!/usr/bin/env node

/**
 * Check the current status of home inspectors in the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  console.log('🏠 Checking Home Inspector Status...\n');
  
  try {
    // Get total count of home inspectors
    const { count: totalCount } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true })
      .eq('inspector_type', 'home');
    
    console.log(`Total home inspectors: ${totalCount}`);
    
    // Get counts by enrichment status
    const statuses = ['pending', 'in_progress', 'completed', 'failed', 'partial'];
    
    for (const status of statuses) {
      const { count } = await supabase
        .from('inspectors')
        .select('*', { count: 'exact', head: true })
        .eq('inspector_type', 'home')
        .eq('enrichment_status', status);
      
      console.log(`  ${status}: ${count || 0}`);
    }
    
    // Get count with null enrichment_status
    const { count: nullCount } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true })
      .eq('inspector_type', 'home')
      .is('enrichment_status', null);
    
    console.log(`  null/not set: ${nullCount || 0}`);
    
    // Get quality score distribution
    console.log('\nQuality Score Distribution:');
    
    const { data: scoredInspectors } = await supabase
      .from('inspectors')
      .select('quality_score')
      .eq('inspector_type', 'home')
      .not('quality_score', 'is', null);
    
    if (scoredInspectors && scoredInspectors.length > 0) {
      const scores = scoredInspectors.map(i => i.quality_score);
      const excellent = scores.filter(s => s >= 85).length;
      const good = scores.filter(s => s >= 70 && s < 85).length;
      const needsImprovement = scores.filter(s => s < 70).length;
      const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      
      console.log(`  Excellent (85+): ${excellent}`);
      console.log(`  Good (70-84): ${good}`);
      console.log(`  Needs Improvement (<70): ${needsImprovement}`);
      console.log(`  Average Score: ${avgScore}/100`);
    } else {
      console.log('  No quality scores recorded yet');
    }
    
    // Get sample of pending inspectors
    console.log('\nSample of pending home inspectors:');
    
    const { data: pendingSample } = await supabase
      .from('inspectors')
      .select('business_name, city, website')
      .eq('inspector_type', 'home')
      .or('enrichment_status.eq.pending,enrichment_status.is.null')
      .limit(5);
    
    if (pendingSample && pendingSample.length > 0) {
      pendingSample.forEach((inspector, i) => {
        console.log(`  ${i + 1}. ${inspector.business_name} (${inspector.city || 'Unknown'}) - ${inspector.website || 'No website'}`);
      });
    }
    
    // Check website availability
    const { count: withWebsite } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true })
      .eq('inspector_type', 'home')
      .not('website', 'is', null)
      .neq('website', '');
    
    console.log(`\nHome inspectors with websites: ${withWebsite}/${totalCount} (${((withWebsite/totalCount)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error checking status:', error.message);
  }
}

checkStatus();