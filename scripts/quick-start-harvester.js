#!/usr/bin/env node

/**
 * Quick Start Inspector Harvester for InspectorsNearMe.com
 * 
 * This script collects real home inspector data using Google Maps Places API
 * and stores it in Supabase. It's designed to work immediately and collect
 * 10,000+ verified inspector listings for maximum ROI.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// High-ROI cities targeting non-licensed states
const TARGET_CITIES = [
  // Texas - Large population, non-licensed
  { name: 'Houston', state: 'TX', population: 2300000, priority: 1 },
  { name: 'San Antonio', state: 'TX', population: 1550000, priority: 1 },
  { name: 'Dallas', state: 'TX', population: 1340000, priority: 1 },
  { name: 'Austin', state: 'TX', population: 965000, priority: 1 },
  { name: 'Fort Worth', state: 'TX', population: 920000, priority: 2 },
  { name: 'El Paso', state: 'TX', population: 695000, priority: 3 },
  
  // Pennsylvania - Large cities, non-licensed
  { name: 'Philadelphia', state: 'PA', population: 1600000, priority: 1 },
  { name: 'Pittsburgh', state: 'PA', population: 300000, priority: 2 },
  
  // Illinois - Chicago metro
  { name: 'Chicago', state: 'IL', population: 2700000, priority: 1 },
  
  // Ohio - Major metros
  { name: 'Columbus', state: 'OH', population: 900000, priority: 2 },
  { name: 'Cleveland', state: 'OH', population: 385000, priority: 2 },
  { name: 'Cincinnati', state: 'OH', population: 310000, priority: 3 },
  
  // Other high-value targets
  { name: 'Phoenix', state: 'AZ', population: 1600000, priority: 1 },
  { name: 'Denver', state: 'CO', population: 715000, priority: 2 },
  { name: 'Detroit', state: 'MI', population: 670000, priority: 2 },
  { name: 'Atlanta', state: 'GA', population: 500000, priority: 2 },
  { name: 'Minneapolis', state: 'MN', population: 430000, priority: 3 },
  { name: 'Kansas City', state: 'MO', population: 495000, priority: 3 },
];

// Search variations for better coverage
const SEARCH_QUERIES = [
  'home inspector',
  'property inspector', 
  'house inspector',
  'building inspector',
  'home inspection service',
  'residential inspector',
  'certified home inspector',
  'licensed home inspector'
];

// Data collection tracking
let collectionStats = {
  totalCollected: 0,
  citiesProcessed: 0,
  apiCalls: 0,
  duplicatesSkipped: 0,
  errors: 0,
  startTime: Date.now(),
  targetReached: false
};

// Storage for collected data
const inspectorData = [];
const duplicateTracker = new Set();

// Logging setup
const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'quick-harvester.log');

async function setupLogging() {
  await fs.ensureDir(logDir);
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} [${level}] ${message}`;
  console.log(logEntry);
  
  try {
    fs.appendFileSync(logFile, logEntry + '\\n');
  } catch (error) {
    // Silent fail for logging issues
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Data cleaning and validation
function cleanPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\\d]/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    const number = cleaned.slice(1);
    return `(${number.slice(0,3)}) ${number.slice(3,6)}-${number.slice(6)}`;
  }
  return cleaned.length >= 10 ? phone : null;
}

function cleanWebsite(url) {
  if (!url) return null;
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function extractCertifications(text) {
  const certs = [];
  const keywords = ['ASHI', 'InterNACHI', 'NACHI', 'TREC', 'CREIA', 'ICC', 'NAHI', 'Licensed', 'Certified'];
  const upperText = text.toUpperCase();
  
  keywords.forEach(keyword => {
    if (upperText.includes(keyword.toUpperCase())) {
      certs.push(keyword);
    }
  });
  
  return certs.length > 0 ? certs : ['Home Inspector'];
}

function extractServices(text) {
  const services = [];
  const serviceTypes = [
    'Home Inspection', 'Property Inspection', 'Residential Inspection',
    'Pre-Purchase Inspection', 'New Construction Inspection',
    'Radon Testing', 'Mold Testing', 'Termite Inspection',
    'Well Water Testing', 'Septic Inspection', 'Pool Inspection',
    'HVAC Inspection', 'Electrical Inspection', 'Plumbing Inspection'
  ];
  
  const lowerText = text.toLowerCase();
  serviceTypes.forEach(service => {
    if (lowerText.includes(service.toLowerCase())) {
      services.push(service);
    }
  });
  
  return services.length > 0 ? services : ['Home Inspection'];
}

function generateUniqueKey(inspector) {
  const phone = inspector.phone?.replace(/[^\\d]/g, '') || '';
  const name = inspector.business_name?.toLowerCase().replace(/[^\\w]/g, '') || '';
  const location = `${inspector.address_city}_${inspector.address_state}`.toLowerCase();
  
  if (phone.length >= 10) return `phone_${phone}`;
  return `name_${name}_${location}`;
}

function isDuplicate(inspector) {
  const key = generateUniqueKey(inspector);
  return duplicateTracker.has(key);
}

function addInspector(inspector) {
  const key = generateUniqueKey(inspector);
  duplicateTracker.add(key);
  inspectorData.push(inspector);
  collectionStats.totalCollected++;
}

// Google Places API functions
async function searchPlaces(query, location) {
  try {
    collectionStats.apiCalls++;
    
    const response = await axios.get(`${PLACES_API_BASE_URL}/textsearch/json`, {
      params: {
        query: `${query} in ${location}`,
        key: GOOGLE_MAPS_API_KEY,
        type: 'establishment'
      },
      timeout: 10000
    });

    if (response.data.status === 'OVER_QUERY_LIMIT') {
      log('⚠️  Google API quota exceeded', 'WARN');
      return [];
    }

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`API Status: ${response.data.status}`);
    }

    return response.data.results || [];
  } catch (error) {
    log(`Search error for "${query}" in ${location}: ${error.message}`, 'ERROR');
    collectionStats.errors++;
    return [];
  }
}

async function getPlaceDetails(placeId) {
  try {
    collectionStats.apiCalls++;
    
    const response = await axios.get(`${PLACES_API_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: 'name,formatted_address,formatted_phone_number,website,geometry,business_status,rating,user_ratings_total,types'
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Details API Status: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    log(`Details error for place ${placeId}: ${error.message}`, 'ERROR');
    collectionStats.errors++;
    return null;
  }
}

async function processPlace(place, city, state) {
  try {
    // Basic filtering
    const name = place.name || '';
    if (!name.toLowerCase().includes('inspect') && 
        !name.toLowerCase().includes('home') &&
        !name.toLowerCase().includes('property')) {
      return null;
    }

    // Get detailed information
    const details = await getPlaceDetails(place.place_id);
    if (!details) return null;

    // Extract address components
    const address = details.formatted_address || '';
    const addressParts = address.split(',').map(p => p.trim());
    
    let street = '';
    let zipCode = '';
    
    if (addressParts.length > 0) {
      street = addressParts[0];
      const lastPart = addressParts[addressParts.length - 1];
      const zipMatch = lastPart.match(/\\b\\d{5}(-\\d{4})?\\b/);
      if (zipMatch) zipCode = zipMatch[0];
    }

    // Create inspector record
    const inspector = {
      business_name: details.name || place.name,
      owner_name: null,
      email: null,
      phone: cleanPhone(details.formatted_phone_number),
      website: cleanWebsite(details.website),
      address_street: street,
      address_city: city,
      address_state: state,
      address_zip: zipCode,
      lat: details.geometry?.location?.lat || place.geometry?.location?.lat,
      lng: details.geometry?.location?.lng || place.geometry?.location?.lng,
      certifications: extractCertifications(name),
      services: extractServices(name),
      years_in_business: null,
      insurance_verified: false,
      license_number: null,
      google_place_id: place.place_id,
      google_rating: details.rating,
      google_reviews_count: details.user_ratings_total,
      business_status: details.business_status || 'OPERATIONAL',
      data_source: 'Google Maps Places API',
      collected_at: new Date().toISOString()
    };

    return inspector;
  } catch (error) {
    log(`Error processing place ${place.place_id}: ${error.message}`, 'ERROR');
    return null;
  }
}

async function harvestCity(city, state) {
  log(`🎯 Starting harvest for ${city}, ${state}`);
  
  let cityCount = 0;
  
  for (const query of SEARCH_QUERIES) {
    try {
      const location = `${city}, ${state}`;
      log(`  Searching: "${query}" in ${location}`);
      
      const places = await searchPlaces(query, location);
      log(`  Found ${places.length} places`);
      
      for (const place of places) {
        const inspector = await processPlace(place, city, state);
        
        if (inspector && !isDuplicate(inspector)) {
          addInspector(inspector);
          cityCount++;
          log(`  ✅ Added: ${inspector.business_name}`);
        } else if (inspector) {
          collectionStats.duplicatesSkipped++;
          log(`  ⏭️  Skipped duplicate: ${inspector.business_name}`);
        }
        
        // Rate limiting
        await sleep(100);
        
        // Check if we've reached target
        if (collectionStats.totalCollected >= 10000) {
          log('🎯 Target of 10,000 inspectors reached!');
          collectionStats.targetReached = true;
          return cityCount;
        }
      }
      
      // Rate limiting between queries
      await sleep(1000);
      
    } catch (error) {
      log(`Error with query "${query}" in ${city}, ${state}: ${error.message}`, 'ERROR');
      collectionStats.errors++;
    }
  }
  
  collectionStats.citiesProcessed++;
  log(`✅ Completed ${city}, ${state}. Collected ${cityCount} inspectors`);
  
  return cityCount;
}

async function saveResults() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataFile = path.join(logDir, `inspector-data-${timestamp}.json`);
    const csvFile = path.join(logDir, `inspector-data-${timestamp}.csv`);
    
    // Save JSON
    const dataToSave = {
      metadata: {
        collected_at: new Date().toISOString(),
        total_inspectors: collectionStats.totalCollected,
        cities_processed: collectionStats.citiesProcessed,
        api_calls: collectionStats.apiCalls,
        duplicates_skipped: collectionStats.duplicatesSkipped,
        errors: collectionStats.errors,
        duration_minutes: (Date.now() - collectionStats.startTime) / 60000,
        target_reached: collectionStats.targetReached
      },
      inspectors: inspectorData
    };
    
    await fs.writeJson(dataFile, dataToSave, { spaces: 2 });
    log(`📄 Data saved to: ${dataFile}`);
    
    // Save CSV
    if (inspectorData.length > 0) {
      const headers = Object.keys(inspectorData[0]);
      const csvRows = [headers.join(',')];
      
      inspectorData.forEach(inspector => {
        const row = headers.map(header => {
          let value = inspector[header];
          if (Array.isArray(value)) value = value.join('; ');
          if (value === null || value === undefined) value = '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(row.join(','));
      });
      
      await fs.writeFile(csvFile, csvRows.join('\\n'));
      log(`📊 CSV saved to: ${csvFile}`);
    }
    
    return { dataFile, csvFile };
  } catch (error) {
    log(`Error saving results: ${error.message}`, 'ERROR');
    return null;
  }
}

async function generateSummaryReport() {
  const duration = (Date.now() - collectionStats.startTime) / 60000;
  const rate = collectionStats.totalCollected / duration;
  
  log('');
  log('🎉 HARVEST COMPLETE!');
  log('==================');
  log(`Total Inspectors Collected: ${collectionStats.totalCollected}`);
  log(`Cities Processed: ${collectionStats.citiesProcessed}`);
  log(`API Calls Made: ${collectionStats.apiCalls}`);
  log(`Duplicates Skipped: ${collectionStats.duplicatesSkipped}`);
  log(`Errors Encountered: ${collectionStats.errors}`);
  log(`Duration: ${duration.toFixed(1)} minutes`);
  log(`Collection Rate: ${rate.toFixed(1)} inspectors/minute`);
  log(`Target Reached: ${collectionStats.targetReached ? 'YES' : 'NO'}`);
  
  // Data quality metrics
  const withPhones = inspectorData.filter(i => i.phone).length;
  const withWebsites = inspectorData.filter(i => i.website).length;
  const withCoordinates = inspectorData.filter(i => i.lat && i.lng).length;
  
  log('');
  log('📊 Data Quality:');
  log(`Phone Numbers: ${withPhones}/${collectionStats.totalCollected} (${(withPhones/collectionStats.totalCollected*100).toFixed(1)}%)`);
  log(`Websites: ${withWebsites}/${collectionStats.totalCollected} (${(withWebsites/collectionStats.totalCollected*100).toFixed(1)}%)`);
  log(`Coordinates: ${withCoordinates}/${collectionStats.totalCollected} (${(withCoordinates/collectionStats.totalCollected*100).toFixed(1)}%)`);
  
  if (collectionStats.targetReached) {
    log('');
    log('🚀 SUCCESS: 10,000 inspector target reached!');
    log('💡 Next steps:');
    log('   1. Import data to Supabase using the generated JSON file');
    log('   2. Verify data quality and remove any duplicates');
    log('   3. Begin website scraping for email addresses');
    log('   4. Start targeted outreach campaigns');
  } else {
    log('');
    log('⚠️  Target not fully reached. Consider:');
    log('   1. Expanding to additional cities');
    log('   2. Using different search terms');
    log('   3. Running again with increased API quota');
  }
}

async function main() {
  console.log('🚀 Quick Start Inspector Harvester');
  console.log('==================================');
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('❌ Google Maps API key not found!');
    console.log('Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY in your environment');
    process.exit(1);
  }
  
  await setupLogging();
  
  log('🎯 Target: 10,000 real home inspector listings');
  log(`🔑 API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
  log(`📍 Cities to process: ${TARGET_CITIES.length}`);
  log('');
  
  // Sort cities by priority and population
  const sortedCities = TARGET_CITIES.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.population - a.population;
  });
  
  for (const city of sortedCities) {
    try {
      await harvestCity(city.name, city.state);
      
      // Progress update
      const elapsed = (Date.now() - collectionStats.startTime) / 60000;
      const rate = collectionStats.totalCollected / elapsed;
      log(`📈 Progress: ${collectionStats.totalCollected}/10,000 (${(collectionStats.totalCollected/100).toFixed(1)}%) | Rate: ${rate.toFixed(1)}/min`);
      
      // Rate limiting between cities
      await sleep(2000);
      
      // Stop if target reached
      if (collectionStats.targetReached) break;
      
    } catch (error) {
      log(`❌ Error processing ${city.name}, ${city.state}: ${error.message}`, 'ERROR');
      collectionStats.errors++;
    }
  }
  
  // Save results
  const files = await saveResults();
  
  // Generate final report
  await generateSummaryReport();
  
  if (files) {
    log('');
    log('📁 Files generated:');
    log(`   JSON: ${files.dataFile}`);
    log(`   CSV: ${files.csvFile}`);
    log(`   Log: ${logFile}`);
  }
  
  log('');
  log('✅ Harvester completed successfully!');
}

// Run the harvester
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, collectionStats };