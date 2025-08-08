const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEnvironment() {
  console.log('Testing environment configuration...\n');
  
  // Check required environment variables
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GOOGLE_MAPS_API_KEY'
  ];
  
  let missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName] || process.env[varName].includes('your-')) {
      missingVars.push(varName);
    } else {
      console.log(`✓ ${varName}: configured`);
    }
  }
  
  if (missingVars.length > 0) {
    console.log('\n❌ Missing environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease update your .env file with valid values before running the scraper.');
    return false;
  }
  
  // Test Supabase connection
  console.log('\nTesting Supabase connection...');
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase
      .from('inspectors')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log(`✓ Supabase connected - ${data || 0} inspectors in database`);
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
    return false;
  }
  
  // Test Google Maps API
  console.log('\nTesting Google Maps API...');
  try {
    const NodeGeocoder = require('node-geocoder');
    const geocoder = NodeGeocoder({
      provider: 'google',
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
      formatter: null
    });
    
    const results = await geocoder.geocode('New York, NY');
    
    if (results && results.length > 0) {
      console.log('✓ Google Maps API working');
    } else {
      console.log('❌ Google Maps API returned no results');
      return false;
    }
  } catch (error) {
    console.log('❌ Google Maps API error:', error.message);
    return false;
  }
  
  console.log('\n✅ Environment test passed! Ready to run scraper.');
  return true;
}

// Run test
testEnvironment().catch(error => {
  console.error('Environment test failed:', error);
  process.exit(1);
});

module.exports = testEnvironment;