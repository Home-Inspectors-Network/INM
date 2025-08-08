const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testChatbotSearch() {
  console.log('🤖 Testing AI Chatbot Search Functionality\n');
  
  const testCases = [
    { city: 'San Francisco', state: 'CA' },
    { city: 'Oakland', state: 'CA' },
    { city: 'Berkeley', state: 'CA' },
    { city: 'Palo Alto', state: 'CA' }
  ];
  
  for (const test of testCases) {
    console.log(`\n🔍 Testing search for: ${test.city}, ${test.state}`);
    console.log('=' + '='.repeat(50));
    
    try {
      // Test the actual database query used by the API
      let query = supabase
        .from('inspectors')
        .select('*');
      
      // Apply filters like the API does
      if (test.city) {
        query = query.ilike('city', `%${test.city}%`);
      }
      if (test.state) {
        query = query.eq('state', test.state.toUpperCase());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        continue;
      }
      
      console.log(`✅ Found ${data.length} inspectors`);
      
      if (data.length > 0) {
        console.log('\nTop 3 Results (as shown in chatbot):');
        data.slice(0, 3).forEach((inspector, index) => {
          console.log(`\n${index + 1}. ${inspector.business_name}`);
          console.log(`   Location: ${inspector.city}, ${inspector.state}`);
          console.log(`   Phone: ${inspector.phone || 'Not provided'}`);
          console.log(`   Email: ${inspector.email || 'Not provided'}`);
          console.log(`   Services: ${inspector.services?.join(', ') || 'General inspection'}`);
        });
      }
      
      // Test specific inspector names
      if (test.city === 'San Francisco') {
        console.log('\n📍 Testing specific inspector search:');
        const specificTest = await supabase
          .from('inspectors')
          .select('*')
          .ilike('business_name', '%Bay Area Home Inspections%')
          .single();
        
        if (specificTest.data) {
          console.log(`✅ Found "Bay Area Home Inspections" - ID: ${specificTest.data.id}`);
        } else {
          console.log('❌ Could not find "Bay Area Home Inspections"');
        }
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error: ${error.message}`);
    }
  }
  
  // Test the search API endpoint format
  console.log('\n\n🌐 API Endpoint Examples:');
  console.log('=' + '='.repeat(50));
  console.log('General search: /api/inspectors/search?city=San+Francisco&state=CA');
  console.log('With coordinates: /api/inspectors/search?lat=37.7749&lng=-122.4194');
  console.log('Service specific: /api/inspectors/search?city=Oakland&services=Termite+Inspection');
}

testChatbotSearch();