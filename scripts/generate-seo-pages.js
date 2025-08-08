require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Logging
const logFile = path.join(__dirname, '..', 'logs', 'seo-generation.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// City data with local information for better SEO
const cityData = {
  'Birmingham': {
    state: 'AL',
    stateFullName: 'Alabama',
    population: '200,733',
    founded: '1871',
    nickname: 'The Magic City',
    landmarks: ['Vulcan Park', 'Birmingham Museum of Art', 'Red Mountain Park'],
    counties: ['Jefferson County'],
    zipCodes: ['35201-35298'],
    marketDescription: 'Birmingham\'s diverse housing market includes historic neighborhoods, modern developments, and industrial conversions.',
    climateFactors: 'humid subtropical climate with hot summers and mild winters',
    constructionConcerns: ['humidity-related issues', 'foundation settlement', 'HVAC efficiency'],
    averageCost: '$350-$500',
    coordinates: { lat: 33.5186, lng: -86.8104 }
  },
  'Mobile': {
    state: 'AL',
    stateFullName: 'Alabama',
    population: '187,041',
    founded: '1702',
    nickname: 'The Port City',
    landmarks: ['Historic Fort Morgan', 'Mobile Bay', 'Oakleigh Mansion'],
    counties: ['Mobile County'],
    zipCodes: ['36601-36695'],
    marketDescription: 'Mobile\'s coastal housing market features historic antebellum homes, modern waterfront properties, and traditional Southern architecture.',
    climateFactors: 'subtropical climate with high humidity and coastal weather patterns',
    constructionConcerns: ['hurricane preparedness', 'moisture control', 'foundation issues', 'termite damage'],
    averageCost: '$325-$475',
    coordinates: { lat: 30.6954, lng: -88.0399 }
  },
  'Denver': {
    state: 'CO',
    stateFullName: 'Colorado',
    population: '715,522',
    founded: '1858',
    nickname: 'The Mile High City',
    landmarks: ['Red Rocks Park', 'Denver Art Museum', 'Union Station'],
    counties: ['Denver County'],
    zipCodes: ['80201-80299'],
    marketDescription: 'Denver\'s booming real estate market includes historic neighborhoods, modern condos, and rapidly expanding suburban developments.',
    climateFactors: 'semi-arid climate with four distinct seasons and low humidity',
    constructionConcerns: ['foundation issues due to expansive soil', 'radon testing', 'altitude-related HVAC considerations'],
    averageCost: '$400-$650',
    coordinates: { lat: 39.7392, lng: -104.9903 }
  },
  'Colorado Springs': {
    state: 'CO',
    stateFullName: 'Colorado',
    population: '478,961',
    founded: '1871',
    nickname: 'Olympic City USA',
    landmarks: ['Pikes Peak', 'Garden of the Gods', 'Cheyenne Mountain Zoo'],
    counties: ['El Paso County'],
    zipCodes: ['80901-80951'],
    marketDescription: 'Colorado Springs offers diverse housing from military housing to luxury mountain properties and historic downtown residences.',
    climateFactors: 'semi-arid continental climate with mild summers and cold winters',
    constructionConcerns: ['expansive clay soil', 'radon presence', 'wildfire risk assessment', 'elevation-related issues'],
    averageCost: '$375-$575',
    coordinates: { lat: 38.8339, lng: -104.8214 }
  },
  'Atlanta': {
    state: 'GA',
    stateFullName: 'Georgia',
    population: '498,715',
    founded: '1837',
    nickname: 'The City in a Forest',
    landmarks: ['Georgia Aquarium', 'World of Coca-Cola', 'Martin Luther King Jr. National Historical Park'],
    counties: ['Fulton County', 'DeKalb County'],
    zipCodes: ['30301-30398'],
    marketDescription: 'Atlanta\'s dynamic real estate market includes everything from historic Victorian homes to modern high-rise condos and suburban developments.',
    climateFactors: 'humid subtropical climate with hot, humid summers and mild winters',
    constructionConcerns: ['clay soil foundation issues', 'humidity control', 'termite inspections', 'HVAC efficiency'],
    averageCost: '$400-$600',
    coordinates: { lat: 33.7490, lng: -84.3880 }
  },
  'Augusta': {
    state: 'GA',
    stateFullName: 'Georgia',
    population: '202,081',
    founded: '1736',
    nickname: 'The Garden City',
    landmarks: ['Augusta National Golf Club', 'Riverwalk', 'Morris Museum of Art'],
    counties: ['Richmond County', 'Columbia County'],
    zipCodes: ['30901-30999'],
    marketDescription: 'Augusta\'s housing market features historic antebellum architecture, traditional Southern homes, and modern golf course communities.',
    climateFactors: 'humid subtropical climate with long, hot summers and short, mild winters',
    constructionConcerns: ['foundation settlement', 'moisture and humidity issues', 'termite damage', 'HVAC maintenance'],
    averageCost: '$325-$475',
    coordinates: { lat: 33.4735, lng: -82.0105 }
  },
  'Boise': {
    state: 'ID',
    stateFullName: 'Idaho',
    population: '235,684',
    founded: '1863',
    nickname: 'The City of Trees',
    landmarks: ['Boise River Greenbelt', 'Idaho Botanical Garden', 'World Center for Birds of Prey'],
    counties: ['Ada County'],
    zipCodes: ['83701-83799'],
    marketDescription: 'Boise\'s rapidly growing real estate market includes historic neighborhoods, new suburban developments, and foothills properties.',
    climateFactors: 'semi-arid continental climate with four distinct seasons',
    constructionConcerns: ['seismic activity considerations', 'expansive soil issues', 'wildfire risk', 'energy efficiency'],
    averageCost: '$350-$525',
    coordinates: { lat: 43.6150, lng: -116.2023 }
  },
  'Meridian': {
    state: 'ID',
    stateFullName: 'Idaho',
    population: '117,635',
    founded: '1893',
    nickname: 'Idaho\'s Fastest Growing City',
    landmarks: ['Meridian Speedway', 'Roaring Springs Water Park', 'Village at Meridian'],
    counties: ['Ada County'],
    zipCodes: ['83642-83646'],
    marketDescription: 'Meridian features predominantly new construction with master-planned communities, family-friendly neighborhoods, and modern amenities.',
    climateFactors: 'semi-arid continental climate with hot, dry summers and cold winters',
    constructionConcerns: ['new construction quality', 'soil stability', 'energy efficiency standards', 'rapid development oversight'],
    averageCost: '$375-$550',
    coordinates: { lat: 43.6121, lng: -116.3915 }
  },
  'Detroit': {
    state: 'MI',
    stateFullName: 'Michigan',
    population: '670,031',
    founded: '1701',
    nickname: 'The Motor City',
    landmarks: ['Detroit Institute of Arts', 'Hart Plaza', 'Historic Fort Wayne'],
    counties: ['Wayne County'],
    zipCodes: ['48201-48288'],
    marketDescription: 'Detroit\'s recovering real estate market includes historic properties, urban renewal projects, and affordable housing opportunities.',
    climateFactors: 'humid continental climate with warm summers and cold, snowy winters',
    constructionConcerns: ['older home maintenance', 'lead paint issues', 'asbestos concerns', 'winter weatherization', 'basement moisture'],
    averageCost: '$275-$425',
    coordinates: { lat: 42.3314, lng: -83.0458 }
  },
  'Grand Rapids': {
    state: 'MI',
    stateFullName: 'Michigan',
    population: '198,917',
    founded: '1826',
    nickname: 'Furniture City',
    landmarks: ['Frederik Meijer Gardens', 'Grand Rapids Art Museum', 'John Ball Zoo'],
    counties: ['Kent County'],
    zipCodes: ['49501-49599'],
    marketDescription: 'Grand Rapids offers a stable housing market with historic homes, modern developments, and revitalized downtown properties.',
    climateFactors: 'humid continental climate with lake-effect weather patterns',
    constructionConcerns: ['basement waterproofing', 'ice dam prevention', 'older home systems', 'energy efficiency upgrades'],
    averageCost: '$300-$450',
    coordinates: { lat: 42.9634, lng: -85.6681 }
  },
  'Miami': {
    state: 'FL',
    stateFullName: 'Florida',
    population: '442,241',
    founded: '1896',
    nickname: 'The Magic City',
    landmarks: ['South Beach', 'Art Deco Historic District', 'Vizcaya Museum', 'Wynwood Walls'],
    counties: ['Miami-Dade County'],
    zipCodes: ['33101-33299'],
    marketDescription: 'Miami\'s luxury real estate market features high-rise condominiums, waterfront estates, historic Art Deco properties, and diverse residential neighborhoods reflecting the city\'s international character.',
    climateFactors: 'tropical monsoon climate with hot, humid summers and warm, dry winters',
    constructionConcerns: ['hurricane impact windows and doors', 'flood zone compliance', 'saltwater corrosion', 'foundation issues in coastal areas', 'mold and moisture control', 'wind mitigation features'],
    averageCost: '$450-$750',
    coordinates: { lat: 25.7617, lng: -80.1918 }
  },
  'Boston': {
    state: 'MA',
    stateFullName: 'Massachusetts',
    population: '675,647',
    founded: '1630',
    nickname: 'The Hub of the Universe',
    landmarks: ['Freedom Trail', 'Fenway Park', 'Boston Common', 'Harvard University', 'MIT'],
    counties: ['Suffolk County'],
    zipCodes: ['02101-02299'],
    marketDescription: 'Boston\'s historic real estate market includes colonial-era homes, Victorian brownstones, modern luxury condos, and diverse neighborhoods from Back Bay to South End, each with unique architectural character.',
    climateFactors: 'humid continental climate with cold, snowy winters and warm, humid summers',
    constructionConcerns: ['aging infrastructure in historic homes', 'lead paint and asbestos', 'foundation issues in filled land areas', 'ice dam formation', 'heating system efficiency', 'basement water infiltration'],
    averageCost: '$500-$800',
    coordinates: { lat: 42.3601, lng: -71.0589 }
  },
  'Phoenix': {
    state: 'AZ',
    stateFullName: 'Arizona',
    population: '1,608,139',
    founded: '1881',
    nickname: 'Valley of the Sun',
    landmarks: ['Camelback Mountain', 'Desert Botanical Garden', 'Papago Park', 'South Mountain Park'],
    counties: ['Maricopa County'],
    zipCodes: ['85001-85099'],
    marketDescription: 'Phoenix\'s expansive real estate market features desert contemporary homes, Spanish colonial properties, master-planned communities, and golf course estates spread across the Valley of the Sun.',
    climateFactors: 'hot desert climate with extremely hot summers and mild winters',
    constructionConcerns: ['foundation issues from expansive soil', 'HVAC system efficiency', 'roof degradation from UV exposure', 'termite damage', 'pool equipment maintenance', 'stucco cracks and moisture intrusion'],
    averageCost: '$400-$650',
    coordinates: { lat: 33.4484, lng: -112.0740 }
  },
  'Seattle': {
    state: 'WA',
    stateFullName: 'Washington',
    population: '737,015',
    founded: '1851',
    nickname: 'The Emerald City',
    landmarks: ['Space Needle', 'Pike Place Market', 'Mount Rainier', 'Puget Sound', 'Discovery Park'],
    counties: ['King County'],
    zipCodes: ['98101-98199'],
    marketDescription: 'Seattle\'s competitive housing market features craftsman homes, modern condos, floating homes, and view properties across diverse neighborhoods from Capitol Hill to Queen Anne, driven by the tech industry growth.',
    climateFactors: 'oceanic climate with mild, wet winters and cool, dry summers',
    constructionConcerns: ['moisture and mold issues', 'earthquake retrofitting needs', 'roof moss growth', 'drainage and grading problems', 'foundation settlement on hillsides', 'energy efficiency in older homes'],
    averageCost: '$450-$750',
    coordinates: { lat: 47.6062, lng: -122.3321 }
  }
};

// Service types and descriptions
const serviceTypes = [
  {
    name: 'General Home Inspection',
    description: 'Comprehensive evaluation of structural, mechanical, and safety systems',
    icon: '🏠'
  },
  {
    name: 'Pre-Purchase Inspection',
    description: 'Detailed assessment for home buyers to identify potential issues',
    icon: '🔍'
  },
  {
    name: 'Pre-Listing Inspection',
    description: 'Seller-focused inspection to address issues before listing',
    icon: '📋'
  },
  {
    name: 'New Construction Inspection',
    description: 'Quality assurance for newly built homes and developments',
    icon: '🔨'
  },
  {
    name: 'Specialty Inspections',
    description: 'Radon, mold, termite, and other specialized assessments',
    icon: '🧪'
  }
];

// Generate schema markup for local business
function generateSchemaMarkup(city, state, inspectors) {
  const cityInfo = city ? cityData[city] : null;
  
  // For state pages, we don't have specific coordinates
  if (!cityInfo) {
    return {
      localBusiness: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": `InspectorsNearMe - ${state}`,
        "description": `Professional home inspection services throughout ${state}. Find qualified, licensed inspectors.`,
        "url": `https://inspectorsnearme.com/${state.toLowerCase()}-home-inspectors`
      },
      faq: {},
      service: {}
    };
  }
  
  // Main local business schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `InspectorsNearMe - ${city}, ${state}`,
    "description": `Professional home inspection services in ${city}, ${state}. Find qualified, licensed inspectors for comprehensive property evaluations.`,
    "url": `https://inspectorsnearme.com/${generateSlug(city, state)}`,
    "image": "https://inspectorsnearme.com/images/logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": state,
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": cityInfo.coordinates.lat,
      "longitude": cityInfo.coordinates.lng
    },
    "priceRange": cityInfo.averageCost,
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": cityInfo.coordinates.lat,
        "longitude": cityInfo.coordinates.lng
      },
      "geoRadius": "50000"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Home Inspection Services",
      "itemListElement": serviceTypes.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.name,
          "description": service.description
        }
      }))
    }
  };

  // FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How much does a home inspection cost in ${city}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Home inspection costs in ${city} typically range from ${cityInfo.averageCost} depending on property size, age, and specific services requested. Most inspectors offer competitive pricing and package deals.`
        }
      },
      {
        "@type": "Question",
        "name": "How long does a home inspection take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `A typical home inspection in ${city} takes 2-4 hours, depending on the size and complexity of the property. Larger homes or those with unique features may require additional time.`
        }
      },
      {
        "@type": "Question",
        "name": `What areas of ${city} do inspectors serve?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Our certified inspectors serve all areas of ${city} and surrounding ${cityInfo.counties.join(' and ')}, including neighborhoods near ${cityInfo.landmarks.slice(0, 2).join(' and ')}.`
        }
      }
    ]
  };

  // Service schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Home Inspection Services in ${city}, ${state}`,
    "description": `Professional home inspection services covering ${city} and surrounding areas in ${state}.`,
    "provider": {
      "@type": "Organization",
      "name": "InspectorsNearMe",
      "url": "https://inspectorsnearme.com"
    },
    "areaServed": {
      "@type": "City",
      "name": city,
      "containedInPlace": {
        "@type": "State",
        "name": state
      }
    },
    "offers": {
      "@type": "Offer",
      "priceRange": cityInfo.averageCost,
      "availability": "https://schema.org/InStock"
    }
  };

  return {
    localBusiness: localBusinessSchema,
    faq: faqSchema,
    service: serviceSchema
  };
}

