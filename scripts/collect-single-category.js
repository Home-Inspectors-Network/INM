#!/usr/bin/env node

/**
 * Single Category Collector
 * Collects one category at a time to avoid timeouts
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const FirecrawlApp = require('@mendable/firecrawl-js').default;
const fs = require('fs-extra');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Get category from command line
const category = process.argv[2] || 'home';

const CATEGORIES = {
  home: {
    name: 'Home Inspectors',
    queries: [
      'home inspectors {city} {state}',
      'property inspection {city}',
      'site:yelp.com home inspectors {city}',
      'site:threebestrated.com home inspectors {city}'
    ],
    type: 'home'
  },
  termite: {
    name: 'Termite/Pest Inspectors',
    queries: [
      'termite inspection {city} {state}',
      'pest inspector {city}',
      'site:yelp.com termite inspection {city}',
      'site:threebestrated.com pest control {city}'
    ],
    type: 'termite'
  },
  mold: {
    name: 'Mold Inspectors',
    queries: [
      'mold inspector {city} {state}',
      'mold testing {city}',
      'site:yelp.com mold inspection {city}',
      'site:threebestrated.com mold testing {city}'
    ],
    type: 'mold'
  },
  foundation: {
    name: 'Foundation Inspectors',
    queries: [
      'foundation inspector {city} {state}',
      'structural engineer {city}',
      'site:yelp.com foundation inspection {city}'
    ],
    type: 'foundation'
  },
  pool: {
    name: 'Pool/Spa Inspectors',
    queries: [
      'pool inspector {city} {state}',
      'spa inspector {city}',
      'site:yelp.com pool inspection {city}'
    ],
    type: 'pool'
  },
  radon: {
    name: 'Radon Inspectors',
    queries: [
      'radon testing {city} {state}',
      'radon inspector {city}',
      'site:yelp.com radon testing {city}'
    ],
    type: 'radon'
  },
  commercial: {
    name: 'Commercial Inspectors',
    queries: [
      'commercial property inspector {city} {state}',
      'commercial inspection {city}',
      'site:yelp.com commercial inspector {city}'
    ],
    type: 'commercial'
  },
  specialty: {
    name: 'Specialty Inspectors',
    queries: [
      'asbestos inspector {city} {state}',
      'environmental inspector {city}',
      'lead paint inspector {city}'
    ],
    type: 'specialty'
  }
};

const CITIES = [
  { name: 'New York City', state: 'NY' },
  { name: 'Los Angeles', state: 'CA' },
  { name: 'Chicago', state: 'IL' },
  { name: 'Houston', state: 'TX' },
  { name: 'Phoenix', state: 'AZ' },
  { name: 'Philadelphia', state: 'PA' },
  { name: 'San Antonio', state: 'TX' },
  { name: 'San Diego', state: 'CA' },
  { name: 'Dallas', state: 'TX' },
  { name: 'San Jose', state: 'CA' },
  { name: 'San Francisco', state: 'CA' },
  { name: 'Seattle', state: 'WA' },
  { name: 'Austin', state: 'TX' },
  { name: 'Denver', state: 'CO' },
  { name: 'Boston', state: 'MA' },
  { name: 'Miami', state: 'FL' },
  { name: 'Atlanta', state: 'GA' },
  { name: 'Washington', state: 'DC' },
  { name: 'Las Vegas', state: 'NV' },
  { name: 'Portland', state: 'OR' }
];

async function collectCategory(categoryKey) {
  const cat = CATEGORIES[categoryKey];
  if (!cat) {
    console.error(`Unknown category: ${categoryKey}`);
    console.log('Available categories:', Object.keys(CATEGORIES).join(', '));
    return;
  }

  console.log(`\n🏷️  Collecting ${cat.name}`);
  console.log('═'.repeat(50));

  let totalCollected = 0;
  const startTime = Date.now();

  for (const city of CITIES) {
    console.log(`\n📍 ${city.name}, ${city.state}`);
    
    try {
      // Search for inspector URLs
      const urls = new Set();
      
      for (const queryTemplate of cat.queries) {
        const query = queryTemplate
          .replace('{city}', city.name)
          .replace('{state}', city.state);
        
        const results = await firecrawl.search(query, { limit: 10 }); // Get more results to find quality listings
        
        if (results.data) {
          results.data.forEach(r => {
            if (r.url && isValidBusinessUrl(r.url)) {
              urls.add(r.url);
            }
          });
        }
        
        await delay(1000); // Rate limit
      }
      
      console.log(`  Found ${urls.size} URLs`);
      
      // Extract data from URLs
      if (urls.size > 0) {
        const urlArray = Array.from(urls).slice(0, 10); // Max 10 per city
        
        try {
          const inspectors = [];
          
          // Process URLs one by one to avoid overwhelming Extract
          for (const url of urlArray) {
            try {
              const result = await firecrawl.scrapeUrl(url, {
                formats: ['markdown'],
                timeout: 10000
              });
              
              if (result) {
                const inspector = extractInspectorData(result, city, cat.type, url);
                if (inspector) {
                  inspectors.push(inspector);
                }
              }
            } catch (err) {
              console.log(`  ⚠️  Failed to scrape ${url}`);
            }
            
            await delay(500);
          }
          
          // Save to database
          if (inspectors.length > 0) {
            const { error } = await supabase
              .from('inspectors')
              .insert(inspectors);
            
            if (!error) {
              totalCollected += inspectors.length;
              console.log(`  ✅ Saved ${inspectors.length} inspectors`);
            } else {
              console.log(`  ❌ Database error: ${error.message}`);
            }
          }
        } catch (error) {
          console.log(`  ❌ Extract error: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    await delay(2000); // Rate limit between cities
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n✅ Complete! Collected ${totalCollected} ${cat.name} in ${duration} minutes`);
}

function extractInspectorData(data, city, type, url) {
  const content = data.markdown || '';
  const metadata = data.metadata || {};
  
  // Extract business name from title or URL
  let businessName = metadata.title || metadata.ogTitle || '';
  
  // Clean up business name
  businessName = businessName.replace(/\s*[-|]\s*Mold.*$/i, '');
  businessName = businessName.replace(/\s*[-|]\s*Home.*$/i, '');
  
  if (!businessName || businessName.length < 3) {
    const urlMatch = url.match(/\/\/(?:www\.)?([^.]+)\./);
    if (urlMatch) {
      businessName = urlMatch[1].replace(/-/g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  if (!businessName || businessName === 'Yelp') return null;
  
  // Extract phone - look for US phone numbers
  const phoneMatch = content.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? formatPhone(phoneMatch[0]) : null;
  
  // Extract email
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;
  
  return {
    business_name: businessName.substring(0, 100),
    email: email,
    phone: phone,
    website: url,
    city: city.name,
    state: city.state,
    inspector_type: type,
    enrichment_status: 'pending',
    quality_score: 0,
    data_source: 'firecrawl_collect',
    source_url: url,
    created_at: new Date().toISOString(),
    enrichment_data: {
      inspector_type: type,
      needs_enrichment: true,
      collected_at: new Date().toISOString()
    }
  };
}

function isValidBusinessUrl(url) {
  const excludePatterns = [
    'google.com/search',
    'yelp.com/search',
    'yellowpages.com/search',
    'angi.com/search',
    'wikipedia.org',
    'youtube.com',
    'indeed.com',
    'glassdoor.com',
    'reddit.com',
    '.gov/',
    'nextdoor.com',
    'craigslist.org'
  ];
  
  // These are good sources we want to include:
  // - yelp.com/biz/ (business pages)
  // - facebook.com business pages
  // - homeadvisor.com profiles
  // - thumbtack.com profiles
  // - bbb.org business profiles
  // - threebestrated.com listings
  
  return !excludePatterns.some(pattern => url.includes(pattern));
}

function formatPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    const digits = cleaned.slice(1);
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  return phone;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run collector
collectCategory(category).catch(console.error);