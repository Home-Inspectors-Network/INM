require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Initialize Supabase client using service role key for write operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Priority cities in non-licensed states for maximum ROI
const HIGH_PRIORITY_CITIES = [
  // Texas (high population, non-licensed)
  { name: 'Houston', state: 'TX', population: 2300000 },
  { name: 'San Antonio', state: 'TX', population: 1550000 },
  { name: 'Dallas', state: 'TX', population: 1340000 },
  { name: 'Austin', state: 'TX', population: 965000 },
  { name: 'Fort Worth', state: 'TX', population: 920000 },
  
  // Illinois
  { name: 'Chicago', state: 'IL', population: 2700000 },
  
  // Pennsylvania 
  { name: 'Philadelphia', state: 'PA', population: 1600000 },
  { name: 'Pittsburgh', state: 'PA', population: 300000 },
  
  // Ohio
  { name: 'Columbus', state: 'OH', population: 900000 },
  { name: 'Cleveland', state: 'OH', population: 385000 },
  { name: 'Cincinnati', state: 'OH', population: 310000 },
  
  // Michigan
  { name: 'Detroit', state: 'MI', population: 670000 },
  
  // Colorado
  { name: 'Denver', state: 'CO', population: 715000 },
  { name: 'Colorado Springs', state: 'CO', population: 480000 },
  
  // Georgia
  { name: 'Atlanta', state: 'GA', population: 500000 },
  
  // Additional high-value targets
  { name: 'Phoenix', state: 'AZ', population: 1600000 },
  { name: 'Minneapolis', state: 'MN', population: 430000 },
  { name: 'Kansas City', state: 'MO', population: 495000 },
  { name: 'Omaha', state: 'NE', population: 480000 },
  { name: 'Birmingham', state: 'AL', population: 210000 },
  { name: 'Boise', state: 'ID', population: 230000 },
];

// Search terms for better targeting
const SEARCH_TERMS = [
  'home inspector',
  'property inspector',
  'house inspector',
  'building inspector',
  'home inspection service',
  'residential inspector'
];

// Data collection statistics
let stats = {
  totalCollected: 0,
  citiesProcessed: 0,
  duplicatesSkipped: 0,
  errors: 0,
  apiCalls: 0,
  startTime: Date.now(),
  savedToDatabase: 0
};

// Deduplication map
const collectedInspectors = new Map();

// Logging setup
const logFile = path.join(__dirname, '..', 'logs', 'enhanced-harvester.log');

async function ensureLogsDir() {
  await fs.ensureDir(path.dirname(logFile));
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced data cleaning functions
function cleanPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    const number = cleaned.slice(1);
    return `(${number.slice(0,3)}) ${number.slice(3,6)}-${number.slice(6)}`;
  }
  return cleaned.length >= 10 ? phone : null;
}

function cleanEmail(email) {
  if (!email) return null;
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email) ? email.toLowerCase() : null;
}

function cleanWebsite(website) {
  if (!website) return null;
  if (!website.startsWith('http')) {
    website = 'https://' + website;
  }
  try {
    new URL(website);
    return website;
  } catch {
    return null;
  }
}

function extractCertifications(text) {
  const certifications = [];
  const certKeywords = [
    'ASHI', 'InterNACHI', 'NAHI', 'NACHI', 'CREIA', 'CAHPI',
    'TREC', 'ICC', 'IAEI', 'AHIT', 'NCHI', 'Certified', 'Licensed'
  ];
  
  const upperText = text.toUpperCase();
  certKeywords.forEach(keyword => {
    if (upperText.includes(keyword.toUpperCase())) {
      certifications.push(keyword);
    }
  });
  
  return [...new Set(certifications)];
}

