require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyCnvvjiDnTmWwrO77EDNOwVPYmbL9yaVcg';
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// Logging
const logFile = path.join(__dirname, '..', 'logs', 'bay-area-seo-generation.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Bay Area specific configuration
const BAY_AREA_COUNTIES = [
  'Alameda County',
  'Contra Costa County',
  'Marin County',
  'Napa County',
  'San Francisco County',
  'San Mateo County',
  'Santa Clara County',
  'Solano County',
  'Sonoma County'
];

// Get location data from Google Maps
async function getLocationData(city, state) {
  try {
    const address = `${city}, ${state}`;
    const geocodeUrl = `${GOOGLE_GEOCODING_API_URL}?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await axios.get(geocodeUrl);
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      // Extract components
      const components = {};
      result.address_components.forEach(component => {
        if (component.types.includes('locality')) {
          components.city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          components.state = component.short_name;
          components.stateFullName = component.long_name;
        }
        if (component.types.includes('administrative_area_level_2')) {
          components.county = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          components.zipCode = component.long_name;
        }
      });
      
      return {
        coordinates: location,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        ...components
      };
    }
    
    return null;
  } catch (error) {
    log(`Error getting location data for ${city}, ${state}: ${error.message}`);
    return null;
  }
}

// Get nearby landmarks and points of interest
async function getNearbyPlaces(lat, lng, city) {
  try {
    const types = ['tourist_attraction', 'park', 'university'];
    const landmarks = [];
    
    for (const type of types) {
      const url = `${GOOGLE_PLACES_API_URL}/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);
      
      if (response.data.status === 'OK' && response.data.results) {
        const places = response.data.results
          .slice(0, 3)
          .map(place => place.name)
          .filter(name => !name.toLowerCase().includes('unnamed'));
        
        landmarks.push(...places);
      }
    }
    
    return [...new Set(landmarks)].slice(0, 5); // Return unique landmarks
  } catch (error) {
    log(`Error getting nearby places for ${city}: ${error.message}`);
    return [];
  }
}

