#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const FirecrawlApp = require('@mendable/firecrawl-js').default;

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

async function test() {
  console.log('Testing scrapeUrl method...\n');
  
  try {
    const result = await firecrawl.scrapeUrl('https://www.firecrawl.dev', {
      formats: ['markdown']
    });
    
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result));
    console.log('\nMetadata:', result.metadata);
    console.log('\nMarkdown length:', result.markdown?.length || 0);
    console.log('\nFirst 200 chars:', result.markdown?.substring(0, 200));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();