function extractServices(text) {
  const services = [];
  const serviceKeywords = [
    'Home Inspection', 'Property Inspection', 'Residential Inspection',
    'Pre-Purchase Inspection', 'New Construction Inspection',
    'Radon Testing', 'Mold Testing', 'Termite Inspection',
    'Well Water Testing', 'Septic Inspection', 'Pool Inspection',
    'HVAC Inspection', 'Electrical Inspection', 'Plumbing Inspection',
    'Roof Inspection', 'Foundation Inspection', 'Commercial Inspection'
  ];
  
  const lowerText = text.toLowerCase();
  serviceKeywords.forEach(service => {
    if (lowerText.includes(service.toLowerCase())) {
      services.push(service);
    }
  });
  
  return [...new Set(services)];
}

function generateKey(inspector) {
  const phone = inspector.phone?.replace(/[^\\d]/g, '') || '';
  const email = inspector.email?.toLowerCase() || '';
  const name = inspector.business_name?.toLowerCase().replace(/[^\\w]/g, '') || '';
  
  if (phone.length >= 10) return `phone_${phone}`;
  if (email) return `email_${email}`;
  return `name_${name}_${inspector.address_city?.toLowerCase()}_${inspector.address_state}`;
}

function isDuplicate(inspector) {
  const key = generateKey(inspector);
  return collectedInspectors.has(key);
}

function addInspector(inspector) {
  const key = generateKey(inspector);
  collectedInspectors.set(key, inspector);
}

