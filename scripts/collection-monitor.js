#!/usr/bin/env node

/**
 * Monitor collection progress in real-time
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function monitor() {
  console.clear();
  console.log('📊 COLLECTION PROGRESS MONITOR');
  console.log('==============================\n');
  
  // Get counts by category
  const { data: categoryCounts } = await supabase
    .from('inspectors')
    .select('enrichment_data')
    .not('enrichment_data', 'is', null);
  
  // Process counts
  const counts = {};
  const targets = {
    home: 200,
    termite: 200,
    mold: 200,
    foundation: 200,
    pool: 150,
    radon: 150,
    commercial: 200,
    specialty: 200
  };
  
  categoryCounts.forEach(row => {
    const type = row.enrichment_data?.inspector_type;
    if (type) {
      counts[type] = (counts[type] || 0) + 1;
    }
  });
  
  // Display progress
  let totalCollected = 0;
  let totalTarget = 0;
  
  Object.keys(targets).forEach(category => {
    const count = counts[category] || 0;
    const target = targets[category];
    const percentage = Math.round((count / target) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    
    totalCollected += count;
    totalTarget += target;
    
    console.log(`${category.toUpperCase().padEnd(12)} [${bar}] ${count}/${target} (${percentage}%)`);
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log(`TOTAL        ${totalCollected}/${totalTarget} (${Math.round((totalCollected / totalTarget) * 100)}%)`);
  
  // Recent activity
  const { data: recent } = await supabase
    .from('inspectors')
    .select('city, enrichment_data, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recent && recent.length > 0) {
    console.log('\n📍 Recent Collections:');
    recent.forEach(r => {
      const type = r.enrichment_data?.inspector_type || 'unknown';
      const time = new Date(r.created_at).toLocaleTimeString();
      console.log(`  ${time} - ${type} inspector in ${r.city}`);
    });
  }
  
  console.log('\n🔄 Refreshing in 30 seconds... (Ctrl+C to exit)');
}

// Run monitor every 30 seconds
monitor();
setInterval(monitor, 30000);