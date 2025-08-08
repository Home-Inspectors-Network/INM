#!/usr/bin/env node

/**
 * Debug Firecrawl API issues
 */

require('dotenv').config({ path: '.env.local' });
const FirecrawlApp = require('@mendable/firecrawl-js').default;

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

async function debugFirecrawl() {
  console.log('🔍 Debugging Firecrawl API\n');

  // Test URLs that were failing
  const testUrls = [
    'https://moldinspectionandtest.com/new-york-city',
    'https://www.inspectorteam.com/mold-inspection',
    'https://www.firecrawl.dev'
  ];

  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    console.log('─'.repeat(50));
    
    try {
      // Try scrape
      console.log('Attempting scrape...');
      const result = await firecrawl.scrape(url, {
        formats: ['markdown'],
        timeout: 15000
      });
      
      if (result.success) {
        console.log('✅ Scrape successful!');
        console.log(`Title: ${result.data?.metadata?.title || 'No title'}`);
        console.log(`Content length: ${result.data?.markdown?.length || 0} chars`);
      } else {
        console.log('❌ Scrape failed');
        console.log('Error:', result.error);
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Check API limits
  console.log('\n📊 Checking API Status\n');
  try {
    const response = await firecrawl.scrape('https://example.com', {
      formats: ['markdown']
    });
    console.log('✅ API is accessible');
  } catch (error) {
    console.log('❌ API Error:', error.message);
  }
}

debugFirecrawl();