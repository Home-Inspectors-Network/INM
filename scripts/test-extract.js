#!/usr/bin/env node

/**
 * Test Firecrawl Extract API
 * Verify configuration and test extraction capabilities
 */

require('dotenv').config({ path: '.env.local' });
const FirecrawlApp = require('@mendable/firecrawl-js').default;

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

async function testExtract() {
  console.log('🧪 Testing Firecrawl Extract API');
  console.log('================================\n');

  try {
    // Test 1: Simple search
    console.log('📍 Test 1: Search for home inspectors in Houston');
    const searchResults = await firecrawl.search('home inspectors Houston TX', { limit: 3 });
    console.log(`✅ Found ${searchResults.data.length} results`);
    
    const urls = searchResults.data.map(r => r.url);
    console.log('URLs found:', urls);

    // Test 2: Extract structured data
    console.log('\n📊 Test 2: Extract structured data from URLs');
    
    // Define schema in JSON Schema format
    const schema = {
      type: 'object',
      properties: {
        businessName: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        website: { type: 'string' },
        address: { type: 'string' },
        services: { 
          type: 'array',
          items: { type: 'string' }
        },
        certifications: { 
          type: 'array',
          items: { type: 'string' }
        }
      }
    };
    
    const extractResult = await firecrawl.extract(
      urls.slice(0, 2), // Test with first 2 URLs
      {
        schema: schema,
        prompt: 'Extract business information for home inspection companies including name, contact details, services offered, and certifications'
      }
    );

    console.log(`✅ Extracted data from ${extractResult.data.length} URLs`);
    
    // Display results
    extractResult.data.forEach((data, index) => {
      console.log(`\n📄 Result ${index + 1}:`);
      console.log(`  Business: ${data.businessName || 'Not found'}`);
      console.log(`  Phone: ${data.phone || 'Not found'}`);
      console.log(`  Email: ${data.email || 'Not found'}`);
      console.log(`  Services: ${data.services ? data.services.length : 0} found`);
    });

    console.log('\n✅ Extract API is working correctly!');
    console.log('Ready to run full collection.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testExtract();