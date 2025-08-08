#!/usr/bin/env node

/**
 * Bay Area Inspector Harvester for InspectorsNearMe.com
 * 
 * Focused harvesting for San Francisco, Oakland, and San Jose
 * using Google Maps Places API for maximum data quality
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Bay Area target cities
const BAY_AREA_CITIES = [
  { name: 'San Francisco', state: 'CA', population: 875000, priority: 1 },
  { name: 'Oakland', state: 'CA', population: 435000, priority: 2 },
  { name: 'San Jose', state: 'CA', population: 1015000, priority: 1 }
];

// Enhanced search terms for better coverage
const SEARCH_TERMS = [
  'home inspector',
  'property inspector',
  'house inspector',
  'residential inspector',
  'home inspection service',
  'certified home inspector',
  'licensed home inspector',
  'building inspector residential',
  'pre-purchase inspection',
  'real estate inspection'
];

// Collection statistics
let stats = {
  totalCollected: 0,
  citiesProcessed: 0,
  duplicatesSkipped: 0,
  errors: 0,
  apiCalls: 0,
  startTime: Date.now(),
  targetReached: false
};

// Deduplication tracking
const collectedInspectors = new Map();

// Logging setup
const logFile = path.join(__dirname, '..', 'logs', 'bay-area-harvester.log');

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

// Data cleaning functions
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    'Roof Inspection', 'Foundation Inspection', 'Commercial Inspection',
    'Energy Audit', 'Air Quality Testing', 'Asbestos Testing'
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
  const phone = inspector.phone?.replace(/[^\d]/g, '') || '';
  const email = inspector.email?.toLowerCase() || '';
  const name = inspector.business_name?.toLowerCase().replace(/[^\w]/g, '') || '';
  
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
async function searchPlaces(query, location, radius = 25000) {
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

    if (response.data.status === 'OVER_QUERY_LIMIT') {
      log('⚠️  API quota exceeded - pausing');
      await sleep(60000); // Wait 1 minute
      return [];
    }

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
        fields: 'name,formatted_address,formatted_phone_number,website,geometry,business_status,rating,user_ratings_total,reviews,types,opening_hours'
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

async function processPlaceResult(place, city, state) {
  try {
    // Get detailed information
    const details = await getPlaceDetails(place.place_id);
    if (!details) return null;

    // Filter out non-inspector businesses
    const name = details.name || place.name || '';
    const types = details.types || place.types || [];
    
    // Enhanced filtering for inspectors
    const inspectorKeywords = ['inspect', 'home', 'property', 'residential', 'building'];
    const hasInspectorKeyword = inspectorKeywords.some(keyword => 
      name.toLowerCase().includes(keyword)
    );
    
    // Skip obvious non-inspectors
    const excludeKeywords = ['restaurant', 'hotel', 'store', 'shop', 'bank', 'gas', 'medical'];
    const isExcluded = excludeKeywords.some(keyword => 
      name.toLowerCase().includes(keyword)
    );
    
    if (!hasInspectorKeyword || isExcluded) {
      return null;
    }

    // Parse address
    const address = details.formatted_address || place.formatted_address || '';
    const addressParts = address.split(',').map(part => part.trim());
    
    let street = '';
    let zipCode = '';
    
    if (addressParts.length > 0) {
      street = addressParts[0];
      const lastPart = addressParts[addressParts.length - 1];
      const zipMatch = lastPart.match(/\b\d{5}(-\d{4})?\b/);
      if (zipMatch) {
        zipCode = zipMatch[0];
      }
    }

    // Extract coordinates
    const lat = details.geometry?.location?.lat || place.geometry?.location?.lat;
    const lng = details.geometry?.location?.lng || place.geometry?.location?.lng;

    // Extract additional info from reviews and description
    let certifications = extractCertifications(name);
    let services = extractServices(name);
    let yearsInBusiness = null;
    
    if (details.reviews) {
      const reviewText = details.reviews.map(r => r.text).join(' ');
      certifications = [...new Set([...certifications, ...extractCertifications(reviewText)])];
      services = [...new Set([...services, ...extractServices(reviewText)])];
      
      // Try to extract years in business from reviews
      const yearsMatch = reviewText.match(/(\d+)\s+years?\s+(in\s+business|experience)/i);
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
      business_status: details.business_status || 'OPERATIONAL',
      is_open: details.opening_hours?.open_now,
      data_source: 'Google Maps Places API',
      collected_at: new Date().toISOString()
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
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !inspector.email) {
      inspector.email = cleanEmail(emailMatch[0]);
    }

    // Extract owner name
    const ownerPatterns = [
      /owner:?\s*([a-zA-Z\s]{2,30})/i,
      /inspector:?\s*([a-zA-Z\s]{2,30})/i,
      /founded by\s*([a-zA-Z\s]{2,30})/i,
      /certified by\s*([a-zA-Z\s]{2,30})/i
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
    const yearsMatch = content.match(/(\d+)\s+years?\s+(of\s+)?experience/i);
    if (yearsMatch && !inspector.years_in_business) {
      inspector.years_in_business = parseInt(yearsMatch[1]);
    }

    // Check for insurance verification
    if (content.includes('insured') || content.includes('insurance') || content.includes('bonded')) {
      inspector.insurance_verified = true;
    }

    await sleep(2000); // Rate limit website scraping
  } catch (error) {
    log(`Website enhancement failed for ${inspector.business_name}: ${error.message}`);
  }

  return inspector;
}

// Save results to JSON file
async function saveResults() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataFile = path.join(__dirname, '..', 'logs', `bay-area-inspectors-${timestamp}.json`);
    const csvFile = path.join(__dirname, '..', 'logs', `bay-area-inspectors-${timestamp}.csv`);
    
    const inspectorsArray = Array.from(collectedInspectors.values());
    
    // Save JSON
    const dataToSave = {
      metadata: {
        collected_at: new Date().toISOString(),
        total_inspectors: stats.totalCollected,
        cities_processed: stats.citiesProcessed,
        api_calls: stats.apiCalls,
        duplicates_skipped: stats.duplicatesSkipped,
        errors: stats.errors,
        duration_minutes: (Date.now() - stats.startTime) / 60000,
        target_reached: stats.targetReached,
        cities: BAY_AREA_CITIES.map(city => city.name)
      },
      inspectors: inspectorsArray
    };
    
    await fs.writeJson(dataFile, dataToSave, { spaces: 2 });
    log(`📄 Data saved to: ${dataFile}`);
    
    // Save CSV
    if (inspectorsArray.length > 0) {
      const headers = Object.keys(inspectorsArray[0]);
      const csvRows = [headers.join(',')];
      
      inspectorsArray.forEach(inspector => {
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
      
      await fs.writeFile(csvFile, csvRows.join('\n'));
      log(`📊 CSV saved to: ${csvFile}`);
    }
    
    return { dataFile, csvFile };
  } catch (error) {
    log(`Error saving results: ${error.message}`);
    return null;
  }
}

// Main harvesting function for a city
async function harvestInspectorsForCity(city, state) {
  log(`🎯 Starting Bay Area harvest for ${city}, ${state}`);
  
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
        await sleep(500);
        
        // Check for target reached
        if (stats.totalCollected >= 60) {
          log('🎯 Reached target of 60 Bay Area inspectors!');
          stats.targetReached = true;
          return cityInspectors;
        }
      }
      
      // Rate limiting between search terms
      await sleep(2000);
      
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
async function runBayAreaHarvester() {
  await ensureLogsDir();
  
  log('🚀 Bay Area Inspector Harvester Starting');
  log('=========================================');
  log(`Target: 60 Bay Area inspector listings (20 per city)`);
  log(`API Key: ${GOOGLE_MAPS_API_KEY ? 'Configured' : 'MISSING'}`);
  log(`Cities: ${BAY_AREA_CITIES.map(c => c.name).join(', ')}`);
  log('');

  if (!GOOGLE_MAPS_API_KEY) {
    log('❌ Google Maps API key not configured');
    return false;
  }

  for (const city of BAY_AREA_CITIES) {
    try {
      await harvestInspectorsForCity(city.name, city.state);
      
      // Progress update
      const elapsed = (Date.now() - stats.startTime) / 1000;
      const rate = stats.totalCollected / (elapsed / 60); // per minute
      log(`📊 Progress: ${stats.totalCollected}/60 | Rate: ${rate.toFixed(1)}/min | API calls: ${stats.apiCalls}`);
      
      // Rate limiting between cities
      await sleep(5000);
      
      // Stop if target reached
      if (stats.targetReached) {
        break;
      }
      
    } catch (error) {
      log(`Error processing ${city.name}, ${city.state}: ${error.message}`);
      stats.errors++;
    }
  }

  // Save results
  const files = await saveResults();

  // Final report
  const duration = (Date.now() - stats.startTime) / 1000;
  
  log('');
  log('🎉 Bay Area Harvester Complete!');
  log('===============================');
  log(`Total collected: ${stats.totalCollected}`);
  log(`Cities processed: ${stats.citiesProcessed}`);
  log(`Duplicates skipped: ${stats.duplicatesSkipped}`);
  log(`API calls made: ${stats.apiCalls}`);
  log(`Errors encountered: ${stats.errors}`);
  log(`Duration: ${(duration / 60).toFixed(1)} minutes`);
  log(`Collection rate: ${(stats.totalCollected / (duration / 60)).toFixed(1)} inspectors/minute`);
  
  // Data quality metrics
  const inspectorsArray = Array.from(collectedInspectors.values());
  const withPhones = inspectorsArray.filter(i => i.phone).length;
  const withWebsites = inspectorsArray.filter(i => i.website).length;
  const withEmails = inspectorsArray.filter(i => i.email).length;
  const withCoordinates = inspectorsArray.filter(i => i.lat && i.lng).length;
  
  log('');
  log('📊 Data Quality:');
  log(`Phone Numbers: ${withPhones}/${stats.totalCollected} (${(withPhones/stats.totalCollected*100).toFixed(1)}%)`);
  log(`Websites: ${withWebsites}/${stats.totalCollected} (${(withWebsites/stats.totalCollected*100).toFixed(1)}%)`);
  log(`Email Addresses: ${withEmails}/${stats.totalCollected} (${(withEmails/stats.totalCollected*100).toFixed(1)}%)`);
  log(`Coordinates: ${withCoordinates}/${stats.totalCollected} (${(withCoordinates/stats.totalCollected*100).toFixed(1)}%)`);
  
  if (files) {
    log('');
    log('📁 Files generated:');
    log(`   JSON: ${files.dataFile}`);
    log(`   CSV: ${files.csvFile}`);
  }
  
  if (stats.targetReached) {
    log('');
    log('🎯 SUCCESS: Bay Area inspector target reached!');
    log('💡 Next steps:');
    log('   1. Review the collected data in the JSON file');
    log('   2. Import to database once schema is set up');
    log('   3. Verify data quality and remove duplicates');
    log('   4. Begin targeted outreach campaigns');
  }
  
  return true;
}

// Export for module use
module.exports = {
  runBayAreaHarvester,
  stats,
  BAY_AREA_CITIES
};

// Run if called directly
if (require.main === module) {
  runBayAreaHarvester().catch(error => {
    log(`💥 Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}