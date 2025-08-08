#!/usr/bin/env node

/**
 * Oakland Inspector Search - Phase 2
 * 
 * Focused collection of Oakland, CA home inspectors
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Oakland-specific search terms
const OAKLAND_SEARCH_TERMS = [
  'home inspector Oakland CA',
  'property inspector Oakland California',
  'house inspector Oakland',
  'residential inspector Oakland CA',
  'certified home inspector Oakland',
  'licensed home inspector Oakland'
];

let stats = {
  totalCollected: 0,
  apiCalls: 0,
  startTime: Date.now(),
  duplicatesSkipped: 0
};

const collectedInspectors = new Map();

function log(message) {
  console.log(`${new Date().toISOString()}: ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function searchPlaces(query) {
  try {
    stats.apiCalls++;
    
    const response = await axios.get(`${PLACES_API_BASE_URL}/textsearch/json`, {
      params: {
        query: query,
        key: GOOGLE_MAPS_API_KEY,
        type: 'establishment',
        location: '37.8044,-122.2712', // Oakland coordinates
        radius: 25000 // 25km radius
      }
    });

    if (response.data.status === 'OVER_QUERY_LIMIT') {
      log('⚠️  API quota exceeded - pausing');
      await sleep(60000);
      return [];
    }

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.results || [];
  } catch (error) {
    log(`Error searching places: ${error.message}`);
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
    return null;
  }
}

function generateKey(inspector) {
  const phone = inspector.phone?.replace(/[^\d]/g, '') || '';
  const email = inspector.email?.toLowerCase() || '';
  const name = inspector.business_name?.toLowerCase().replace(/[^\w]/g, '') || '';
  
  if (phone.length >= 10) return `phone_${phone}`;
  if (email) return `email_${email}`;
  return `name_${name}_oakland_ca`;
}

function isDuplicate(inspector) {
  const key = generateKey(inspector);
  return collectedInspectors.has(key);
}

function addInspector(inspector) {
  const key = generateKey(inspector);
  collectedInspectors.set(key, inspector);
}

async function processPlace(place) {
  try {
    const details = await getPlaceDetails(place.place_id);
    if (!details) return null;

    const name = details.name || place.name || '';
    
    // Enhanced filtering for Oakland inspectors
    const inspectorKeywords = ['inspect', 'home', 'property', 'residential', 'building'];
    const hasInspectorKeyword = inspectorKeywords.some(keyword => 
      name.toLowerCase().includes(keyword)
    );
    
    // Skip non-inspectors
    const excludeKeywords = ['restaurant', 'hotel', 'store', 'shop', 'bank', 'gas', 'medical', 'auto'];
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
    let city = 'Oakland';
    let state = 'CA';
    let zipCode = '';
    
    if (addressParts.length > 0) {
      street = addressParts[0];
      if (addressParts.length > 1) {
        const cityState = addressParts[addressParts.length - 2] || '';
        if (cityState.includes('Oakland')) city = 'Oakland';
      }
      const lastPart = addressParts[addressParts.length - 1];
      const zipMatch = lastPart.match(/\b\d{5}(-\d{4})?\b/);
      if (zipMatch) {
        zipCode = zipMatch[0];
      }
    }

    // Extract coordinates
    const lat = details.geometry?.location?.lat || place.geometry?.location?.lat;
    const lng = details.geometry?.location?.lng || place.geometry?.location?.lng;

    // Extract certifications from name and reviews
    let certifications = extractCertifications(name);
    if (details.reviews) {
      const reviewText = details.reviews.map(r => r.text).join(' ');
      certifications = [...new Set([...certifications, ...extractCertifications(reviewText)])];
    }

    const inspector = {
      business_name: name,
      owner_name: null,
      email: null,
      phone: cleanPhone(details.formatted_phone_number),
      website: cleanWebsite(details.website),
      address_street: street,
      address_city: city,
      address_state: state,
      address_zip: zipCode,
      lat: lat,
      lng: lng,
      certifications: certifications.length > 0 ? certifications : ['Home Inspector'],
      services: ['Home Inspection', 'Property Inspection'],
      google_place_id: place.place_id,
      google_rating: details.rating,
      google_reviews_count: details.user_ratings_total,
      business_status: details.business_status || 'OPERATIONAL',
      data_source: 'Google Maps Places API - Oakland Search',
      collected_at: new Date().toISOString(),
      search_phase: 'Phase 2 - Oakland'
    };

    return inspector;
  } catch (error) {
    log(`Error processing place: ${error.message}`);
    return null;
  }
}

async function runOaklandSearch() {
  log('🚀 Oakland Inspector Search - Phase 2');
  log('====================================');
  log(`Target: 20+ Oakland inspector listings`);
  log(`API Key: ${GOOGLE_MAPS_API_KEY ? 'Configured' : 'MISSING'}`);
  log('');

  if (!GOOGLE_MAPS_API_KEY) {
    log('❌ Google Maps API key not configured');
    return false;
  }

  for (const searchTerm of OAKLAND_SEARCH_TERMS) {
    try {
      log(`🔍 Searching: "${searchTerm}"`);
      
      const places = await searchPlaces(searchTerm);
      log(`  Found ${places.length} potential matches`);
      
      for (const place of places) {
        const inspector = await processPlace(place);
        
        if (inspector && !isDuplicate(inspector)) {
          addInspector(inspector);
          stats.totalCollected++;
          
          log(`  ✅ ${stats.totalCollected}: ${inspector.business_name}`);
          if (inspector.phone) log(`     📞 ${inspector.phone}`);
          if (inspector.website) log(`     🌐 ${inspector.website}`);
          if (inspector.google_rating) log(`     ⭐ ${inspector.google_rating}/5 (${inspector.google_reviews_count} reviews)`);
          
        } else if (inspector) {
          stats.duplicatesSkipped++;
          log(`  ⏭️  Skipped duplicate: ${inspector.business_name}`);
        }
        
        await sleep(500); // Rate limiting
        
        // Stop at 25 for Phase 2
        if (stats.totalCollected >= 25) {
          log('🎯 Phase 2 target reached!');
          break;
        }
      }
      
      await sleep(2000); // Rate limiting between searches
      
      if (stats.totalCollected >= 25) break;
      
    } catch (error) {
      log(`Error processing search "${searchTerm}": ${error.message}`);
    }
  }

  // Save results
  const duration = (Date.now() - stats.startTime) / 1000;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const oaklandData = {
    metadata: {
      phase: 'Phase 2 - Oakland',
      collected_at: new Date().toISOString(),
      total_inspectors: stats.totalCollected,
      duplicates_skipped: stats.duplicatesSkipped,
      api_calls: stats.apiCalls,
      duration_seconds: duration,
      city: 'Oakland',
      state: 'CA',
      search_terms: OAKLAND_SEARCH_TERMS
    },
    inspectors: Array.from(collectedInspectors.values())
  };
  
  const dataFile = path.join(__dirname, '..', 'logs', `oakland-inspectors-phase2-${timestamp}.json`);
  await fs.writeJson(dataFile, oaklandData, { spaces: 2 });
  
  // Results summary
  log('');
  log('🎉 Oakland Search Phase 2 Complete!');
  log('===================================');
  log(`Total collected: ${stats.totalCollected} Oakland inspectors`);
  log(`Duplicates skipped: ${stats.duplicatesSkipped}`);
  log(`API calls made: ${stats.apiCalls}`);
  log(`Duration: ${duration.toFixed(1)} seconds`);
  log(`Collection rate: ${(stats.totalCollected / (duration / 60)).toFixed(1)} inspectors/minute`);
  
  // Data quality metrics
  const inspectorsArray = Array.from(collectedInspectors.values());
  const withPhones = inspectorsArray.filter(i => i.phone).length;
  const withWebsites = inspectorsArray.filter(i => i.website).length;
  const withCoordinates = inspectorsArray.filter(i => i.lat && i.lng).length;
  
  log('');
  log('📊 Oakland Data Quality:');
  log(`Phone Numbers: ${withPhones}/${stats.totalCollected} (${(withPhones/stats.totalCollected*100).toFixed(1)}%)`);
  log(`Websites: ${withWebsites}/${stats.totalCollected} (${(withWebsites/stats.totalCollected*100).toFixed(1)}%)`);
  log(`Coordinates: ${withCoordinates}/${stats.totalCollected} (${(withCoordinates/stats.totalCollected*100).toFixed(1)}%)`);
  
  log('');
  log(`📄 Oakland data saved to: ${dataFile}`);
  
  log('');
  log('🎯 PHASE 2 COMPLETE: Moving to Phase 3 (San Jose)');
  log('💡 Next steps:');
  log('   1. Execute Phase 3 - San Jose inspector search');
  log('   2. Combine all Bay Area data for database import');
  log('   3. Begin data quality verification');
  
  // Show sample Oakland inspectors
  log('');
  log('📋 Sample Oakland Inspectors Found:');
  inspectorsArray.slice(0, 5).forEach((inspector, index) => {
    log(`${index + 1}. ${inspector.business_name}`);
    if (inspector.phone) log(`   Phone: ${inspector.phone}`);
    if (inspector.website) log(`   Website: ${inspector.website}`);
    if (inspector.certifications.length > 0) log(`   Certifications: ${inspector.certifications.join(', ')}`);
    log('');
  });
  
  return true;
}

// Export for module use
module.exports = { runOaklandSearch, stats };

// Run if called directly
if (require.main === module) {
  runOaklandSearch().catch(error => {
    log(`💥 Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}