#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');

async function setupSeo() {
  console.log('🚀 Setting up SEO page generation for InspectorsNearMe.com\n');
  
  // Check environment
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease update your .env file before proceeding.\n');
    return false;
  }
  
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '..', 'logs');
  await fs.ensureDir(logsDir);
  console.log('✓ Created logs directory');
  
  // Display setup information
  console.log('\n📊 SEO Generation Setup Complete!');
  console.log('\n🎯 Target Cities (10):');
  console.log('   Alabama: Birmingham, Mobile');
  console.log('   Colorado: Denver, Colorado Springs');
  console.log('   Georgia: Atlanta, Augusta');
  console.log('   Idaho: Boise, Meridian');
  console.log('   Michigan: Detroit, Grand Rapids');
  
  console.log('\n📝 What will be generated:');
  console.log('   • 10 city-specific landing pages');
  console.log('   • 5 state overview pages');
  console.log('   • SEO-optimized content with local keywords');
  console.log('   • Schema.org structured data markup');
  console.log('   • Performance tracking and scoring');
  
  console.log('\n🛠️  Next Steps:');
  console.log('   1. Create the seo_pages table:');
  console.log('      Run the SQL in: scripts/create-seo-table.sql');
  console.log('   2. Generate SEO pages:');
  console.log('      npm run seo');
  console.log('   3. Check results in logs/seo-generation.log');
  
  console.log('\n💡 SEO Features:');
  console.log('   • Target keyword optimization');
  console.log('   • Local business schema markup');
  console.log('   • FAQ structured data');
  console.log('   • Mobile-friendly HTML structure');
  console.log('   • Internal linking strategy');
  console.log('   • SEO score calculation (0-100)');
  
  return true;
}

if (require.main === module) {
  setupSeo().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = setupSeo;