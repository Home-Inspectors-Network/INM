const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateQualityReport() {
  console.log('🎯 COMPREHENSIVE QUALITY SCORING REPORT');
  console.log('======================================\n');
  
  const { data: inspectors } = await supabase
    .from('inspectors')
    .select('*')
    .order('quality_score', { ascending: false });
  
  // Quality score distribution
  const distribution = {
    excellent: inspectors.filter(i => i.quality_score >= 80).length,
    good: inspectors.filter(i => i.quality_score >= 60 && i.quality_score < 80).length,
    fair: inspectors.filter(i => i.quality_score >= 40 && i.quality_score < 60).length,
    needs_work: inspectors.filter(i => i.quality_score < 40).length
  };
  
  console.log('📊 Quality Score Distribution:');
  console.log(`  🟢 Excellent (80-100): ${distribution.excellent}`);
  console.log(`  🟡 Good (60-79): ${distribution.good}`);
  console.log(`  🟠 Fair (40-59): ${distribution.fair}`);
  console.log(`  🔴 Needs Work (0-39): ${distribution.needs_work}\n`);
  
  // City breakdown
  const cityStats = {};
  inspectors.forEach(i => {
    if (!cityStats[i.city]) cityStats[i.city] = { count: 0, avgScore: 0, scores: [] };
    cityStats[i.city].count++;
    cityStats[i.city].scores.push(i.quality_score);
  });
  
  console.log('🏙️  City Quality Averages:');
  Object.entries(cityStats).forEach(([city, stats]) => {
    const avg = stats.scores.reduce((a,b) => a+b, 0) / stats.scores.length;
    cityStats[city].avgScore = Math.round(avg);
    console.log(`  ${city}: ${stats.count} inspectors, avg ${Math.round(avg)}/100`);
  });
  
  console.log('\n🔝 Top 10 Quality Inspectors:');
  inspectors.slice(0,10).forEach((i, idx) => {
    console.log(`  ${idx+1}. ${i.business_name} - ${i.quality_score}/100 (${i.city})`);
  });
  
  // Multi-city assignment stats
  const multiCityCount = inspectors.filter(i => i.is_multi_city_assignment).length;
  console.log(`\n🌐 Multi-City Assignments: ${multiCityCount}`);
  
  console.log('\n🎊 REPORT COMPLETE');
}

generateQualityReport().catch(console.error);