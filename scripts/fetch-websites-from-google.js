#!/usr/bin/env node

/**
 * Fetch website URLs from Google Places API for inspectors
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function fetchWebsiteFromGooglePlaces(placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    
    if (response.data.status === 'OK' && response.data.result.website) {
      return response.data.result.website;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching place details for ${placeId}:`, error.message);
    return null;
  }
}

async function updateInspectorsWithWebsites() {
  console.log('🔍 Fetching websites from Google Places API...');
  
  try {
    // Get inspectors without websites but with Google Place IDs
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('id, business_name, google_place_id')
      .is('website', null)
      .not('google_place_id', 'is', null)
      .limit(10);

    if (error) {
      console.error('Error fetching inspectors:', error);
      return;
    }

    console.log(`Found ${inspectors.length} inspectors to process`);

    let updated = 0;
    for (const inspector of inspectors) {
      console.log(`\n📍 ${inspector.business_name}`);
      
      const website = await fetchWebsiteFromGooglePlaces(inspector.google_place_id);
      
      if (website) {
        console.log(`  ✅ Found website: ${website}`);
        
        // Update inspector with website
        const { error: updateError } = await supabase
          .from('inspectors')
          .update({ 
            website: website,
            enrichment_status: 'pending' // Mark for enrichment
          })
          .eq('id', inspector.id);

        if (updateError) {
          console.error(`  ❌ Error updating inspector: ${updateError.message}`);
        } else {
          updated++;
          console.log(`  ✅ Updated inspector with website`);
        }
      } else {
        console.log(`  ⚪ No website found`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n📊 Summary: Updated ${updated} inspectors with websites`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

if (require.main === module) {
  updateInspectorsWithWebsites()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateInspectorsWithWebsites };