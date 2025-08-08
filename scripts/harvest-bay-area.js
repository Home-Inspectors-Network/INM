#!/usr/bin/env node

/**
 * Bay Area Inspector Data Harvester
 * Focuses on San Francisco Bay Area cities for targeted data collection
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Bay Area cities ordered by priority (population/market size)
const BAY_AREA_CITIES = [
  // Core Cities
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { city: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712 },
  
  // Peninsula
  { city: 'Palo Alto', state: 'CA', lat: 37.4419, lng: -122.1430 },
  { city: 'Mountain View', state: 'CA', lat: 37.3861, lng: -122.0839 },
  { city: 'Redwood City', state: 'CA', lat: 37.4852, lng: -122.2364 },
  { city: 'San Mateo', state: 'CA', lat: 37.5630, lng: -122.3255 },
  { city: 'Burlingame', state: 'CA', lat: 37.5841, lng: -122.3661 },
  { city: 'Menlo Park', state: 'CA', lat: 37.4529, lng: -122.1817 },
  
  // East Bay
  { city: 'Fremont', state: 'CA', lat: 37.5483, lng: -121.9886 },
  { city: 'Berkeley', state: 'CA', lat: 37.8715, lng: -122.2730 },
  { city: 'Richmond', state: 'CA', lat: 37.9358, lng: -122.3477 },
  { city: 'Hayward', state: 'CA', lat: 37.6688, lng: -122.0808 },
  { city: 'Concord', state: 'CA', lat: 37.9780, lng: -122.0311 },
  { city: 'Walnut Creek', state: 'CA', lat: 37.9101, lng: -122.0652 },
  { city: 'San Leandro', state: 'CA', lat: 37.7249, lng: -122.1561 },
  { city: 'Pleasanton', state: 'CA', lat: 37.6624, lng: -121.8747 },
  { city: 'Livermore', state: 'CA', lat: 37.6819, lng: -121.7680 },
  
  // North Bay
  { city: 'Santa Rosa', state: 'CA', lat: 38.4404, lng: -122.7141 },
  { city: 'San Rafael', state: 'CA', lat: 37.9735, lng: -122.5311 },
  { city: 'Novato', state: 'CA', lat: 38.1074, lng: -122.5697 },
  { city: 'Petaluma', state: 'CA', lat: 38.2324, lng: -122.6367 },
  { city: 'Napa', state: 'CA', lat: 38.2975, lng: -122.2869 },
  
  // South Bay
  { city: 'Sunnyvale', state: 'CA', lat: 37.3688, lng: -122.0363 },
  { city: 'Santa Clara', state: 'CA', lat: 37.3541, lng: -121.9552 },
  { city: 'Cupertino', state: 'CA', lat: 37.3230, lng: -122.0322 },
  { city: 'Milpitas', state: 'CA', lat: 37.4323, lng: -121.8996 },
  { city: 'Campbell', state: 'CA', lat: 37.2872, lng: -121.9500 },
  { city: 'Los Gatos', state: 'CA', lat: 37.2358, lng: -121.9624 },
  { city: 'Saratoga', state: 'CA', lat: 37.2639, lng: -122.0230 }
];

// Helper function to delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extract detailed business information from place data
function extractBusinessInfo(place, city, state) {
  return {
    business_name: place.name,
    address: place.formatted_address || place.vicinity,
    city: city,
    state: state,
    google_place_id: place.place_id,
    rating: place.rating || null,
    review_count: place.user_ratings_total || 0,
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
    phone: place.formatted_phone_number || null,
    website: place.website || null,
    services: ['Home Inspection'], // Default, will be enhanced with details API
    certifications: [],
    is_premium: false
  };
}

// Search for inspectors in a specific city
async function searchInspectorsInCity(cityData) {
  const { city, state, lat, lng } = cityData;
  console.log(`\n🔍 Searching for inspectors in ${city}, ${state}...`);
  
  const results = [];
  
  try {
    // 1. Text Search for targeted results
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=home+inspector+${city}+${state}&` +
      `location=${lat},${lng}&` +
      `radius=20000&` +
      `key=${GOOGLE_MAPS_API_KEY}`;
    
    const textResponse = await fetch(textSearchUrl);
    const textData = await textResponse.json();
    
    if (textData.status === 'OK' && textData.results) {
      console.log(`  ✓ Found ${textData.results.length} results via text search`);
      for (const place of textData.results) {
        const businessInfo = extractBusinessInfo(place, city, state);
        results.push(businessInfo);
      }
    }
    
    await delay(1000); // Rate limiting
    
    // 2. Nearby Search for comprehensive coverage
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lng}&` +
      `radius=20000&` +
      `keyword=home+inspector&` +
      `type=establishment&` +
      `key=${GOOGLE_MAPS_API_KEY}`;
    
    const nearbyResponse = await fetch(nearbyUrl);
    const nearbyData = await nearbyResponse.json();
    
    if (nearbyData.status === 'OK' && nearbyData.results) {
      console.log(`  ✓ Found ${nearbyData.results.length} additional results via nearby search`);
      for (const place of nearbyData.results) {
        // Check if we already have this place_id
        if (!results.some(r => r.google_place_id === place.place_id)) {
          const businessInfo = extractBusinessInfo(place, city, state);
          results.push(businessInfo);
        }
      }
    }
    
    console.log(`  📊 Total unique inspectors found in ${city}: ${results.length}`);
    
  } catch (error) {
    console.error(`  ❌ Error searching in ${city}:`, error.message);
  }
  
  return results;
}

// Get additional details for a place
async function getPlaceDetails(placeId) {
  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `fields=name,formatted_phone_number,website,opening_hours,types&` +
      `key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.result) {
      return data.result;
    }
  } catch (error) {
    console.error('Error fetching place details:', error.message);
  }
  return null;
}

// Save inspectors to database
async function saveToDatabase(inspectors) {
  if (inspectors.length === 0) return { saved: 0, errors: 0 };
  
  let saved = 0;
  let errors = 0;
  
  for (const inspector of inspectors) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('inspectors')
        .select('id')
        .eq('google_place_id', inspector.google_place_id)
        .single();
      
      if (!existing) {
        const { error } = await supabase
          .from('inspectors')
          .insert([inspector]);
        
        if (error) {
          console.error('Insert error:', error);
          errors++;
        } else {
          saved++;
        }
      }
    } catch (err) {
      errors++;
    }
  }
  
  return { saved, errors };
}

// Main harvesting function
async function harvestBayArea() {
  console.log('🌉 Bay Area Inspector Harvester');
  console.log('================================');
  console.log(`📍 Targeting ${BAY_AREA_CITIES.length} Bay Area cities`);
  console.log(`🔑 Using Google Maps API key: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
  
  let totalInspectors = 0;
  let totalSaved = 0;
  let totalErrors = 0;
  
  // Process each city
  for (let i = 0; i < BAY_AREA_CITIES.length; i++) {
    const cityData = BAY_AREA_CITIES[i];
    console.log(`\n📍 Progress: ${i + 1}/${BAY_AREA_CITIES.length} cities`);
    
    // Search for inspectors
    const inspectors = await searchInspectorsInCity(cityData);
    totalInspectors += inspectors.length;
    
    // Save to database
    if (inspectors.length > 0) {
      const { saved, errors } = await saveToDatabase(inspectors);
      totalSaved += saved;
      totalErrors += errors;
      console.log(`  💾 Saved ${saved} new inspectors to database`);
    }
    
    // Rate limiting between cities
    await delay(2000);
  }
  
  // Final summary
  console.log('\n📊 Harvest Complete!');
  console.log('====================');
  console.log(`✅ Total inspectors found: ${totalInspectors}`);
  console.log(`💾 New inspectors saved: ${totalSaved}`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  console.log(`📍 Cities processed: ${BAY_AREA_CITIES.length}`);
  
  // Check current database count
  const { count } = await supabase
    .from('inspectors')
    .select('*', { count: 'exact', head: true })
    .eq('state', 'CA');
  
  console.log(`\n🏢 Total California inspectors in database: ${count}`);
}

// Run the harvester
if (require.main === module) {
  harvestBayArea()
    .then(() => {
      console.log('\n✨ Bay Area harvest complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { harvestBayArea };