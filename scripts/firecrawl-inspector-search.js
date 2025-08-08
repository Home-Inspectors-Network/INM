#!/usr/bin/env node

/**
 * Advanced Inspector Discovery via Firecrawl Multi-Engine Search
 * Searches Google, Bing, DuckDuckGo for inspectors and enriches data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bay Area cities to search
const BAY_AREA_CITIES = [
  'San Francisco',
  'Oakland', 
  'San Jose',
  'Palo Alto',
  'Berkeley',
  'Fremont',
  'Hayward',
  'Sunnyvale'
];

// Inspector types and search patterns
const INSPECTOR_SEARCH_PATTERNS = {
  'home_inspectors': [
    'home inspectors {city} CA',
    'property inspectors {city} California',
    'house inspection services {city}',
    'residential inspectors {city} Bay Area'
  ],
  'termite_inspectors': [
    'termite inspectors {city} CA', 
    'pest inspection {city} California',
    'WDO inspection {city}',
    'termite control {city} Bay Area'
  ],
  'foundation_inspectors': [
    'foundation inspectors {city} CA',
    'structural engineers {city} California', 
    'foundation repair {city}',
    'seismic inspection {city} Bay Area'
  ],
  'specialty_inspectors': [
    'mold inspectors {city} CA',
    'radon testing {city} California',
    'asbestos testing {city}',
    'pool inspection {city} Bay Area'
  ]
};

// Search engines to query
const SEARCH_ENGINES = ['Google', 'Bing', 'DuckDuckGo'];

async function searchInspectors(city, inspectorType = 'home_inspectors', pages = 2) {
  const patterns = INSPECTOR_SEARCH_PATTERNS[inspectorType];
  const results = [];
  
  console.log(`🔍 Searching ${inspectorType} in ${city}, CA`);
  
  for (const pattern of patterns) {
    const query = pattern.replace('{city}', city);
    console.log(`  📍 Query: "${query}"`);
    
    try {
      // Use Firecrawl search with scraping enabled
      const searchResults = await searchWithFirecrawl(query, pages * 5); // 5 results per page
      
      for (const result of searchResults.slice(0, pages * 5)) {
        if (isValidInspectorResult(result, inspectorType)) {
          const enrichedData = await extractBusinessData(result);
          if (enrichedData) {
            results.push({
              ...enrichedData,
              city: city,
              state: 'CA',
              inspector_type: inspectorType,
              source_query: query,
              found_via: 'firecrawl_search'
            });
          }
        }
      }
      
      // Rate limiting between searches
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`  ❌ Search failed for "${query}":`, error.message);
    }
  }
  
  return deduplicateResults(results);
}

async function searchWithFirecrawl(query, limit = 10) {
  // This would use the MCP Firecrawl tool
  // For now, return mock structure - actual implementation would use:
  // const results = await mcp_firecrawl_search({ query, limit, scrapeOptions: {...} });
  
  console.log(`    🌐 Firecrawl search: "${query}" (limit: ${limit})`);
  return []; // Placeholder - actual Firecrawl results would go here
}

function isValidInspectorResult(result, inspectorType) {
  const url = result.url?.toLowerCase() || '';
  const title = result.title?.toLowerCase() || '';
  const content = result.content?.toLowerCase() || '';
  
  // Filter out irrelevant results
  const excludePatterns = [
    'zillow.com', 'realtor.com', 'redfin.com', // Real estate sites
    'angie.com', 'thumbtack.com', 'homeadvisor.com', // Lead gen sites  
    'yelp.com/search', 'google.com/search', // Search pages
    'facebook.com', 'instagram.com', 'linkedin.com' // Social media
  ];
  
  if (excludePatterns.some(pattern => url.includes(pattern))) {
    return false;
  }
  
  // Require inspector-related keywords
  const requiredKeywords = {
    'home_inspectors': ['inspect', 'home', 'property', 'residential'],
    'termite_inspectors': ['termite', 'pest', 'wdo'],
    'foundation_inspectors': ['foundation', 'structural', 'seismic'],
    'specialty_inspectors': ['mold', 'radon', 'asbestos', 'pool', 'spa']
  };
  
  const keywords = requiredKeywords[inspectorType] || [];
  return keywords.some(keyword => 
    title.includes(keyword) || content.includes(keyword)
  );
}

async function extractBusinessData(result) {
  try {
    const data = {
      business_name: extractBusinessName(result),
      website: result.url,
      phone: extractPhone(result.content),
      email: extractEmail(result.content),  
      address: extractAddress(result.content),
      services: extractServices(result.content),
      certifications: extractCertifications(result.content),
      description: extractDescription(result.content)
    };
    
    // Only return if we have minimum required data
    if (data.business_name && (data.phone || data.email)) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting business data:', error);
    return null;
  }
}

function extractBusinessName(result) {
  // Extract business name from title, remove common suffixes
  let name = result.title;
  const suffixes = [' - Home Inspector', ' | Home Inspection', ' - Yelp', ' - Google'];
  
  suffixes.forEach(suffix => {
    if (name.endsWith(suffix)) {
      name = name.replace(suffix, '');
    }
  });
  
  return name.trim();
}

function extractPhone(content) {
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const match = content.match(phoneRegex);
  return match ? match[1] : null;
}

function extractEmail(content) {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const match = content.match(emailRegex);
  return match ? match[1] : null;
}

function extractAddress(content) {
  // Simple address extraction - can be enhanced
  const addressRegex = /(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl)(?:\s+(?:Suite|Ste|Unit|#)\s*\w+)?)/i;
  const match = content.match(addressRegex);
  return match ? match[1] : null;
}

function extractServices(content) {
  const serviceKeywords = [
    'home inspection', 'property inspection', 'residential inspection',
    'commercial inspection', 'new construction', 'pre-purchase',
    'termite inspection', 'pest inspection', 'mold inspection',
    'radon testing', 'foundation inspection', 'pool inspection'
  ];
  
  return serviceKeywords.filter(service => 
    content.toLowerCase().includes(service)
  );
}

function extractCertifications(content) {
  const certRegex = /(ASHI|InterNACHI|NAHI|CREIA|AHIT|CSLB)\s*(certified|member|licensed)?/gi;
  const matches = content.match(certRegex) || [];
  return [...new Set(matches)]; // Remove duplicates
}

function extractDescription(content) {
  // Extract first meaningful paragraph as description
  const sentences = content.split(/[.!?]/).filter(s => s.length > 50);
  return sentences[0] ? sentences[0].trim() + '.' : null;
}

function deduplicateResults(results) {
  const seen = new Set();
  return results.filter(result => {
    const key = `${result.business_name}-${result.phone || result.email}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function saveToDatabase(inspectors) {
  console.log(`💾 Saving ${inspectors.length} inspectors to database...`);
  
  for (const inspector of inspectors) {
    try {
      const { error } = await supabase
        .from('inspectors')
        .upsert(inspector, { 
          onConflict: 'business_name,phone',
          ignoreDuplicates: false 
        });
        
      if (error) {
        console.error(`❌ Database error for ${inspector.business_name}:`, error);
      } else {
        console.log(`✅ Saved: ${inspector.business_name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to save ${inspector.business_name}:`, error);
    }
  }
}

// Main execution function
async function runMultiEngineSearch() {
  console.log('🚀 Starting Multi-Engine Inspector Search');
  console.log('==========================================');
  
  const allResults = [];
  
  // Search each city for each inspector type
  for (const city of BAY_AREA_CITIES.slice(0, 3)) { // Start with top 3 cities
    for (const inspectorType of Object.keys(INSPECTOR_SEARCH_PATTERNS)) {
      const results = await searchInspectors(city, inspectorType, 2); // 2 pages deep
      allResults.push(...results);
      
      console.log(`✅ Found ${results.length} ${inspectorType} in ${city}`);
      
      // Longer delay between cities
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Save to database
  if (allResults.length > 0) {
    await saveToDatabase(allResults);
  }
  
  console.log(`\\n📊 Total Results: ${allResults.length} new inspectors discovered`);
  return allResults;
}

if (require.main === module) {
  runMultiEngineSearch()
    .then(() => {
      console.log('🎉 Multi-engine search completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Search failed:', error);
      process.exit(1);
    });
}

module.exports = { runMultiEngineSearch, searchInspectors };