// Generate city-specific content based on actual data
async function generateEnhancedCityContent(city, state, inspectors, locationData, landmarks) {
  const inspectorCount = inspectors.length || 0;
  const county = locationData?.county || 'the Bay Area';
  
  // Bay Area specific content elements
  const bayAreaFactors = {
    'San Francisco': {
      housingTypes: 'Victorian homes, modern condos, and earthquake-retrofitted buildings',
      concerns: ['seismic retrofitting', 'foundation issues on hills', 'older electrical systems', 'lead paint in historic homes'],
      avgPrice: '$450-$750'
    },
    'Oakland': {
      housingTypes: 'Craftsman bungalows, mid-century homes, and new developments',
      concerns: ['foundation settling', 'wildfire risk assessment', 'older plumbing systems', 'seismic safety'],
      avgPrice: '$400-$650'
    },
    'San Jose': {
      housingTypes: 'ranch-style homes, modern tech-worker housing, and established neighborhoods',
      concerns: ['foundation issues in clay soil', 'pool/spa inspections', 'solar panel assessments', 'HVAC efficiency'],
      avgPrice: '$425-$675'
    },
    'Berkeley': {
      housingTypes: 'historic homes, student housing, and hillside properties',
      concerns: ['hillside stability', 'seismic preparedness', 'older home systems', 'energy efficiency'],
      avgPrice: '$425-$700'
    },
    'Palo Alto': {
      housingTypes: 'luxury homes, Eichler properties, and high-tech smart homes',
      concerns: ['premium system inspections', 'smart home technology', 'energy efficiency', 'tree root damage'],
      avgPrice: '$500-$850'
    }
  };
  
  const cityInfo = bayAreaFactors[city] || {
    housingTypes: 'single-family homes, townhouses, and condominiums',
    concerns: ['foundation stability', 'moisture issues', 'electrical systems', 'HVAC maintenance'],
    avgPrice: '$400-$650'
  };
  
  const content = `
<div class="max-w-6xl mx-auto px-4 py-8">
  <!-- Hero Section -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold text-gray-900 mb-4">
      Home Inspectors in ${city}, California
    </h1>
    <p class="text-xl text-gray-600 mb-6">
      Find qualified, licensed home inspectors in ${city}, CA. Our directory features ${inspectorCount} verified professionals 
      serving ${county} with comprehensive property inspection services. Get multiple quotes from experienced inspectors familiar 
      with Bay Area homes and local building requirements.
    </p>
    
    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <p class="text-blue-900 font-semibold">
        🏠 ${inspectorCount} Active Inspectors • 📍 Serving ${city} & ${county} • ⭐ Verified Professionals
      </p>
    </div>
  </div>

  <div class="grid lg:grid-cols-3 gap-8 mb-12">
    <div class="lg:col-span-2">
      <!-- Why Professional Inspection Matters -->
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Why Choose Professional Home Inspection in ${city}?</h2>
        <p class="text-gray-700 mb-4">
          ${city}'s unique Bay Area location presents specific challenges for property owners. The area features 
          ${cityInfo.housingTypes}, each with distinct inspection requirements. Professional inspectors who understand 
          local conditions can identify potential issues before they become expensive problems.
        </p>
        
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 class="font-semibold text-amber-900 mb-2">Common ${city} Property Concerns:</h3>
          <ul class="list-disc list-inside text-amber-800 space-y-1">
            ${cityInfo.concerns.map(concern => `<li>${concern}</li>`).join('')}
          </ul>
        </div>
        
        <p class="text-gray-700">
          Bay Area homes face unique challenges including seismic activity, varying soil conditions, and aging infrastructure 
          in historic neighborhoods. A thorough inspection by a local expert ensures you understand your property's condition 
          and can make informed decisions about maintenance and repairs.
        </p>
      </section>

      <!-- Featured Inspectors -->
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Top-Rated ${city} Home Inspectors</h2>
        <div class="space-y-4">
          ${inspectors.length > 0 ? inspectors.slice(0, 5).map(inspector => `
            <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div class="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-1">${inspector.business_name}</h3>
                  ${inspector.owner_name ? `<p class="text-gray-600">${inspector.owner_name}</p>` : ''}
                  <p class="text-gray-500 text-sm">${inspector.city}, ${inspector.state} ${inspector.zip || ''}</p>
                </div>
                <div class="mt-4 md:mt-0 text-right">
                  ${inspector.phone ? `<p class="text-blue-600 font-medium">${inspector.phone}</p>` : ''}
                  ${inspector.email ? `<p class="text-gray-600 text-sm">${inspector.email}</p>` : ''}
                  <a href="/inspector/${inspector.id}" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mt-2">
                    View Full Profile
                  </a>
                </div>
              </div>
              ${inspector.services ? `
                <div class="border-t pt-3">
                  <p class="text-sm text-gray-600"><strong>Specialties:</strong> ${inspector.services}</p>
                </div>
              ` : ''}
              ${inspector.certifications ? `
                <p class="text-sm text-gray-600 mt-2"><strong>Certifications:</strong> ${inspector.certifications}</p>
              ` : ''}
            </div>
          `).join('') : `
            <div class="bg-gray-50 rounded-lg p-8 text-center">
              <p class="text-gray-600 mb-4">We're currently updating our ${city} inspector listings.</p>
              <a href="/contact" class="text-blue-600 hover:text-blue-800 font-medium">
                Are you a ${city} inspector? Add your listing →
              </a>
            </div>
          `}
        </div>
        
        ${inspectorCount > 5 ? `
          <div class="text-center mt-6">
            <a href="/inspectors/${city.toLowerCase().replace(/\s+/g, '-')}" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              View All ${inspectorCount} ${city} Inspectors
            </a>
          </div>
        ` : ''}
      </section>

      <!-- Service Types -->
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Home Inspection Services Available in ${city}</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Pre-Purchase Inspection</h3>
            <p class="text-gray-600 text-sm">Comprehensive evaluation for homebuyers including all major systems and structures</p>
          </div>
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Pre-Listing Inspection</h3>
            <p class="text-gray-600 text-sm">Identify issues before listing to ensure smooth transactions</p>
          </div>
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Seismic Assessment</h3>
            <p class="text-gray-600 text-sm">Bay Area-specific evaluation of earthquake preparedness and retrofitting needs</p>
          </div>
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Specialty Inspections</h3>
            <p class="text-gray-600 text-sm">Pool/spa, roof, termite, mold, and other focused assessments</p>
          </div>
        </div>
      </section>

      <!-- Local Market Information -->
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Understanding ${city}'s Real Estate Market</h2>
        <p class="text-gray-700 mb-4">
          ${city} is located in ${county}, one of the nine Bay Area counties. The local real estate market features 
          ${cityInfo.housingTypes}. With the Bay Area's competitive housing market, a thorough home inspection is essential 
          for making informed decisions whether you're buying, selling, or maintaining a property.
        </p>
        
        ${landmarks.length > 0 ? `
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 class="font-semibold text-gray-900 mb-2">Notable ${city} Areas:</h3>
            <p class="text-gray-700 text-sm">
              Our inspectors serve neighborhoods throughout ${city}, including areas near ${landmarks.slice(0, 3).join(', ')}.
            </p>
          </div>
        ` : ''}
        
        <p class="text-gray-700">
          Home inspection costs in ${city} typically range from ${cityInfo.avgPrice}, depending on property size, age, 
          and additional services requested. Most inspections take 2-4 hours and include a detailed report with photos 
          and recommendations.
        </p>
      </section>
    </div>

    <!-- Sidebar -->
    <div class="lg:col-span-1">
      <!-- Quick Stats -->
      <div class="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">${city} at a Glance</h3>
        <ul class="space-y-2 text-sm text-gray-700">
          <li><strong>Location:</strong> ${county}, CA</li>
          <li><strong>Region:</strong> San Francisco Bay Area</li>
          <li><strong>Active Inspectors:</strong> ${inspectorCount}</li>
          <li><strong>Avg. Inspection Cost:</strong> ${cityInfo.avgPrice}</li>
          <li><strong>Typical Duration:</strong> 2-4 hours</li>
        </ul>
      </div>

      <!-- CTA Box -->
      <div class="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-semibold text-blue-900 mb-4">Get Free Quotes</h3>
        <p class="text-blue-800 mb-4 text-sm">
          Compare quotes from multiple ${city} inspectors. No obligation, no hidden fees.
        </p>
        <button class="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors">
          Get Started →
        </button>
      </div>

      <!-- Service Areas -->
      <div class="bg-green-50 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-semibold text-green-900 mb-4">Service Coverage</h3>
        <p class="text-green-800 text-sm mb-3">
          Our ${city} inspectors also serve:
        </p>
        <ul class="text-sm text-green-700 space-y-1">
          <li>• Surrounding ${county} areas</li>
          <li>• Neighboring Bay Area cities</li>
          <li>• Residential & commercial properties</li>
        </ul>
      </div>

      <!-- Trust Signals -->
      <div class="border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Why InspectorsNearMe?</h3>
        <ul class="space-y-2 text-sm text-gray-700">
          <li>✓ Verified, licensed professionals</li>
          <li>✓ Transparent pricing</li>
          <li>✓ Customer reviews</li>
          <li>✓ Easy online scheduling</li>
          <li>✓ Local Bay Area expertise</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- FAQ Section -->
  <section class="mb-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions About ${city} Home Inspections</h2>
    <div class="space-y-4">
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">How much does a home inspection cost in ${city}?</h3>
        <p class="text-gray-700 text-sm">
          Home inspection costs in ${city} typically range from ${cityInfo.avgPrice}. Factors affecting price include 
          property size, age, and additional services like radon testing or termite inspections. Most ${city} inspectors 
          offer competitive rates and package deals for multiple services.
        </p>
      </div>
      
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">What's included in a standard ${city} home inspection?</h3>
        <p class="text-gray-700 text-sm">
          A standard inspection covers the roof, foundation, electrical systems, plumbing, HVAC, interior and exterior 
          structures, and more. Bay Area inspectors pay special attention to seismic safety, foundation stability, and 
          moisture issues common in our climate.
        </p>
      </div>
      
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">Do I need special inspections for ${city} properties?</h3>
        <p class="text-gray-700 text-sm">
          ${city} properties may benefit from additional inspections including seismic assessments, sewer lateral inspections, 
          and roof certifications. Many older Bay Area homes also require checks for lead paint, asbestos, or outdated 
          electrical systems.
        </p>
      </div>
      
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">How do I choose the right inspector in ${city}?</h3>
        <p class="text-gray-700 text-sm">
          Look for licensed inspectors with local experience, proper insurance, and good reviews. Our directory features 
          only verified ${city} inspectors who meet professional standards. Compare multiple quotes and ask about their 
          experience with ${city} properties specifically.
        </p>
      </div>
    </div>
  </section>

  <!-- Bottom CTA -->
  <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8 text-center">
    <h2 class="text-2xl font-bold mb-4">Ready to Schedule Your ${city} Home Inspection?</h2>
    <p class="text-blue-100 mb-6">
      Connect with experienced inspectors who know ${city} properties inside and out
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button class="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
        Browse ${city} Inspectors
      </button>
      <button class="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold">
        Get Free Quotes
      </button>
    </div>
  </div>
</div>
`.trim();

  return content;
}

// Generate schema markup with Bay Area specific data
function generateBayAreaSchema(city, state, inspectors, locationData) {
  const coordinates = locationData?.coordinates || { lat: 37.7749, lng: -122.4194 };
  const county = locationData?.county || 'San Francisco Bay Area';
  
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `InspectorsNearMe - ${city}, CA`,
    "description": `Professional home inspection services in ${city}, California. Find qualified inspectors serving ${county} and the greater Bay Area.`,
    "url": `https://inspectorsnearme.com/${generateSlug(city, state)}`,
    "image": "https://inspectorsnearme.com/images/logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": coordinates.lat,
      "longitude": coordinates.lng
    },
    "areaServed": [
      {
        "@type": "City",
        "name": city
      },
      {
        "@type": "AdministrativeArea",
        "name": county
      }
    ],
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "08:00",
      "closes": "18:00"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://inspectorsnearme.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "California",
        "item": "https://inspectorsnearme.com/california-home-inspectors"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": city,
        "item": `https://inspectorsnearme.com/${generateSlug(city, state)}`
      }
    ]
  };

  return {
    localBusiness: localBusinessSchema,
    breadcrumb: breadcrumbSchema
  };
}

// Generate slug from city and state
function generateSlug(city, state) {
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}-home-inspectors`;
}

// Get all Bay Area cities from the database
async function getBayAreaCities() {
  try {
    log('Fetching Bay Area cities from database...');
    
    // Query for all unique cities in California
    const { data: cities, error } = await supabase
      .from('inspectors')
      .select('city, state')
      .eq('state', 'CA')
      .not('city', 'is', null);
    
    if (error) throw error;
    
    // Get unique cities
    const uniqueCities = [...new Set(cities.map(item => item.city))]
      .filter(city => city && city.trim() !== '');
    
    log(`Found ${uniqueCities.length} unique cities in California`);
    
    // Filter for Bay Area cities by checking location data
    const bayAreaCities = [];
    
    for (const city of uniqueCities) {
      const locationData = await getLocationData(city, 'CA');
      
      if (locationData && locationData.county) {
        // Check if it's a Bay Area county
        if (BAY_AREA_COUNTIES.includes(locationData.county)) {
          bayAreaCities.push({
            city,
            state: 'CA',
            county: locationData.county,
            coordinates: locationData.coordinates
          });
          log(`✓ ${city} is in ${locationData.county} (Bay Area)`);
        }
      }
      
      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    log(`Identified ${bayAreaCities.length} Bay Area cities`);
    return bayAreaCities;
    
  } catch (error) {
    log(`Error fetching Bay Area cities: ${error.message}`);
    throw error;
  }
}

// Get inspectors for a specific city
async function getInspectorsByCity(city, state) {
  try {
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .eq('city', city)
      .eq('state', state)
      .order('business_name');
    
    if (error) throw error;
    
    return inspectors || [];
    
  } catch (error) {
    log(`Error fetching inspectors for ${city}, ${state}: ${error.message}`);
    return [];
  }
}

// Create or update SEO page
async function createSeoPage(city, state, content, locationData, inspectorCount) {
  try {
    const slug = generateSlug(city, state);
    const title = `${city} Home Inspectors | Licensed Property Inspection Services`;
    const metaDescription = `Find ${inspectorCount}+ licensed home inspectors in ${city}, CA. Professional property inspection services in ${locationData?.county || 'the Bay Area'}. Get free quotes from verified inspectors today!`;
    
    const targetKeywords = [
      `${city.toLowerCase()} home inspectors`,
      `home inspection ${city.toLowerCase()} ca`,
      `property inspectors ${city.toLowerCase()}`,
      `${city.toLowerCase()} home inspection services`,
      `residential inspectors ${city.toLowerCase()}`,
      `home inspectors near ${city.toLowerCase()}`,
      `${locationData?.county?.toLowerCase().replace(' county', '')} home inspectors`
    ].filter(keyword => keyword);
    
    const schemaMarkup = generateBayAreaSchema(city, state, [], locationData);
    
    // Check if page exists
    const { data: existing } = await supabase
      .from('seo_pages')
      .select('id')
      .eq('slug', slug)
      .single();
    
    const pageData = {
      slug,
      title,
      meta_description: metaDescription,
      content,
      inspector_count: inspectorCount,
      city,
      state
    };
    
    if (existing) {
      // Update existing page
      const { error } = await supabase
        .from('seo_pages')
        .update({
          ...pageData,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug);
      
      if (error) throw error;
      log(`Updated SEO page: ${slug}`);
    } else {
      // Create new page
      const { error } = await supabase
        .from('seo_pages')
        .insert(pageData);
      
      if (error) throw error;
      log(`Created SEO page: ${slug}`);
    }
    
    return { success: true, slug };
    
  } catch (error) {
    log(`Error creating/updating SEO page for ${city}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main function to generate Bay Area SEO pages
async function generateBayAreaSeoPages() {
  try {
    await fs.ensureDir(path.dirname(logFile));
    log('=== Starting Bay Area SEO Page Generation ===');
    log(`Using Google Maps API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
    
    // Get Bay Area cities
    const bayAreaCities = await getBayAreaCities();
    
    if (bayAreaCities.length === 0) {
      log('No Bay Area cities found in the database');
      return;
    }
    
    log(`Processing ${bayAreaCities.length} Bay Area cities...`);
    
    const results = {
      successful: [],
      failed: [],
      totalInspectors: 0
    };
    
    // Process each city
    for (const cityData of bayAreaCities) {
      try {
        log(`\nProcessing ${cityData.city}, ${cityData.state}...`);
        
        // Get detailed location data
        const locationData = await getLocationData(cityData.city, cityData.state);
        
        if (!locationData) {
          log(`Warning: Could not get location data for ${cityData.city}`);
          continue;
        }
        
        // Get nearby landmarks
        const landmarks = await getNearbyPlaces(
          locationData.coordinates.lat,
          locationData.coordinates.lng,
          cityData.city
        );
        
        // Get inspectors for this city
        const inspectors = await getInspectorsByCity(cityData.city, cityData.state);
        results.totalInspectors += inspectors.length;
        
        log(`Found ${inspectors.length} inspectors and ${landmarks.length} landmarks`);
        
        // Generate enhanced content
        const content = await generateEnhancedCityContent(
          cityData.city,
          cityData.state,
          inspectors,
          locationData,
          landmarks
        );
        
        // Create/update SEO page
        const result = await createSeoPage(
          cityData.city,
          cityData.state,
          content,
          locationData,
          inspectors.length
        );
        
        if (result.success) {
          results.successful.push({
            city: cityData.city,
            county: locationData.county,
            inspectorCount: inspectors.length,
            slug: result.slug
          });
        } else {
          results.failed.push({
            city: cityData.city,
            error: result.error
          });
        }
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        log(`Error processing ${cityData.city}: ${error.message}`);
        results.failed.push({
          city: cityData.city,
          error: error.message
        });
      }
    }
    
    // Generate summary report
    log('\n=== Bay Area SEO Generation Summary ===');
    log(`Total cities processed: ${bayAreaCities.length}`);
    log(`Successful pages: ${results.successful.length}`);
    log(`Failed pages: ${results.failed.length}`);
    log(`Total inspectors found: ${results.totalInspectors}`);
    
    if (results.successful.length > 0) {
      log('\nSuccessfully generated pages for:');
      results.successful.forEach(city => {
        log(`  - ${city.city} (${city.county}): ${city.inspectorCount} inspectors`);
      });
    }
    
    if (results.failed.length > 0) {
      log('\nFailed to generate pages for:');
      results.failed.forEach(city => {
        log(`  - ${city.city}: ${city.error}`);
      });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'logs', 'bay-area-seo-report.json');
    await fs.writeJson(reportPath, {
      generatedAt: new Date().toISOString(),
      cities: results.successful,
      failed: results.failed,
      totalInspectors: results.totalInspectors,
      googleMapsApiUsed: true
    }, { spaces: 2 });
    
    log(`\nDetailed report saved to: ${reportPath}`);
    
    return results;
    
  } catch (error) {
    log(`Fatal error in Bay Area SEO generation: ${error.message}`);
    throw error;
  }
}

// Export functions
module.exports = {
  generateBayAreaSeoPages,
  getLocationData,
  getNearbyPlaces,
  generateEnhancedCityContent
};

// Run if called directly
if (require.main === module) {
  generateBayAreaSeoPages()
    .then(results => {
      log('Bay Area SEO page generation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Bay Area SEO generation failed:', error);
      process.exit(1);
    });
}