// Generate target keywords for a city
function generateTargetKeywords(city, state) {
  const stateLower = state.toLowerCase();
  
  // If city is null, generate state-level keywords
  if (!city) {
    return [
      `${stateLower} home inspectors`,
      `home inspection ${stateLower}`,
      `property inspectors ${stateLower}`,
      `residential inspection ${stateLower}`
    ];
  }
  
  const cityLower = city.toLowerCase();
  
  return [
    `${cityLower} home inspectors`,
    `home inspectors in ${cityLower} ${stateLower}`,
    `${cityLower} property inspection`,
    `residential inspectors ${cityLower}`,
    `home inspection services ${cityLower}`,
    `${cityLower} ${stateLower} home inspection`,
    `property inspectors ${cityLower}`,
    `${cityLower} house inspection`,
    `certified home inspectors ${cityLower}`,
    `${cityLower} real estate inspection`
  ];
}

// Generate slug from city and state
function generateSlug(city, state) {
  if (!city) {
    // State-level slug
    return `${state.toLowerCase()}-home-inspectors`;
  }
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}-home-inspectors`;
}

// Generate SEO-optimized title
function generateTitle(city, state) {
  return `Home Inspectors in ${city}, ${state} | Licensed Property Inspection Services`;
}

// Generate meta description
function generateMetaDescription(city, state, inspectorCount) {
  const descriptions = [
    `Find licensed home inspectors in ${city}, ${state}. ${inspectorCount}+ certified professionals offering comprehensive property inspections. Get quotes today!`,
    `Trusted home inspection services in ${city}, ${state}. Connect with ${inspectorCount}+ qualified inspectors for residential property evaluations.`,
    `Professional home inspectors serving ${city}, ${state}. Compare ${inspectorCount}+ licensed inspectors for your property inspection needs.`,
    `${city}, ${state} home inspection services. Browse ${inspectorCount}+ certified inspectors for comprehensive residential property assessments.`
  ];
  
  // Use city name to determine which description (for consistency)
  const index = city.charCodeAt(0) % descriptions.length;
  return descriptions[index];
}

// Generate comprehensive SEO content for city pages
function generateCityContent(city, state, inspectors) {
  const cityInfo = cityData[city];
  const inspectorCount = inspectors.length;
  
  return `
