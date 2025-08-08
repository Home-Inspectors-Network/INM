#!/usr/bin/env node

/**
 * Add Golden Gate Home Inspections as a test case for enrichment
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestInspector() {
  console.log('Adding Golden Gate Home Inspections as test case...');

  // Golden Gate Home Inspections appears to be a real Bay Area company
  const testInspector = {
    business_name: 'Golden Gate Home Inspections',
    owner_name: 'Professional Inspector',
    email: 'info@goldengatehi.com',
    phone: '(415) 555-0123',
    website: 'https://www.goldengatehi.com', // This is a placeholder - we'll use a real site for testing
    address: '123 Main Street, San Francisco, CA 94102',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
    services: ['Home Inspection'],
    certifications: ['ASHI', 'InterNACHI'],
    years_in_business: 15,
    description: 'Comprehensive home inspection services throughout the San Francisco Bay Area',
    is_premium: false,
    rating: 4.8,
    review_count: 142,
    enrichment_status: 'pending'
  };

  try {
    // Check if already exists
    const { data: existing } = await supabase
      .from('inspectors')
      .select('id')
      .eq('business_name', testInspector.business_name)
      .single();

    if (existing) {
      console.log('Golden Gate Home Inspections already exists in database');
      
      // Update with website for testing
      const { error } = await supabase
        .from('inspectors')
        .update({ 
          website: 'https://housemaster.com', // Using a real home inspection website for testing
          enrichment_status: 'pending'
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating inspector:', error);
      } else {
        console.log('✅ Updated existing inspector with test website');
      }
      
      return existing.id;
    }

    // Create new test inspector
    testInspector.website = 'https://housemaster.com'; // Real site for testing
    
    const { data: newInspector, error } = await supabase
      .from('inspectors')
      .insert([testInspector])
      .select()
      .single();

    if (error) {
      console.error('Error creating test inspector:', error);
      return null;
    }

    console.log('✅ Created test inspector:', newInspector.business_name);
    return newInspector.id;

  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Also update existing inspectors with sample websites for testing
async function addWebsitesToExistingInspectors() {
  console.log('\nAdding sample websites to existing inspectors for testing...');

  // Sample real home inspection websites for testing
  const testWebsites = [
    'https://housemaster.com',
    'https://pillartopost.com',
    'https://hometeam.com',
    'https://nationwidepi.com',
    'https://amerispec.com'
  ];

  try {
    // Get inspectors without websites
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('id, business_name')
      .or('website.is.null,website.eq.')
      .limit(5);

    if (error) {
      console.error('Error fetching inspectors:', error);
      return;
    }

    for (let i = 0; i < inspectors.length && i < testWebsites.length; i++) {
      const inspector = inspectors[i];
      const website = testWebsites[i];

      const { error: updateError } = await supabase
        .from('inspectors')
        .update({ 
          website: website,
          enrichment_status: 'pending'
        })
        .eq('id', inspector.id);

      if (updateError) {
        console.error(`Error updating ${inspector.business_name}:`, updateError);
      } else {
        console.log(`✅ Added website ${website} to ${inspector.business_name}`);
      }
    }

  } catch (error) {
    console.error('Error updating inspectors:', error);
  }
}

// Run the script
if (require.main === module) {
  Promise.all([
    addTestInspector(),
    addWebsitesToExistingInspectors()
  ])
    .then(() => {
      console.log('\n✨ Test setup complete! Ready for enrichment testing.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}