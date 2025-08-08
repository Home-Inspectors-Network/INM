#!/usr/bin/env node

/**
 * Bay Area Inspector Quick Demo
 * 
 * Demonstrates the collection process for San Francisco inspectors
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Simple demo with just one search term
const DEMO_SEARCH_TERMS = [
  'home inspector',
  'property inspector'
];

let stats = {
  totalCollected: 0,
  apiCalls: 0,
  startTime: Date.now()
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

async function searchPlaces(query, location) {
  try {
    stats.apiCalls++;
    
    const response = await axios.get(`${PLACES_API_BASE_URL}/textsearch/json`, {
      params: {
        query: `${query} in ${location}`,
        key: GOOGLE_MAPS_API_KEY,
        type: 'establishment'
      }
    });

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
        fields: 'name,formatted_address,formatted_phone_number,website,geometry,business_status,rating,user_ratings_total'
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
  const name = inspector.business_name?.toLowerCase().replace(/[^\w]/g, '') || '';
  
  if (phone.length >= 10) return `phone_${phone}`;
  return `name_${name}_${inspector.address_city?.toLowerCase()}`;
}

function isDuplicate(inspector) {
  const key = generateKey(inspector);
  return collectedInspectors.has(key);
}

function addInspector(inspector) {
  const key = generateKey(inspector);
  collectedInspectors.set(key, inspector);
}

async function processPlace(place, city, state) {
  const details = await getPlaceDetails(place.place_id);
  if (!details) return null;

  const name = details.name || place.name || '';
  
  // Filter for inspectors
  const inspectorKeywords = ['inspect', 'home', 'property', 'residential'];
  const hasInspectorKeyword = inspectorKeywords.some(keyword => 
    name.toLowerCase().includes(keyword)
  );
  
  if (!hasInspectorKeyword) return null;

  // Parse address
  const address = details.formatted_address || '';
  const addressParts = address.split(',').map(part => part.trim());
  const street = addressParts[0] || '';
  const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
  const zipCode = zipMatch ? zipMatch[0] : '';

  const inspector = {
    business_name: name,
    phone: cleanPhone(details.formatted_phone_number),
    website: cleanWebsite(details.website),
    address_street: street,
    address_city: city,
    address_state: state,
    address_zip: zipCode,
    lat: details.geometry?.location?.lat,
    lng: details.geometry?.location?.lng,
    google_rating: details.rating,
    google_reviews_count: details.user_ratings_total,
    google_place_id: place.place_id,
    collected_at: new Date().toISOString()
  };

  return inspector;
}

async function runDemo() {
  log('🚀 Bay Area Inspector Demo Starting');
  log('===================================');
  
  if (!GOOGLE_MAPS_API_KEY) {
    log('❌ Google Maps API key not configured');
    return;
  }

  const city = 'San Francisco';
  const state = 'CA';
  
  log(`🎯 Collecting inspectors from ${city}, ${state}`);

  // Process first search term only for demo
  for (const searchTerm of DEMO_SEARCH_TERMS.slice(0, 1)) {
    log(`  Searching for "${searchTerm}" in ${city}, ${state}`);
    
    const places = await searchPlaces(searchTerm, `${city}, ${state}`);
    log(`  Found ${places.length} potential matches`);
    
    let processed = 0;
    for (const place of places.slice(0, 5)) { // Process only first 5 for demo
      const inspector = await processPlace(place, city, state);
      
      if (inspector && !isDuplicate(inspector)) {
        addInspector(inspector);
        stats.totalCollected++;
        log(`  ✅ ${stats.totalCollected}: ${inspector.business_name}`);
        
        // Show inspector details
        if (inspector.phone) log(`     📞 ${inspector.phone}`);
        if (inspector.website) log(`     🌐 ${inspector.website}`);
        if (inspector.google_rating) log(`     ⭐ ${inspector.google_rating}/5 (${inspector.google_reviews_count} reviews)`);
        log('');
      }
      
      processed++;
      await sleep(1000); // Rate limiting
      
      if (processed >= 5) break; // Limit for demo
    }
  }

  // Results summary
  const duration = (Date.now() - stats.startTime) / 1000;
  log('🎉 Demo Complete!');
  log('=================');
  log(`Total collected: ${stats.totalCollected} inspectors`);
  log(`API calls made: ${stats.apiCalls}`);
  log(`Duration: ${duration.toFixed(1)} seconds`);
  
  // Save sample results
  const sampleData = {
    demo_metadata: {
      collected_at: new Date().toISOString(),
      total_inspectors: stats.totalCollected,
      api_calls: stats.apiCalls,
      duration_seconds: duration,
      city: city,
      state: state
    },
    sample_inspectors: Array.from(collectedInspectors.values())
  };
  
  const sampleFile = path.join(__dirname, '..', 'logs', 'bay-area-demo-sample.json');
  await fs.writeJson(sampleFile, sampleData, { spaces: 2 });
  log(`📄 Sample data saved to: ${sampleFile}`);
  
  log('\n💡 This demonstrates the data collection capability.');
  log('   The full harvester would collect 60+ inspectors across all Bay Area cities.');
  log('   Each inspector includes: business name, contact info, location, ratings, etc.');
}

if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };