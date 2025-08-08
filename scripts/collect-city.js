#!/usr/bin/env node

/**
 * Collect inspectors for a single city
 * Usage: node collect-city.js <category> <city> <state>
 * Example: node collect-city.js mold Houston TX
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const FirecrawlApp = require('@mendable/firecrawl-js').default;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Get arguments
const [,, category, cityName, state] = process.argv;

if (!category || !cityName || !state) {
  console.log('Usage: node collect-city.js <category> <city> <state>');
  console.log('Example: node collect-city.js mold Houston TX');
  process.exit(1);
}

const QUERIES = {
  home: ['home inspectors', 'property inspection', 'home inspection services'],
  termite: ['termite inspection', 'pest inspector', 'WDO inspection'],
  mold: ['mold inspector', 'mold testing', 'indoor air quality testing'],
  foundation: ['foundation inspector', 'structural engineer', 'foundation inspection'],
  pool: ['pool inspector', 'spa inspector', 'pool inspection'],
  radon: ['radon testing', 'radon inspector', 'radon measurement'],
  commercial: ['commercial property inspector', 'commercial inspection', 'commercial building inspector'],
  specialty: ['asbestos inspector', 'environmental inspector', 'lead paint inspector']
};

async function collectCity() {
  console.log(`\n🔍 Collecting ${category} inspectors in ${cityName}, ${state}\n`);
  
  const queries = QUERIES[category];
  if (!queries) {
    console.error(`Unknown category: ${category}`);
    return;
  }
  
  const allUrls = new Set();
  
  // Search for inspectors
  for (const baseQuery of queries) {
    const query = `${baseQuery} ${cityName} ${state}`;
    console.log(`Searching: "${query}"`);
    
    try {
      const results = await firecrawl.search(query, { limit: 5 });
      
      if (results.data) {
        results.data.forEach(r => {
          if (r.url && isValidUrl(r.url)) {
            allUrls.add(r.url);
          }
        });
      }
      
      await delay(1000);
    } catch (error) {
      console.log(`  ⚠️  Search error: ${error.message}`);
    }
  }
  
  // Also search Yelp specifically
  try {
    const yelpQuery = `site:yelp.com ${queries[0]} ${cityName}`;
    console.log(`Searching: "${yelpQuery}"`);
    const yelpResults = await firecrawl.search(yelpQuery, { limit: 3 });
    
    if (yelpResults.data) {
      yelpResults.data.forEach(r => {
        if (r.url && r.url.includes('yelp.com/biz/')) {
          allUrls.add(r.url);
        }
      });
    }
  } catch (error) {
    console.log(`  ⚠️  Yelp search error: ${error.message}`);
  }
  
  console.log(`\nFound ${allUrls.size} unique URLs to scrape\n`);
  
  // Scrape each URL
  const inspectors = [];
  let scraped = 0;
  
  for (const url of Array.from(allUrls).slice(0, 12)) { // Max 12 to get top 10
    console.log(`Scraping: ${url}`);
    
    try {
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        timeout: 8000
      });
      
      if (result && result.success !== false) {
        const inspector = extractData(result, cityName, state, category, url);
        if (inspector) {
          inspectors.push(inspector);
          scraped++;
          console.log(`  ✅ Extracted: ${inspector.business_name}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    
    await delay(500);
  }
  
  console.log(`\nScraped ${scraped} business pages`);
  
  // Save to database
  if (inspectors.length > 0) {
    try {
      const { error } = await supabase
        .from('inspectors')
        .insert(inspectors);
      
      if (!error) {
        console.log(`✅ Saved ${inspectors.length} inspectors to database`);
      } else {
        console.log(`❌ Database error: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Save error: ${error.message}`);
    }
  }
  
  console.log('\nDone!');
}

function isValidUrl(url) {
  const exclude = [
    'google.com/search',
    'yelp.com/search',
    'wikipedia.org',
    'youtube.com',
    'reddit.com',
    '.gov/',
    'indeed.com'
  ];
  
  return !exclude.some(pattern => url.includes(pattern));
}

function extractData(result, city, state, type, url) {
  const content = result.markdown || '';
  const metadata = result.metadata || {};
  
  // Extract business name
  let name = metadata.title || metadata.ogTitle || '';
  name = name.split(' - ')[0].split(' | ')[0].trim();
  
  if (!name || name.length < 3) {
    const urlMatch = url.match(/\/\/(?:www\.)?([^.\/]+)/);
    if (urlMatch) {
      name = urlMatch[1].replace(/-/g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  if (!name || ['Yelp', 'Google', 'Facebook'].includes(name)) return null;
  
  // Extract phone
  const phoneMatch = content.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? formatPhone(phoneMatch[0]) : null;
  
  // Extract email
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;
  
  // Extract address (look for patterns like "123 Main St")
  const addressMatch = content.match(/\d+\s+[\w\s]+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court)/i);
  const address = addressMatch ? addressMatch[0] : null;
  
  return {
    business_name: name.substring(0, 100),
    email: email,
    phone: phone,
    website: url,
    address: address,
    city: city,
    state: state,
    enrichment_status: 'pending',
    quality_score: calculateScore(name, phone, email, url),
    enrichment_data: {
      inspector_type: type,
      data_source: 'firecrawl_targeted',
      source_url: url,
      metadata: {
        title: metadata.title,
        description: metadata.description
      }
    }
  };
}

function formatPhone(phone) {
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function calculateScore(name, phone, email, website) {
  let score = 0;
  if (name) score += 20;
  if (phone) score += 20;
  if (email) score += 10;
  if (website) score += 10;
  return score;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

collectCity().catch(console.error);