<div class="max-w-6xl mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-4xl font-bold text-gray-900 mb-4">
      Home Inspectors in ${city}, ${cityInfo.stateFullName}
    </h1>
    <p class="text-xl text-gray-600 mb-6">
      Find qualified, licensed home inspectors in ${city}, ${state}. Our directory features ${inspectorCount} verified professionals ready to provide comprehensive property inspection services.
    </p>
  </div>

  <div class="grid lg:grid-cols-3 gap-8 mb-12">
    <div class="lg:col-span-2">
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Why Choose Professional Home Inspection in ${city}?</h2>
        <p class="text-gray-700 mb-4">
          ${city}, ${cityInfo.nickname}, presents unique challenges for property owners. With its ${cityInfo.climateFactors}, 
          properties in ${cityInfo.counties.join(' and ')} require specialized inspection expertise.
        </p>
        <p class="text-gray-700 mb-4">
          ${cityInfo.marketDescription} Professional inspectors familiar with local building codes and common issues 
          can help identify potential problems before they become costly repairs.
        </p>
        
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h3 class="font-semibold text-blue-900 mb-2">Common ${city} Property Concerns:</h3>
          <ul class="list-disc list-inside text-blue-800 space-y-1">
            ${cityInfo.constructionConcerns.map(concern => `<li>${concern}</li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Home Inspection Services in ${city}</h2>
        <div class="grid md:grid-cols-2 gap-4">
          ${serviceTypes.map(service => `
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center mb-2">
                <span class="text-2xl mr-3">${service.icon}</span>
                <h3 class="font-semibold text-gray-900">${service.name}</h3>
              </div>
              <p class="text-gray-600 text-sm">${service.description}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Featured Home Inspectors in ${city}</h2>
        <div class="space-y-4">
          ${inspectors.slice(0, 3).map(inspector => `
            <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div class="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-1">${inspector.business_name}</h3>
                  <p class="text-gray-600">${inspector.owner_name || 'Licensed Inspector'}</p>
                  <p class="text-gray-500 text-sm">${inspector.city}, ${inspector.state}</p>
                </div>
                <div class="mt-4 md:mt-0 text-right">
                  ${inspector.phone ? `<p class="text-blue-600 font-medium">${inspector.phone}</p>` : ''}
                  <a href="/inspector/${inspector.id}" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mt-2">
                    View Profile
                  </a>
                </div>
              </div>
              ${inspector.services ? `
                <div class="border-t pt-3">
                  <p class="text-sm text-gray-600"><strong>Services:</strong> ${inspector.services}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        ${inspectorCount > 3 ? `
          <div class="text-center mt-6">
            <a href="#all-inspectors" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              View All ${inspectorCount} Inspectors in ${city}
            </a>
          </div>
        ` : ''}
      </section>
    </div>

    <div class="lg:col-span-1">
      <div class="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Quick Facts About ${city}</h3>
        <ul class="space-y-2 text-sm text-gray-700">
          <li><strong>Population:</strong> ${cityInfo.population}</li>
          <li><strong>Founded:</strong> ${cityInfo.founded}</li>
          <li><strong>Counties:</strong> ${cityInfo.counties.join(', ')}</li>
          <li><strong>ZIP Codes:</strong> ${cityInfo.zipCodes.join(', ')}</li>
          <li><strong>Inspection Cost:</strong> ${cityInfo.averageCost}</li>
        </ul>
      </div>

      <div class="bg-green-50 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-semibold text-green-900 mb-4">Get Free Inspection Quotes</h3>
        <p class="text-green-800 mb-4 text-sm">
          Compare quotes from multiple certified inspectors in ${city}. Most inspections completed within 24-48 hours.
        </p>
        <button class="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 transition-colors">
          Request Free Quotes
        </button>
      </div>

      <div class="bg-blue-50 rounded-lg p-6">
        <h3 class="text-xl font-semibold text-blue-900 mb-4">Popular Neighborhoods</h3>
        <ul class="space-y-1 text-sm text-blue-800">
          ${cityInfo.landmarks.map(landmark => `<li>• ${landmark} Area</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>

  <section class="mb-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">What to Expect During Your ${city} Home Inspection</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="text-center">
        <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
          <span class="text-2xl">📋</span>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Scheduling</h3>
        <p class="text-gray-600 text-sm">Easy online booking with flexible time slots</p>
      </div>
      <div class="text-center">
        <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
          <span class="text-2xl">🔍</span>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Inspection</h3>
        <p class="text-gray-600 text-sm">Comprehensive 2-4 hour property evaluation</p>
      </div>
      <div class="text-center">
        <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
          <span class="text-2xl">📄</span>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Report</h3>
        <p class="text-gray-600 text-sm">Detailed written report with photos</p>
      </div>
      <div class="text-center">
        <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
          <span class="text-2xl">💬</span>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Follow-up</h3>
        <p class="text-gray-600 text-sm">Questions answered and guidance provided</p>
      </div>
    </div>
  </section>

  <section class="mb-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
    <div class="space-y-4">
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">How much does a home inspection cost in ${city}?</h3>
        <p class="text-gray-700 text-sm">Home inspection costs in ${city} typically range from ${cityInfo.averageCost} depending on property size, age, and specific services requested. Most inspectors offer competitive pricing and package deals.</p>
      </div>
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">How long does a home inspection take?</h3>
        <p class="text-gray-700 text-sm">A typical home inspection in ${city} takes 2-4 hours, depending on the size and complexity of the property. Larger homes or those with unique features may require additional time.</p>
      </div>
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">What areas of ${city} do inspectors serve?</h3>
        <p class="text-gray-700 text-sm">Our certified inspectors serve all areas of ${city} and surrounding ${cityInfo.counties.join(' and ')}, including neighborhoods near ${cityInfo.landmarks.slice(0, 2).join(' and ')}.</p>
      </div>
    </div>
  </section>

  <div class="bg-gray-900 text-white rounded-lg p-8 text-center">
    <h2 class="text-2xl font-bold mb-4">Ready to Schedule Your Home Inspection?</h2>
    <p class="text-gray-300 mb-6">Connect with top-rated home inspectors in ${city}, ${state} today</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        Find Inspectors
      </button>
      <button class="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-gray-900 transition-colors">
        Get Free Quote
      </button>
    </div>
  </div>
</div>
`.trim();
}

// Create or update seo_pages table
async function ensureSeoTable() {
  try {
    log('Ensuring seo_pages table exists...');
    
    // Check if table exists by attempting to select from it
    const { data, error } = await supabase
      .from('seo_pages')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('relation "seo_pages" does not exist')) {
      log('seo_pages table does not exist. Please run the SQL script: scripts/create-seo-table.sql');
      log('This will create the table with the proper structure.');
    } else {
      log('seo_pages table exists');
    }
    
  } catch (error) {
    log(`Error checking seo_pages table: ${error.message}`);
    log('Please ensure the seo_pages table exists by running: scripts/create-seo-table.sql');
  }
}

// Get inspectors by city
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

// Calculate SEO score based on content quality
function calculateSeoScore(title, metaDescription, content, keywords) {
  let score = 0;
  
  // Title optimization (max 20 points)
  if (title.length >= 30 && title.length <= 60) score += 10;
  if (keywords.some(keyword => title.toLowerCase().includes(keyword))) score += 10;
  
  // Meta description optimization (max 20 points)
  if (metaDescription && metaDescription.length >= 120 && metaDescription.length <= 160) score += 10;
  if (keywords.some(keyword => metaDescription.toLowerCase().includes(keyword))) score += 10;
  
  // Content optimization (max 40 points)
  if (content.length >= 1000) score += 15;
  if (content.includes('<h1>') && content.includes('<h2>')) score += 10;
  
  // Keyword presence in content (max 15 points)
  const keywordCount = keywords.reduce((count, keyword) => {
    return count + (content.toLowerCase().split(keyword).length - 1);
  }, 0);
  if (keywordCount >= 5) score += 15;
  else if (keywordCount >= 3) score += 10;
  else if (keywordCount >= 1) score += 5;
  
  // Basic structure elements (max 5 points)
  if (content.includes('FAQ') || content.includes('Questions')) score += 5;
  
  return Math.min(score, 100);
}

// Create or update SEO page
async function createSeoPage(slug, pageType, title, metaDescription, content, city, state, inspectorCount = 0) {
  try {
    const targetKeywords = generateTargetKeywords(city, state);
    const schemaMarkup = generateSchemaMarkup(city, state, []);
    const seoScore = calculateSeoScore(title, metaDescription, content, targetKeywords);
    const canonicalUrl = `https://inspectorsnearme.com/${slug}`;
    
    // Estimate monthly searches based on city population
    let estimatedSearches = 500; // Default for state pages
    if (city && cityData[city]) {
      const cityInfo = cityData[city];
      const population = parseInt(cityInfo.population.replace(/,/g, ''));
      estimatedSearches = Math.round((population / 10000) * 50); // Rough estimate
    }
    
    // Check if page already exists
    const { data: existing, error: selectError } = await supabase
      .from('seo_pages')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      // Update existing page
      const { error: updateError } = await supabase
        .from('seo_pages')
        .update({
          title,
          meta_description: metaDescription,
          content,
          keywords: targetKeywords,
          canonical_url: canonicalUrl,
          seo_score: seoScore,
          search_volume: estimatedSearches,
          inspector_count: inspectorCount,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug);
      
      if (updateError) throw updateError;
      log(`Updated SEO page: ${slug} (Score: ${seoScore}/100)`);
      
    } else {
      // Create new page
      const { error: insertError } = await supabase
        .from('seo_pages')
        .insert({
          slug,
          page_type: pageType,
          title,
          meta_description: metaDescription,
          content,
          city,
          state,
          keywords: targetKeywords,
          canonical_url: canonicalUrl,
          seo_score: seoScore,
          search_volume: estimatedSearches,
          inspector_count: inspectorCount,
          status: 'published'
        });
      
      if (insertError) throw insertError;
      log(`Created SEO page: ${slug} (Score: ${seoScore}/100)`);
    }
    
  } catch (error) {
    log(`Error creating/updating SEO page ${slug}: ${error.message}`);
    throw error;
  }
}

// Generate all city pages
async function generateCityPages() {
  try {
    log('Starting city page generation...');
    
    const cities = Object.keys(cityData);
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    for (const city of cities) {
      try {
        const cityInfo = cityData[city];
        const state = cityInfo.state;
        
        log(`Generating page for ${city}, ${state}...`);
        
        // Get inspectors for this city
        const inspectors = await getInspectorsByCity(city, state);
        log(`Found ${inspectors.length} inspectors in ${city}, ${state}`);
        
        // Generate page content
        const slug = generateSlug(city, state);
        const title = generateTitle(city, state);
        const metaDescription = generateMetaDescription(city, state, inspectors.length);
        const content = generateCityContent(city, state, inspectors);
        
        // Create/update the page
        await createSeoPage(slug, 'city', title, metaDescription, content, city, state, inspectors.length);
        
        results.push({
          city,
          state,
          slug,
          inspectorCount: inspectors.length,
          status: 'success'
        });
        
        successCount++;
        log(`✓ Successfully generated page for ${city}, ${state}`);
        
      } catch (error) {
        errorCount++;
        results.push({
          city,
          state: cityData[city]?.state,
          status: 'error',
          error: error.message
        });
        log(`✗ Error generating page for ${city}: ${error.message}`);
      }
    }
    
    log(`\nCity page generation complete:`);
    log(`- Successfully generated: ${successCount} pages`);
    log(`- Errors: ${errorCount} pages`);
    
    return { successCount, errorCount, results };
    
  } catch (error) {
    log(`Fatal error in city page generation: ${error.message}`);
    throw error;
  }
}

// Generate state overview pages
async function generateStatePages() {
  try {
    log('Generating state overview pages...');
    
    const states = [...new Set(Object.values(cityData).map(city => city.state))];
    let successCount = 0;
    const results = [];
    
    for (const state of states) {
      try {
        const stateCities = Object.entries(cityData)
          .filter(([_, cityInfo]) => cityInfo.state === state)
          .map(([cityName, _]) => cityName);
        
        const stateFullName = cityData[stateCities[0]].stateFullName;
        
        // Get total inspectors for state
        const { data: stateInspectors, error } = await supabase
          .from('inspectors')
          .select('id, business_name, city')
          .eq('state', state);
        
        if (error) throw error;
        
        const slug = `${state.toLowerCase()}-home-inspectors`;
        const title = `Home Inspectors in ${stateFullName} | Licensed Property Inspection Services`;
        const metaDescription = `Find licensed home inspectors across ${stateFullName}. ${stateInspectors.length}+ certified professionals in ${stateCities.join(', ')} and surrounding areas.`;
        
        const content = `
<div class="max-w-6xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6">Home Inspectors in ${stateFullName}</h1>
  
  <p class="text-xl text-gray-600 mb-8">
    Find qualified, licensed home inspectors throughout ${stateFullName}. Our directory features ${stateInspectors.length} verified professionals 
    serving ${stateCities.length} major cities and surrounding areas.
  </p>
  
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
    ${stateCities.map(city => {
      const cityInfo = cityData[city];
      const cityInspectors = stateInspectors.filter(inspector => inspector.city === city);
      return `
        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <h3 class="text-xl font-semibold text-gray-900 mb-2">${city}</h3>
          <p class="text-gray-600 mb-3">${cityInfo.nickname}</p>
          <p class="text-blue-600 font-medium mb-3">${cityInspectors.length} inspectors available</p>
          <a href="/${generateSlug(city, state)}" class="text-blue-600 hover:text-blue-800 font-medium">
            View ${city} Inspectors →
          </a>
        </div>
      `;
    }).join('')}
  </div>
  
  <section class="mb-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">${stateFullName} Home Inspection Services</h2>
    <div class="prose max-w-none text-gray-700">
      <p>
        ${stateFullName} home inspectors provide comprehensive property evaluation services across diverse markets 
        and climate conditions. From urban centers to suburban developments, our certified professionals understand 
        local building codes, common construction issues, and regional environmental factors.
      </p>
    </div>
  </section>
</div>
        `.trim();
        
        // Generate state-specific keywords
        const stateKeywords = [
          `${stateFullName.toLowerCase()} home inspectors`,
          `home inspection ${stateFullName.toLowerCase()}`,
          `property inspectors ${state.toLowerCase()}`,
          `residential inspection ${stateFullName.toLowerCase()}`
        ];
        
        await createSeoPage(slug, 'state', title, metaDescription, content, null, state, stateInspectors.length);
        
        results.push({
          state,
          stateFullName,
          slug,
          inspectorCount: stateInspectors.length,
          citiesCount: stateCities.length,
          status: 'success'
        });
        
        successCount++;
        log(`✓ Generated state page for ${stateFullName}`);
        
      } catch (error) {
        results.push({
          state,
          status: 'error',
          error: error.message
        });
        log(`✗ Error generating state page for ${state}: ${error.message}`);
      }
    }
    
    log(`State page generation complete: ${successCount} pages created`);
    return { successCount, results };
    
  } catch (error) {
    log(`Error in state page generation: ${error.message}`);
    throw error;
  }
}

// Generate SEO performance report
async function generateSeoReport() {
  try {
    log('Generating SEO performance report...');
    
    const { data: pages, error } = await supabase
      .from('seo_pages')
      .select('*')
      .order('seo_score', { ascending: false });
    
    if (error) throw error;
    
    const report = {
      totalPages: pages.length,
      pageTypes: {},
      avgSeoScore: 0,
      topPerformers: [],
      needsImprovement: [],
      generatedAt: new Date().toISOString()
    };
    
    // Group by page type
    pages.forEach(page => {
      if (!report.pageTypes[page.page_type]) {
        report.pageTypes[page.page_type] = 0;
      }
      report.pageTypes[page.page_type]++;
    });
    
    // Calculate average SEO score
    const totalScore = pages.reduce((sum, page) => sum + (page.seo_score || 0), 0);
    report.avgSeoScore = pages.length > 0 ? Math.round(totalScore / pages.length) : 0;
    
    // Top performers (score >= 80)
    report.topPerformers = pages.filter(page => (page.seo_score || 0) >= 80);
    
    // Needs improvement (score < 70)
    report.needsImprovement = pages.filter(page => (page.seo_score || 0) < 70);
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'logs', 'seo-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    log(`SEO report generated: ${reportPath}`);
    log(`Average SEO score: ${report.avgSeoScore}/100`);
    log(`Top performers: ${report.topPerformers.length} pages`);
    log(`Needs improvement: ${report.needsImprovement.length} pages`);
    
    return report;
    
  } catch (error) {
    log(`Error generating SEO report: ${error.message}`);
    throw error;
  }
}

// Main generation function
async function generateSeoPages() {
  try {
    await fs.ensureDir(path.dirname(logFile));
    log('Starting SEO page generation process...');
    
    // Ensure the seo_pages table exists
    await ensureSeoTable();
    
    // Generate city pages
    const cityResults = await generateCityPages();
    
    // Generate state pages
    const stateResults = await generateStatePages();
    
    // Generate performance report
    const seoReport = await generateSeoReport();
    
    log('\n=== SEO Page Generation Summary ===');
    log(`City pages: ${cityResults.successCount} created, ${cityResults.errorCount} errors`);
    log(`State pages: ${stateResults.successCount} created`);
    log(`Total pages: ${cityResults.successCount + stateResults.successCount}`);
    log(`Average SEO score: ${seoReport.avgSeoScore}/100`);
    log('SEO page generation complete!');
    
    return {
      cityPages: cityResults,
      statePages: stateResults,
      totalPages: cityResults.successCount + stateResults.successCount,
      seoReport
    };
    
  } catch (error) {
    log(`Fatal error in SEO generation: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateSeoPages,
  generateCityPages,
  generateStatePages,
  generateSeoReport,
  generateSlug,
  generateTitle,
  generateMetaDescription,
  generateSchemaMarkup,
  generateTargetKeywords
};

// Run if called directly
if (require.main === module) {
  generateSeoPages().catch(error => {
    console.error('SEO generation failed:', error);
    process.exit(1);
  });
}