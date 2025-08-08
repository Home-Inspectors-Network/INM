#!/usr/bin/env node

/**
 * Verify Four Metro Data Collection
 * Shows summary of collected inspector data for Orlando, Indianapolis, Columbus, and San Antonio
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCityData() {
  console.log('📊 FOUR METRO INSPECTOR DATA VERIFICATION');
  console.log('========================================\n');
  
  const cities = [
    { name: 'Orlando', state: 'FL' },
    { name: 'Indianapolis', state: 'IN' },
    { name: 'Columbus', state: 'OH' },
    { name: 'San Antonio', state: 'TX' }
  ];
  
  for (const city of cities) {
    console.log(`\n📍 ${city.name}, ${city.state}`);
    console.log('─'.repeat(50));
    
    // Get all inspectors for this city
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .eq('city', city.name)
      .eq('state', city.state)
      .order('quality_score', { ascending: false });
    
    if (error) {
      console.log(`   ❌ Error fetching data: ${error.message}`);
      continue;
    }
    
    console.log(`   Total Inspectors: ${inspectors.length}`);
    
    // Calculate average quality score
    const avgQuality = inspectors.length > 0 
      ? Math.round(inspectors.reduce((sum, i) => sum + (i.quality_score || 0), 0) / inspectors.length)
      : 0;
    console.log(`   Average Quality Score: ${avgQuality}%`);
    
    // Count by quality tiers
    const premiumReady = inspectors.filter(i => i.quality_score >= 70).length;
    const needsEnrichment = inspectors.filter(i => i.quality_score < 70).length;
    console.log(`   Premium Ready (70%+): ${premiumReady}`);
    console.log(`   Needs Enrichment (<70%): ${needsEnrichment}`);
    
    // Show top 3 inspectors
    console.log(`\n   Top Inspectors:`);
    inspectors.slice(0, 3).forEach((inspector, idx) => {
      console.log(`   ${idx + 1}. ${inspector.business_name}`);
      console.log(`      Quality: ${inspector.quality_score}%`);
      console.log(`      Phone: ${inspector.phone || 'N/A'}`);
      console.log(`      Website: ${inspector.website || 'N/A'}`);
      console.log(`      Services: ${inspector.services?.join(', ') || 'N/A'}`);
    });
    
    // Data completeness stats
    const withEmail = inspectors.filter(i => i.email).length;
    const withWebsite = inspectors.filter(i => i.website).length;
    const withOwner = inspectors.filter(i => i.owner_name).length;
    const withYears = inspectors.filter(i => i.years_in_business).length;
    
    console.log(`\n   Data Completeness:`);
    console.log(`   - With Email: ${withEmail}/${inspectors.length} (${Math.round(withEmail/inspectors.length*100)}%)`);
    console.log(`   - With Website: ${withWebsite}/${inspectors.length} (${Math.round(withWebsite/inspectors.length*100)}%)`);
    console.log(`   - With Owner Name: ${withOwner}/${inspectors.length} (${Math.round(withOwner/inspectors.length*100)}%)`);
    console.log(`   - With Years in Business: ${withYears}/${inspectors.length} (${Math.round(withYears/inspectors.length*100)}%)`);
  }
  
  // Overall summary
  console.log('\n\n📊 OVERALL SUMMARY');
  console.log('==================');
  
  const { data: allInspectors } = await supabase
    .from('inspectors')
    .select('*')
    .in('city', cities.map(c => c.name))
    .in('state', cities.map(c => c.state));
  
  console.log(`Total Inspectors (4 Cities): ${allInspectors.length}`);
  
  const avgOverallQuality = Math.round(
    allInspectors.reduce((sum, i) => sum + (i.quality_score || 0), 0) / allInspectors.length
  );
  console.log(`Average Quality Score: ${avgOverallQuality}%`);
  
  const premiumReadyTotal = allInspectors.filter(i => i.quality_score >= 70).length;
  console.log(`Premium Ready (70%+): ${premiumReadyTotal} (${Math.round(premiumReadyTotal/allInspectors.length*100)}%)`);
  
  // Get total database count
  const { count } = await supabase
    .from('inspectors')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n💾 Total Inspectors in Database: ${count}`);
}

// Run verification
verifyCityData().catch(console.error);