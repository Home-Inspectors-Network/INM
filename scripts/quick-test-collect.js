#!/usr/bin/env node

// Quick test with just 2 cities
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const FirecrawlApp = require('@mendable/firecrawl-js').default;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

async function quickTest() {
  console.log('🧪 Quick Collection Test\n');
  
  const cities = [
    { name: 'Houston', state: 'TX' },
    { name: 'Phoenix', state: 'AZ' }
  ];
  
  let totalFound = 0;
  
  for (const city of cities) {
    console.log(`\n📍 ${city.name}, ${city.state}`);
    
    // Search for mold inspectors
    const query = `mold inspector ${city.name} ${city.state}`;
    console.log(`  Searching: "${query}"`);
    
    try {
      const results = await firecrawl.search(query, { limit: 3 });
      
      if (results.data) {
        console.log(`  Found ${results.data.length} results`);
        
        for (const result of results.data) {
          console.log(`    - ${result.url}`);
          
          // Try to scrape one
          if (result.url && !result.url.includes('reddit.com') && !result.url.includes('.gov')) {
            try {
              const scraped = await firecrawl.scrapeUrl(result.url, {
                formats: ['markdown'],
                timeout: 10000
              });
              
              if (scraped) {
                console.log(`      ✅ Scraped successfully`);
                console.log(`      Title: ${scraped.metadata?.title || 'No title'}`);
                totalFound++;
              }
            } catch (err) {
              console.log(`      ❌ Scrape failed: ${err.message}`);
            }
            
            break; // Just test one per city
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ Search failed: ${error.message}`);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n✅ Test complete. Successfully scraped ${totalFound} pages.`);
}

quickTest().catch(console.error);