// Google Places API functions
async function searchPlaces(query, location, radius = 50000) {
  try {
    stats.apiCalls++;
    
    const response = await axios.get(`${PLACES_API_BASE_URL}/textsearch/json`, {
      params: {
        query: `${query} in ${location}`,
        key: GOOGLE_MAPS_API_KEY,
        type: 'establishment',
        radius: radius
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.results || [];
  } catch (error) {
    log(`Error searching places: ${error.message}`);
    stats.errors++;
    return [];
  }
}

async function getPlaceDetails(placeId) {
  try {
    stats.apiCalls++;
    
    const response = await axios.get(`${PLACES_API_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: 'name,formatted_address,formatted_phone_number,website,geometry,business_status,rating,user_ratings_total,reviews,types'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Place Details API error: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    log(`Error getting place details: ${error.message}`);
    stats.errors++;
    return null;
  }
}

// Enhanced inspector data processing
async function processPlaceResult(place, city, state) {
  try {
    // Get detailed information
    const details = await getPlaceDetails(place.place_id);
    if (!details) return null;

    // Filter out non-inspector businesses
    const name = details.name || place.name || '';
    const types = details.types || place.types || [];
    
    // Check if this is likely an inspector business
    const inspectorKeywords = ['inspect', 'home', 'property', 'residential', 'building'];
    const hasInspectorKeyword = inspectorKeywords.some(keyword => 
      name.toLowerCase().includes(keyword)
    );
    
    if (!hasInspectorKeyword && !types.includes('establishment')) {
      return null;
    }

    // Parse address
    const address = details.formatted_address || place.formatted_address || '';
    const addressParts = address.split(',').map(part => part.trim());
    
    // Extract components
    let street = '';
    let zipCode = '';
    
    if (addressParts.length > 0) {
      street = addressParts[0];
      // Find ZIP code in last part
      const lastPart = addressParts[addressParts.length - 1];
      const zipMatch = lastPart.match(/\\b\\d{5}(-\\d{4})?\\b/);
      if (zipMatch) {
        zipCode = zipMatch[0];
      }
    }

    // Extract coordinates
    const lat = details.geometry?.location?.lat || place.geometry?.location?.lat;
    const lng = details.geometry?.location?.lng || place.geometry?.location?.lng;

    // Extract additional info from reviews
    let certifications = extractCertifications(name);
    let services = extractServices(name);
    let yearsInBusiness = null;
    
    if (details.reviews) {
      const reviewText = details.reviews.map(r => r.text).join(' ');
      certifications = [...new Set([...certifications, ...extractCertifications(reviewText)])];
      services = [...new Set([...services, ...extractServices(reviewText)])];
      
      // Try to extract years in business from reviews
      const yearsMatch = reviewText.match(/(\\d+)\\s+years?\\s+(in\\s+business|experience)/i);
      if (yearsMatch) {
        yearsInBusiness = parseInt(yearsMatch[1]);
      }
    }

    // Create inspector object
    const inspector = {
      business_name: name,
      owner_name: null, // Will be enhanced later
      email: null, // Will be enhanced later via website scraping
      phone: cleanPhone(details.formatted_phone_number),
      website: cleanWebsite(details.website),
      address_street: street,
      address_city: city,
      address_state: state,
      address_zip: zipCode,
      lat: lat,
      lng: lng,
      certifications: certifications.length > 0 ? certifications : ['Home Inspector'],
      services: services.length > 0 ? services : ['Home Inspection'],
      years_in_business: yearsInBusiness,
      insurance_verified: false,
      license_number: null,
      google_place_id: place.place_id,
      google_rating: details.rating,
      google_reviews_count: details.user_ratings_total,
      business_status: details.business_status || 'OPERATIONAL'
    };

    return inspector;
  } catch (error) {
    log(`Error processing place result: ${error.message}`);
    stats.errors++;
    return null;
  }
}

// Enhanced website scraping for additional details
async function enhanceInspectorData(inspector) {
  if (!inspector.website) return inspector;

  try {
    const response = await axios.get(inspector.website, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    const content = response.data.toLowerCase();
    
    // Extract email from website
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
    if (emailMatch && !inspector.email) {
      inspector.email = cleanEmail(emailMatch[0]);
    }

    // Extract owner name
    const ownerPatterns = [
      /owner:?\\s*([a-zA-Z\\s]{2,30})/i,
      /inspector:?\\s*([a-zA-Z\\s]{2,30})/i,
      /founded by\\s*([a-zA-Z\\s]{2,30})/i
    ];
    
    for (const pattern of ownerPatterns) {
      const match = content.match(pattern);
      if (match && !inspector.owner_name) {
        inspector.owner_name = match[1].trim();
        break;
      }
    }

    // Extract additional certifications
    const additionalCerts = extractCertifications(content);
    inspector.certifications = [...new Set([...inspector.certifications, ...additionalCerts])];

    // Extract additional services
    const additionalServices = extractServices(content);
    inspector.services = [...new Set([...inspector.services, ...additionalServices])];

    // Extract years in business
    const yearsMatch = content.match(/(\\d+)\\s+years?\\s+(of\\s+)?experience/i);
    if (yearsMatch && !inspector.years_in_business) {
      inspector.years_in_business = parseInt(yearsMatch[1]);
    }

    // Check for insurance verification
    if (content.includes('insured') || content.includes('insurance')) {
      inspector.insurance_verified = true;
    }

    await sleep(1000); // Rate limit website scraping
  } catch (error) {
    // Website scraping failed, but that's okay
    log(`Website enhancement failed for ${inspector.business_name}: ${error.message}`);
  }

  return inspector;
}

// Database operations
async function createInspectorsTable() {
  try {
    // Try to create the table via raw SQL if it doesn't exist
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS inspectors (
          id BIGSERIAL PRIMARY KEY,
          business_name TEXT NOT NULL,
          owner_name TEXT,
          email TEXT,
          phone TEXT,
          website TEXT,
          address_street TEXT,
          address_city TEXT,
          address_state TEXT,
          address_zip TEXT,
          lat NUMERIC,
          lng NUMERIC,
          certifications TEXT[],
          services TEXT[],
          years_in_business INTEGER,
          insurance_verified BOOLEAN DEFAULT FALSE,
          license_number TEXT,
          google_place_id TEXT UNIQUE,
          google_rating NUMERIC,
          google_reviews_count INTEGER,
          business_status TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_inspectors_city_state ON inspectors(address_city, address_state);
        CREATE INDEX IF NOT EXISTS idx_inspectors_place_id ON inspectors(google_place_id);
      `
    });
    
    if (error) {
      log(`Table creation via RPC failed: ${error.message}`);
      // Try a simple insert to trigger table creation
      const { error: insertError } = await supabase
        .from('inspectors')
        .insert({
          business_name: 'Table Creation Test',
          address_city: 'Test',
          address_state: 'TX'
        });
      
      if (insertError && insertError.code !== '23505') { // 23505 is duplicate key
        log(`Table creation test failed: ${insertError.message}`);
        return false;
      } else {
        // Clean up test record
        await supabase
          .from('inspectors')
          .delete()
          .eq('business_name', 'Table Creation Test');
      }
    }
    
    log('✅ Inspectors table ready');
    return true;
  } catch (error) {
    log(`Error creating table: ${error.message}`);
    return false;
  }
}

async function saveInspectors(inspectors) {
  if (inspectors.length === 0) return;
  
  try {
    // Remove duplicates based on google_place_id
    const uniqueInspectors = inspectors.filter((inspector, index, self) => 
      index === self.findIndex(i => i.google_place_id === inspector.google_place_id)
    );

    const { data, error } = await supabase
      .from('inspectors')
      .upsert(uniqueInspectors, { 
        onConflict: 'google_place_id',
        ignoreDuplicates: false 
      })
      .select('id');
    
    if (error) {
      log(`Batch save error: ${error.message}`);
      
      // Try saving individually
      let successCount = 0;
      for (const inspector of uniqueInspectors) {
        try {
          const { error: individualError } = await supabase
            .from('inspectors')
            .upsert([inspector], { onConflict: 'google_place_id' });
          
          if (!individualError) {
            successCount++;
          } else {
            log(`Individual save failed for ${inspector.business_name}: ${individualError.message}`);
          }
        } catch (e) {
          log(`Exception saving ${inspector.business_name}: ${e.message}`);
        }
      }
      
      stats.savedToDatabase += successCount;
      log(`Saved ${successCount} out of ${uniqueInspectors.length} inspectors individually`);
    } else {
      stats.savedToDatabase += data.length;
      log(`Successfully saved ${data.length} inspectors to database`);
    }
    
  } catch (error) {
    log(`Error in saveInspectors: ${error.message}`);
    stats.errors++;
  }
}

// Main harvesting function
async function harvestInspectorsForCity(city, state) {
  log(`🎯 Starting harvest for ${city}, ${state}`);
  
  const cityInspectors = [];
  
  for (const searchTerm of SEARCH_TERMS) {
    try {
      log(`  Searching for "${searchTerm}" in ${city}, ${state}`);
      
      const places = await searchPlaces(searchTerm, `${city}, ${state}`);
      log(`  Found ${places.length} places for "${searchTerm}"`);
      
      for (const place of places) {
        const inspector = await processPlaceResult(place, city, state);
        
        if (inspector && !isDuplicate(inspector)) {
          // Enhance with website data
          const enhancedInspector = await enhanceInspectorData(inspector);
          
          addInspector(enhancedInspector);
          cityInspectors.push(enhancedInspector);
          stats.totalCollected++;
          
          log(`  ✅ Collected: ${inspector.business_name}`);
        } else if (inspector) {
          stats.duplicatesSkipped++;
          log(`  ⏭️  Skipped duplicate: ${inspector.business_name}`);
        }
        
        // Rate limiting
        await sleep(200);
        
        // Stop if we've reached our target
        if (stats.totalCollected >= 10000) {
          log('🎯 Reached target of 10,000 inspectors!');
          return cityInspectors;
        }
      }
      
      // Rate limiting between search terms
      await sleep(1000);
      
    } catch (error) {
      log(`Error processing search term "${searchTerm}" in ${city}, ${state}: ${error.message}`);
      stats.errors++;
    }
  }
  
  stats.citiesProcessed++;
  log(`✅ Completed ${city}, ${state}. Collected ${cityInspectors.length} new inspectors`);
  
  return cityInspectors;
}

// Main execution function
async function runEnhancedHarvester() {
  await ensureLogsDir();
  
  log('🚀 Enhanced Google Maps Inspector Harvester Starting');
  log('==================================================');
  log(`Target: 10,000 real inspector listings`);
  log(`API Key: ${GOOGLE_MAPS_API_KEY ? 'Configured' : 'MISSING'}`);
  log(`Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}`);
  log('');

  if (!GOOGLE_MAPS_API_KEY) {
    log('❌ Google Maps API key not configured');
    return false;
  }

  // Setup database
  const tableReady = await createInspectorsTable();
  if (!tableReady) {
    log('❌ Database table setup failed');
    log('Please manually create the table using the SQL provided in manual-schema-setup.js');
    return false;
  }

  // Sort cities by population for maximum ROI
  const sortedCities = HIGH_PRIORITY_CITIES.sort((a, b) => b.population - a.population);
  
  let batchInspectors = [];
  const batchSize = 50;

  for (const city of sortedCities) {
    try {
      const cityInspectors = await harvestInspectorsForCity(city.name, city.state);
      batchInspectors.push(...cityInspectors);
      
      // Save batch when it reaches batch size
      if (batchInspectors.length >= batchSize) {
        await saveInspectors(batchInspectors);
        batchInspectors = [];
      }
      
      // Progress update
      const elapsed = (Date.now() - stats.startTime) / 1000;
      const rate = stats.totalCollected / (elapsed / 60); // per minute
      log(`📊 Progress: ${stats.totalCollected}/10,000 (${(stats.totalCollected/100).toFixed(1)}%) | Rate: ${rate.toFixed(1)}/min | API calls: ${stats.apiCalls}`);
      
      // Rate limiting between cities
      await sleep(2000);
      
      // Stop if target reached
      if (stats.totalCollected >= 10000) {
        break;
      }
      
    } catch (error) {
      log(`Error processing ${city.name}, ${city.state}: ${error.message}`);
      stats.errors++;
    }
  }
  
  // Save remaining batch
  if (batchInspectors.length > 0) {
    await saveInspectors(batchInspectors);
  }

  // Final report
  const duration = (Date.now() - stats.startTime) / 1000;
  
  log('');
  log('🎉 Enhanced Harvester Complete!');
  log('================================');
  log(`Total collected: ${stats.totalCollected}`);
  log(`Cities processed: ${stats.citiesProcessed}`);
  log(`Saved to database: ${stats.savedToDatabase}`);
  log(`Duplicates skipped: ${stats.duplicatesSkipped}`);
  log(`API calls made: ${stats.apiCalls}`);
  log(`Errors encountered: ${stats.errors}`);
  log(`Duration: ${(duration / 60).toFixed(1)} minutes`);
  log(`Collection rate: ${(stats.totalCollected / (duration / 60)).toFixed(1)} inspectors/minute`);
  
  // Save summary report
  const summary = {
    timestamp: new Date().toISOString(),
    totalCollected: stats.totalCollected,
    citiesProcessed: stats.citiesProcessed,
    savedToDatabase: stats.savedToDatabase,
    duplicatesSkipped: stats.duplicatesSkipped,
    apiCalls: stats.apiCalls,
    errors: stats.errors,
    durationMinutes: duration / 60,
    collectionRate: stats.totalCollected / (duration / 60),
    targetReached: stats.totalCollected >= 10000,
    dataQuality: {
      phoneNumbers: Array.from(collectedInspectors.values()).filter(i => i.phone).length,
      emails: Array.from(collectedInspectors.values()).filter(i => i.email).length,
      websites: Array.from(collectedInspectors.values()).filter(i => i.website).length,
      coordinates: Array.from(collectedInspectors.values()).filter(i => i.lat && i.lng).length
    }
  };
  
  await fs.writeJson(
    path.join(__dirname, '..', 'logs', 'enhanced-harvester-summary.json'), 
    summary, 
    { spaces: 2 }
  );
  
  log(`📋 Summary report saved to logs/enhanced-harvester-summary.json`);
  
  if (stats.totalCollected >= 10000) {
    log('🎯 SUCCESS: Target of 10,000 inspectors reached!');
  } else {
    log(`🎯 Collected ${stats.totalCollected} inspectors. Target not fully reached.`);
  }
  
  return true;
}

// Export for module use
module.exports = {
  runEnhancedHarvester,
  stats
};

// Run if called directly
if (require.main === module) {
  runEnhancedHarvester().catch(error => {
    log(`💥 Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}