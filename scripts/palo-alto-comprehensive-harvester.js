#!/usr/bin/env node

/**
 * Comprehensive Palo Alto Inspector Harvester
 * 
 * Executes systematic collection across ALL inspector types:
 * - Home Inspectors
 * - Termite/Pest Inspectors  
 * - Foundation/Structural Inspectors
 * - Specialty Testing Inspectors (mold, radon, pool, asbestos)
 * - Commercial Building Inspectors
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Target location
const TARGET_LOCATION = {
  city: 'Palo Alto',
  state: 'CA',
  coordinates: { lat: 37.4419, lng: -122.1430 }
};

// Comprehensive search strategy - ALL inspector types
const INSPECTION_CATEGORIES = {
  homeInspectors: {
    name: 'Home Inspectors',
    queries: [
      'home inspector Palo Alto CA',
      'property inspector Palo Alto CA', 
      'house inspector Palo Alto CA',
      'residential inspector Palo Alto CA',
      'pre-purchase inspection Palo Alto CA',
      'home inspection service Palo Alto CA',
      'certified home inspector Palo Alto CA',
      'licensed home inspector Palo Alto CA'
    ],
    targetCount: 20
  },
  
  termitePest: {
    name: 'Termite/Pest Inspectors',
    queries: [
      'termite inspector Palo Alto CA',
      'pest inspector Palo Alto CA',
      'termite inspection Palo Alto CA',
      'pest control inspection Palo Alto CA',
      'wood destroying pest inspection Palo Alto CA',
      'WDI inspection Palo Alto CA',
      'dry rot inspection Palo Alto CA'
    ],
    targetCount: 15
  },
  
  foundationStructural: {
    name: 'Foundation/Structural Inspectors',
    queries: [
      'foundation inspector Palo Alto CA',
      'structural inspector Palo Alto CA',
      'foundation inspection Palo Alto CA',
      'structural engineer Palo Alto CA',
      'structural inspection Palo Alto CA',
      'seismic inspection Palo Alto CA',
      'earthquake inspection Palo Alto CA',
      'foundation repair inspection Palo Alto CA'
    ],
    targetCount: 12
  },
  
  specialtyTesting: {
    name: 'Specialty Testing Inspectors',
    queries: [
      'mold inspection Palo Alto CA',
      'radon testing Palo Alto CA',
      'pool inspection Palo Alto CA',
      'asbestos testing Palo Alto CA',
      'lead paint testing Palo Alto CA',
      'air quality testing Palo Alto CA',
      'water quality testing Palo Alto CA',
      'environmental testing Palo Alto CA',
      'HVAC inspection Palo Alto CA',
      'chimney inspection Palo Alto CA'
    ],
    targetCount: 15
  },
  
  commercialBuilding: {
    name: 'Commercial Building Inspectors',
    queries: [
      'commercial building inspection Palo Alto CA',
      'commercial inspector Palo Alto CA',
      'multi-family inspection Palo Alto CA',
      'apartment building inspection Palo Alto CA',
      'commercial property inspection Palo Alto CA',
      'office building inspection Palo Alto CA',
      'retail space inspection Palo Alto CA',
      'industrial inspection Palo Alto CA'
    ],
    targetCount: 10
  }
};

// Collection statistics
let stats = {
  totalCollected: 0,
  categoriesProcessed: 0,
  queriesExecuted: 0,
  apiCalls: 0,
  duplicatesSkipped: 0,
  errors: 0,
  startTime: Date.now(),
  categoryBreakdown: {}
};

// Storage and deduplication
const inspectorData = [];
const duplicateTracker = new Set();

// Logging setup
const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'palo-alto-comprehensive.log');

async function setupLogging() {
  await fs.ensureDir(logDir);
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} [${level}] ${message}`;
  console.log(logEntry);
  
  try {
    fs.appendFileSync(logFile, logEntry + '\n');
  } catch (error) {
    // Silent fail for logging issues
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced data cleaning and validation
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

function extractCertifications(text, category) {
  const certs = [];
  
  // General certifications
  const generalKeywords = ['ASHI', 'InterNACHI', 'NACHI', 'TREC', 'CREIA', 'ICC', 'NAHI', 'Licensed', 'Certified'];
  
  // Category-specific certifications
  const categorySpecific = {
    homeInspectors: ['CAHPI', 'AHIT', 'NCHI', 'ICA'],
    termitePest: ['Structural Pest Control', 'Branch 3', 'WDI Certified'],
    foundationStructural: ['PE', 'SE', 'Structural Engineer', 'Civil Engineer'],
    specialtyTesting: ['NRPP', 'NEHA', 'ACAC', 'CIE', 'CMR'],
    commercialBuilding: ['ICC', 'Commercial Inspector', 'CBI']
  };
  
  const upperText = text.toUpperCase();
  
  // Check general certifications
  generalKeywords.forEach(keyword => {
    if (upperText.includes(keyword.toUpperCase())) {
      certs.push(keyword);
    }
  });
  
  // Check category-specific certifications
  if (categorySpecific[category]) {
    categorySpecific[category].forEach(keyword => {
      if (upperText.includes(keyword.toUpperCase())) {
        certs.push(keyword);
      }
    });
  }
  
  return certs.length > 0 ? certs : ['Inspector'];
}

function extractServices(text, category) {
  const services = [];
  
  // Category-specific services
  const categoryServices = {
    homeInspectors: [
      'Home Inspection', 'Property Inspection', 'Residential Inspection',
      'Pre-Purchase Inspection', 'New Construction Inspection',
      'Move-in Inspection', 'Warranty Inspection'
    ],
    termitePest: [
      'Termite Inspection', 'Pest Control Inspection', 'WDI Inspection',
      'Wood Destroying Pest Inspection', 'Dry Rot Inspection'
    ],
    foundationStructural: [
      'Foundation Inspection', 'Structural Inspection', 'Seismic Inspection',
      'Earthquake Inspection', 'Foundation Repair Assessment'
    ],
    specialtyTesting: [
      'Mold Testing', 'Radon Testing', 'Asbestos Testing', 'Lead Paint Testing',
      'Air Quality Testing', 'Water Quality Testing', 'Pool Inspection',
      'HVAC Inspection', 'Chimney Inspection'
    ],
    commercialBuilding: [
      'Commercial Building Inspection', 'Multi-family Inspection',
      'Office Building Inspection', 'Retail Space Inspection',
      'Industrial Inspection', 'Commercial Property Inspection'
    ]
  };
  
  const lowerText = text.toLowerCase();
  
  if (categoryServices[category]) {
    categoryServices[category].forEach(service => {
      if (lowerText.includes(service.toLowerCase())) {
        services.push(service);
      }
    });
  }
  
  return services.length > 0 ? services : ['Inspection Services'];
}

function generateUniqueKey(inspector) {
  const phone = inspector.phone?.replace(/[^\d]/g, '') || '';
  const name = inspector.business_name?.toLowerCase().replace(/[^\w]/g, '') || '';
  const placeId = inspector.google_place_id || '';
  
  if (placeId) return `place_${placeId}`;
  if (phone.length >= 10) return `phone_${phone}`;
  return `name_${name}_paloalto_ca`;
}

function isDuplicate(inspector) {
  const key = generateUniqueKey(inspector);
  return duplicateTracker.has(key);
}

function addInspector(inspector, category) {
  const key = generateUniqueKey(inspector);
  duplicateTracker.add(key);
  inspectorData.push(inspector);
  stats.totalCollected++;
  
  // Track by category
  if (!stats.categoryBreakdown[category]) {
    stats.categoryBreakdown[category] = 0;
  }
  stats.categoryBreakdown[category]++;
}

// Google Places API functions
async function searchPlaces(query) {
  try {
    stats.apiCalls++;
    
    const response = await axios.get(`${PLACES_API_BASE_URL}/textsearch/json`, {
      params: {
        query: query,
        key: GOOGLE_MAPS_API_KEY,
        type: 'establishment',
        location: `${TARGET_LOCATION.coordinates.lat},${TARGET_LOCATION.coordinates.lng}`,
        radius: 25000 // 25km radius around Palo Alto
      },
      timeout: 15000
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
    log(`Search error for "${query}": ${error.message}`, 'ERROR');
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
        fields: 'name,formatted_address,formatted_phone_number,website,geometry,business_status,rating,user_ratings_total,types,reviews'
      },
      timeout: 15000
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Details API Status: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    log(`Details error for place ${placeId}: ${error.message}`, 'ERROR');
    stats.errors++;
    return null;
  }
}

async function processPlace(place, category) {
  try {
    // Get detailed information
    const details = await getPlaceDetails(place.place_id);
    if (!details) return null;

    // Extract address components
    const address = details.formatted_address || '';
    const addressParts = address.split(',').map(p => p.trim());
    
    let street = '';
    let city = TARGET_LOCATION.city;
    let state = TARGET_LOCATION.state;
    let zipCode = '';
    
    if (addressParts.length > 0) {
      street = addressParts[0];
      
      // Try to extract city and state from address
      for (let i = 1; i < addressParts.length - 1; i++) {
        const part = addressParts[i];
        if (part.toLowerCase().includes('palo alto')) {
          city = 'Palo Alto';
        } else if (part.match(/^[A-Z]{2}$/)) {
          state = part;
        }
      }
      
      // Extract ZIP code
      const lastPart = addressParts[addressParts.length - 1];
      const zipMatch = lastPart.match(/\b\d{5}(-\d{4})?\b/);
      if (zipMatch) zipCode = zipMatch[0];
    }

    // Create enhanced inspector record
    const inspector = {
      business_name: details.name || place.name,
      owner_name: null, // Will be enhanced later
      email: null, // Will be enhanced later
      phone: cleanPhone(details.formatted_phone_number),
      website: cleanWebsite(details.website),
      address_street: street,
      address_city: city,
      address_state: state,
      address_zip: zipCode,
      lat: details.geometry?.location?.lat || place.geometry?.location?.lat,
      lng: details.geometry?.location?.lng || place.geometry?.location?.lng,
      certifications: extractCertifications(details.name + ' ' + (details.reviews?.map(r => r.text).join(' ') || ''), category),
      services: extractServices(details.name + ' ' + (details.reviews?.map(r => r.text).join(' ') || ''), category),
      years_in_business: null, // Will be enhanced later
      insurance_verified: false,
      license_number: null,
      google_place_id: place.place_id,
      google_rating: details.rating,
      google_reviews_count: details.user_ratings_total,
      business_status: details.business_status || 'OPERATIONAL',
      inspector_category: INSPECTION_CATEGORIES[category].name,
      data_source: 'Google Maps Places API',
      collected_at: new Date().toISOString(),
      location_verified: city.toLowerCase().includes('palo alto') || 
                        address.toLowerCase().includes('palo alto') ||
                        address.toLowerCase().includes('menlo park') ||
                        address.toLowerCase().includes('mountain view')
    };

    return inspector;
  } catch (error) {
    log(`Error processing place ${place.place_id}: ${error.message}`, 'ERROR');
    stats.errors++;
    return null;
  }
}

async function harvestCategory(categoryKey, categoryData) {
  log(`🎯 Phase ${stats.categoriesProcessed + 1}: ${categoryData.name}`);
  log(`Target: ${categoryData.targetCount} results`);
  
  let categoryCount = 0;
  
  for (const query of categoryData.queries) {
    try {
      log(`  Executing: "${query}"`);
      stats.queriesExecuted++;
      
      const places = await searchPlaces(query);
      log(`  Found ${places.length} places`);
      
      for (const place of places) {
        const inspector = await processPlace(place, categoryKey);
        
        if (inspector && !isDuplicate(inspector)) {
          addInspector(inspector, categoryKey);
          categoryCount++;
          log(`  ✅ Added: ${inspector.business_name} | Category: ${inspector.inspector_category}`);
          
          // Check if we've reached category target
          if (categoryCount >= categoryData.targetCount) {
            log(`  🎯 Category target of ${categoryData.targetCount} reached!`);
            break;
          }
        } else if (inspector) {
          stats.duplicatesSkipped++;
          log(`  ⏭️  Skipped duplicate: ${inspector.business_name}`);
        }
        
        // Rate limiting
        await sleep(200);
      }
      
      // Rate limiting between queries
      await sleep(1000);
      
      // Check if category target reached
      if (categoryCount >= categoryData.targetCount) {
        break;
      }
      
    } catch (error) {
      log(`Error with query "${query}": ${error.message}`, 'ERROR');
      stats.errors++;
    }
  }
  
  stats.categoriesProcessed++;
  log(`✅ Completed ${categoryData.name}. Collected ${categoryCount} inspectors`);
  log('');
  
  return categoryCount;
}

async function saveResults() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataFile = path.join(logDir, `palo-alto-comprehensive-${timestamp}.json`);
    const csvFile = path.join(logDir, `palo-alto-comprehensive-${timestamp}.csv`);
    
    // Calculate data quality metrics
    const withPhones = inspectorData.filter(i => i.phone).length;
    const withWebsites = inspectorData.filter(i => i.website).length;
    const withCoordinates = inspectorData.filter(i => i.lat && i.lng).length;
    const locationVerified = inspectorData.filter(i => i.location_verified).length;
    
    // Save comprehensive JSON
    const dataToSave = {
      metadata: {
        location: TARGET_LOCATION,
        collected_at: new Date().toISOString(),
        total_inspectors: stats.totalCollected,
        categories_processed: stats.categoriesProcessed,
        queries_executed: stats.queriesExecuted,
        api_calls: stats.apiCalls,
        duplicates_skipped: stats.duplicatesSkipped,
        errors: stats.errors,
        duration_minutes: (Date.now() - stats.startTime) / 60000,
        category_breakdown: stats.categoryBreakdown,
        data_quality: {
          phone_numbers: withPhones,
          websites: withWebsites,
          coordinates: withCoordinates,
          location_verified: locationVerified,
          phone_percentage: ((withPhones / stats.totalCollected) * 100).toFixed(1),
          website_percentage: ((withWebsites / stats.totalCollected) * 100).toFixed(1),
          coordinate_percentage: ((withCoordinates / stats.totalCollected) * 100).toFixed(1),
          location_verified_percentage: ((locationVerified / stats.totalCollected) * 100).toFixed(1)
        }
      },
      inspectors: inspectorData
    };
    
    await fs.writeJson(dataFile, dataToSave, { spaces: 2 });
    log(`📄 Data saved to: ${dataFile}`);
    
    // Save CSV for easy analysis
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
      
      await fs.writeFile(csvFile, csvRows.join('\n'));
      log(`📊 CSV saved to: ${csvFile}`);
    }
    
    return { dataFile, csvFile };
  } catch (error) {
    log(`Error saving results: ${error.message}`, 'ERROR');
    return null;
  }
}

async function generateComprehensiveReport() {
  const duration = (Date.now() - stats.startTime) / 60000;
  const rate = stats.totalCollected / duration;
  
  log('');
  log('🎉 PALO ALTO COMPREHENSIVE BUILDOUT COMPLETE!');
  log('==============================================');
  log(`Location: ${TARGET_LOCATION.city}, ${TARGET_LOCATION.state}`);
  log(`Total Inspectors Collected: ${stats.totalCollected}`);
  log(`Categories Processed: ${stats.categoriesProcessed}/5`);
  log(`Queries Executed: ${stats.queriesExecuted}`);
  log(`API Calls Made: ${stats.apiCalls}`);
  log(`Duplicates Skipped: ${stats.duplicatesSkipped}`);
  log(`Errors Encountered: ${stats.errors}`);
  log(`Duration: ${duration.toFixed(1)} minutes`);
  log(`Collection Rate: ${rate.toFixed(1)} inspectors/minute`);
  log('');
  
  // Category breakdown
  log('📊 CATEGORY BREAKDOWN:');
  Object.entries(stats.categoryBreakdown).forEach(([category, count]) => {
    const categoryName = INSPECTION_CATEGORIES[category]?.name || category;
    const target = INSPECTION_CATEGORIES[category]?.targetCount || 0;
    const percentage = target > 0 ? ((count / target) * 100).toFixed(1) : 'N/A';
    log(`   ${categoryName}: ${count}/${target} (${percentage}%)`);
  });
  log('');
  
  // Data quality metrics
  const withPhones = inspectorData.filter(i => i.phone).length;
  const withWebsites = inspectorData.filter(i => i.website).length;
  const withCoordinates = inspectorData.filter(i => i.lat && i.lng).length;
  const locationVerified = inspectorData.filter(i => i.location_verified).length;
  
  log('📈 DATA QUALITY METRICS:');
  log(`   Phone Numbers: ${withPhones}/${stats.totalCollected} (${((withPhones/stats.totalCollected)*100).toFixed(1)}%)`);
  log(`   Websites: ${withWebsites}/${stats.totalCollected} (${((withWebsites/stats.totalCollected)*100).toFixed(1)}%)`);
  log(`   Coordinates: ${withCoordinates}/${stats.totalCollected} (${((withCoordinates/stats.totalCollected)*100).toFixed(1)}%)`);
  log(`   Location Verified: ${locationVerified}/${stats.totalCollected} (${((locationVerified/stats.totalCollected)*100).toFixed(1)}%)`);
  log('');
  
  // Success assessment
  const totalTargeted = Object.values(INSPECTION_CATEGORIES).reduce((sum, cat) => sum + cat.targetCount, 0);
  const completionRate = ((stats.totalCollected / totalTargeted) * 100).toFixed(1);
  
  log('🎯 MISSION ASSESSMENT:');
  log(`   Overall Target: ${totalTargeted} inspectors`);
  log(`   Actual Collected: ${stats.totalCollected} inspectors`);
  log(`   Completion Rate: ${completionRate}%`);
  log('');
  
  if (stats.totalCollected >= totalTargeted * 0.8) {
    log('🚀 SUCCESS: Comprehensive Palo Alto buildout achieved!');
    log('💡 NEXT STEPS:');
    log('   1. Data enrichment: Extract emails from websites');
    log('   2. Verification: Validate phone numbers and addresses');
    log('   3. Database import: Load into Supabase for website');
    log('   4. SEO optimization: Generate category-specific pages');
    log('   5. Outreach: Begin targeted marketing campaigns');
  } else {
    log('⚠️  Target not fully reached. Consider:');
    log('   1. Expanding search radius beyond Palo Alto');
    log('   2. Adding more search term variations');
    log('   3. Manual verification of incomplete categories');
  }
  
  log('');
  log('🔥 PALO ALTO INSPECTOR DATABASE READY FOR DEPLOYMENT!');
}

async function main() {
  console.log('🚀 PALO ALTO COMPREHENSIVE INSPECTOR BUILDOUT');
  console.log('==============================================');
  console.log('MISSION: Complete inspector collection across ALL types');
  console.log('');
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('❌ Google Maps API key not found!');
    console.log('Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY in your environment');
    process.exit(1);
  }
  
  await setupLogging();
  
  log(`🎯 Target Location: ${TARGET_LOCATION.city}, ${TARGET_LOCATION.state}`);
  log(`🔑 API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
  log(`📋 Categories to process: ${Object.keys(INSPECTION_CATEGORIES).length}`);
  log('');
  
  // Execute all phases systematically
  for (const [categoryKey, categoryData] of Object.entries(INSPECTION_CATEGORIES)) {
    try {
      await harvestCategory(categoryKey, categoryData);
      
      // Progress update
      const elapsed = (Date.now() - stats.startTime) / 60000;
      const rate = stats.totalCollected / elapsed;
      log(`📈 Overall Progress: ${stats.totalCollected} inspectors | ${stats.categoriesProcessed}/${Object.keys(INSPECTION_CATEGORIES).length} categories | Rate: ${rate.toFixed(1)}/min`);
      log('');
      
      // Rate limiting between categories
      await sleep(3000);
      
    } catch (error) {
      log(`❌ Error processing category ${categoryData.name}: ${error.message}`, 'ERROR');
      stats.errors++;
    }
  }
  
  // Save comprehensive results
  const files = await saveResults();
  
  // Generate final comprehensive report
  await generateComprehensiveReport();
  
  if (files) {
    log('📁 FILES GENERATED:');
    log(`   JSON: ${files.dataFile}`);
    log(`   CSV: ${files.csvFile}`);
    log(`   Log: ${logFile}`);
  }
  
  log('');
  log('✅ PALO ALTO COMPREHENSIVE BUILDOUT COMPLETED!');
  log('Ready for data enrichment and production deployment.');
}

// Execute the comprehensive buildout
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, stats, inspectorData };