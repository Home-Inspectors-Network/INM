require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Test configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyCnvvjiDnTmWwrO77EDNOwVPYmbL9yaVcg';
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

console.log('🚀 Testing Bay Area SEO Setup...\n');

// Test 1: Environment Variables
console.log('1. Testing Environment Variables...');
const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = requiredEnvVars.filter(env => !process.env[env]);

if (missing.length > 0) {
  console.log('❌ Missing environment variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All required environment variables found');
}

// Test 2: Database Connection
console.log('\n2. Testing Database Connection...');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDatabase() {
  try {
    // Test inspectors table
    const { data: inspectors, error: inspectorsError } = await supabase
      .from('inspectors')
      .select('city, state')
      .eq('state', 'CA')
      .limit(5);
    
    if (inspectorsError) throw inspectorsError;
    
    console.log(`✅ Connected to database, found ${inspectors.length} sample CA inspectors`);
    
    // Test seo_pages table
    const { data: seoPages, error: seoError } = await supabase
      .from('seo_pages')
      .select('id')
      .limit(1);
    
    if (seoError && seoError.message.includes('relation "seo_pages" does not exist')) {
      console.log('⚠️  seo_pages table does not exist. Run: npm run setup-db');
    } else if (seoError) {
      throw seoError;
    } else {
      console.log('✅ seo_pages table exists and accessible');
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Test 3: Google Maps API
console.log('\n3. Testing Google Maps API...');
async function testGoogleMapsAPI() {
  try {
    const testCity = 'San Francisco, CA';
    const url = `${GOOGLE_GEOCODING_API_URL}?address=${encodeURIComponent(testCity)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      const result = response.data.results[0];
      console.log('✅ Google Maps API working');
      console.log(`   Sample result: ${result.formatted_address}`);
      
      // Check if we can identify county
      const countyComponent = result.address_components.find(
        comp => comp.types.includes('administrative_area_level_2')
      );
      
      if (countyComponent) {
        console.log(`   County detection: ${countyComponent.long_name}`);
      }
      
    } else {
      console.log('❌ Google Maps API error:', response.data.status);
      console.log('   Error message:', response.data.error_message);
      process.exit(1);
    }
    
  } catch (error) {
    console.log('❌ Google Maps API failed:', error.message);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Test 4: Find Sample Bay Area Cities
async function findSampleCities() {
  console.log('\n4. Finding Sample Bay Area Cities...');
  
  try {
    const { data: cities, error } = await supabase
      .from('inspectors')
      .select('city, state')
      .eq('state', 'CA')
      .not('city', 'is', null);
    
    if (error) throw error;
    
    const uniqueCities = [...new Set(cities.map(item => item.city))]
      .filter(city => city && city.trim() !== '')
      .slice(0, 5); // Test first 5 cities
    
    console.log(`✅ Found ${uniqueCities.length} sample CA cities to test:`);
    uniqueCities.forEach(city => console.log(`   - ${city}`));
    
    return uniqueCities;
    
  } catch (error) {
    console.log('❌ Error finding cities:', error.message);
    return [];
  }
}

// Run all tests
async function runTests() {
  try {
    await testDatabase();
    await testGoogleMapsAPI();
    const sampleCities = await findSampleCities();
    
    console.log('\n🎉 All tests passed! Ready to generate Bay Area SEO pages.');
    console.log('\nNext steps:');
    console.log('1. Run: npm run seo-bay-area');
    console.log('2. Check logs: tail -f logs/bay-area-seo-generation.log');
    console.log('3. Review report: cat logs/bay-area-seo-report.json');
    
  } catch (error) {
    console.log('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

runTests();