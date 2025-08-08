require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeGeocoder = require('node-geocoder');
const fs = require('fs-extra');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize geocoder
const geocoder = NodeGeocoder({
  provider: 'google',
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  formatter: null
});

// Target states (non-licensed)
const TARGET_STATES = [
  'AL', 'AK', 'CO', 'DE', 'GA', 'HI', 'ID', 'IA', 'KS', 'ME',
  'MI', 'MN', 'MO', 'NE', 'NH', 'NM', 'OH', 'PA', 'UT', 'VT',
  'WV', 'WY'
];

// Priority cities for each state
const PRIORITY_CITIES = {
  'AL': ['Birmingham', 'Mobile', 'Huntsville', 'Montgomery', 'Tuscaloosa'],
  'AK': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
  'CO': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
  'DE': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
  'GA': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'],
  'HI': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu'],
  'ID': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'],
  'IA': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
  'KS': ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe'],
  'ME': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
  'MI': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'],
  'MN': ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'],
  'MO': ['Kansas City', 'Saint Louis', 'Springfield', 'Independence', 'Columbia'],
  'NE': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
  'NH': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester'],
  'NM': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
  'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
  'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
  'UT': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
  'VT': ['Burlington', 'Essex', 'South Burlington', 'Colchester', 'Rutland'],
  'WV': ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown', 'Wheeling'],
  'WY': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs']
};

// Data storage for deduplication
let collectedInspectors = new Map();
let totalCollected = 0;
let logFile = path.join(__dirname, '..', 'logs', 'scraping.log');

// Ensure logs directory exists
async function ensureLogsDir() {
  await fs.ensureDir(path.dirname(logFile));
}

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean and validate phone number
function cleanPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  if (cleaned.length === 11 && cleaned[0] === '1') {
    const number = cleaned.slice(1);
    return `(${number.slice(0,3)}) ${number.slice(3,6)}-${number.slice(6)}`;
  }
  return cleaned.length >= 10 ? phone : null;
}

// Clean and validate email
function cleanEmail(email) {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email.toLowerCase() : null;
}

// Clean and validate website
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

// Extract certifications from text
function extractCertifications(text) {
  const certifications = [];
  const certKeywords = [
    'ASHI', 'InterNACHI', 'NAHI', 'NACHI', 'CREIA', 'CAHPI',
    'Certified', 'Licensed', 'ICC', 'IAEI', 'AHIT'
  ];
  
  certKeywords.forEach(keyword => {
    if (text.toUpperCase().includes(keyword.toUpperCase())) {
      certifications.push(keyword);
    }
  });
  
  return [...new Set(certifications)];
}

// Extract services from text
function extractServices(text) {
  const services = [];
  const serviceKeywords = [
    'Home Inspection', 'Property Inspection', 'Residential Inspection',
    'Pre-Purchase Inspection', 'New Construction Inspection',
    'Radon Testing', 'Mold Testing', 'Termite Inspection',
    'Well Water Testing', 'Septic Inspection', 'Pool Inspection',
    'HVAC Inspection', 'Electrical Inspection', 'Plumbing Inspection',
    'Roof Inspection', 'Foundation Inspection'
  ];
  
  serviceKeywords.forEach(service => {
    if (text.toLowerCase().includes(service.toLowerCase())) {
      services.push(service);
    }
  });
  
  return [...new Set(services)];
}

// Generate unique key for deduplication
function generateKey(inspector) {
  const phone = inspector.phone?.replace(/[^\d]/g, '') || '';
  const email = inspector.email?.toLowerCase() || '';
  const name = inspector.business_name?.toLowerCase().replace(/[^\w]/g, '') || '';
  
  if (phone.length >= 10) return `phone_${phone}`;
  if (email) return `email_${email}`;
  return `name_${name}_${inspector.address_city?.toLowerCase()}_${inspector.address_state}`;
}

// Check if inspector already exists
function isDuplicate(inspector) {
  const key = generateKey(inspector);
  return collectedInspectors.has(key);
}

// Add inspector to collection
function addInspector(inspector) {
  const key = generateKey(inspector);
  collectedInspectors.set(key, inspector);
}

// Geocode address
async function geocodeAddress(address) {
  try {
    const results = await geocoder.geocode(address);
    if (results && results.length > 0) {
      return {
        lat: results[0].latitude,
        lng: results[0].longitude
      };
    }
  } catch (error) {
    log(`Geocoding error for ${address}: ${error.message}`);
  }
  return { lat: null, lng: null };
}

// Scrape Google Maps for inspectors
async function scrapeGoogleMaps(city, state) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    const query = `home inspector ${city} ${state}`;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    
    log(`Scraping Google Maps: ${query}`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(5000);
    
    // Wait for results to load
    try {
      await page.waitForSelector('[role="main"]', { timeout: 15000 });
    } catch (error) {
      log(`No results found for ${query}`);
      return [];
    }
    
    // Scroll to load more results
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[role="main"]');
      if (scrollContainer) {
        for (let i = 0; i < 3; i++) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
    await sleep(3000);
    
    // Extract business listings with more robust selectors
    const listings = await page.evaluate(() => {
      const results = [];
      
      // Try multiple selectors for business listings
      const selectors = [
        '[data-result-index]',
        '[jsaction*="click"]',
        '.Nv2PK',
        '[data-cid]'
      ];
      
      let businessElements = [];
      for (const selector of selectors) {
        businessElements = document.querySelectorAll(selector);
        if (businessElements.length > 0) break;
      }
      
      businessElements.forEach((element, index) => {
        if (index > 20) return; // Limit to first 20 results
        
        try {
          // Try multiple selectors for business name
          let nameElement = element.querySelector('[class*="fontHeadlineSmall"]') ||
                           element.querySelector('.qBF1Pd') ||
                           element.querySelector('.lI9IFe') ||
                           element.querySelector('h3') ||
                           element.querySelector('[data-value="Business name"]');
          
          if (nameElement && nameElement.textContent) {
            const businessName = nameElement.textContent.trim();
            
            // Skip if not relevant to home inspection
            if (!businessName.toLowerCase().includes('inspect') && 
                !businessName.toLowerCase().includes('home') &&
                !businessName.toLowerCase().includes('property')) {
              return;
            }
            
            // Extract other details
            const addressElement = element.querySelector('[data-value="Address"]') ||
                                 element.querySelector('.W4Efsd:last-child');
            
            const phoneElement = element.querySelector('[data-value="Phone"]') ||
                               element.querySelector('[href^="tel:"]');
            
            const websiteElement = element.querySelector('[data-value="Website"]') ||
                                 element.querySelector('[href^="http"]');
            
            results.push({
              business_name: businessName,
              address: addressElement?.textContent?.trim(),
              phone: phoneElement?.textContent?.trim() || phoneElement?.href?.replace('tel:', ''),
              website: websiteElement?.href,
              source: 'Google Maps'
            });
          }
        } catch (error) {
          // Skip this element if extraction fails
          console.log('Error extracting element:', error.message);
        }
      });
      
      return results;
    });
    
    const inspectors = [];
    
    for (const listing of listings) {
      if (!listing.business_name) continue;
      
      // Parse address
      const addressParts = listing.address?.split(',') || [];
      const street = addressParts[0]?.trim();
      const zip = addressParts[addressParts.length - 1]?.trim()?.match(/\d{5}(-\d{4})?/)?.[0];
      
      const inspector = {
        business_name: listing.business_name,
        owner_name: null,
        email: null,
        phone: cleanPhone(listing.phone),
        website: cleanWebsite(listing.website),
        address_street: street,
        address_city: city,
        address_state: state,
        address_zip: zip,
        certifications: extractCertifications(listing.business_name),
        services: ['Home Inspection'],
        years_in_business: null,
        license_number: null
      };
      
      // Geocode
      if (listing.address) {
        const coords = await geocodeAddress(listing.address);
        inspector.lat = coords.lat;
        inspector.lng = coords.lng;
        await sleep(100); // Rate limit geocoding
      }
      
      if (!isDuplicate(inspector)) {
        addInspector(inspector);
        inspectors.push(inspector);
      }
    });
    
    log(`Found ${inspectors.length} unique inspectors from Google Maps in ${city}, ${state}`);
    return inspectors;
    
  } catch (error) {
    log(`Error scraping Google Maps for ${city}, ${state}: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

// Scrape Yellow Pages
async function scrapeYellowPages(city, state) {
  try {
    const query = `home+inspector`;
    const location = `${city}+${state}`;
    const url = `https://www.yellowpages.com/search?search_terms=${query}&geo_location_terms=${location}`;
    
    log(`Scraping Yellow Pages: ${city}, ${state}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const inspectors = [];
    
    $('.result, .search-results .result').each((index, element) => {
      if (index > 15) return; // Limit results
      
      const businessName = $(element).find('.business-name span, .business-name a, h3 a').first().text().trim();
      const phone = $(element).find('.phones, .phone').first().text().trim();
      const address = $(element).find('.street-address').first().text().trim();
      const cityStateZip = $(element).find('.locality').first().text().trim();
      const website = $(element).find('.track-visit-website, .website-link').first().attr('href');
      
      if (businessName && businessName.toLowerCase().includes('inspect')) {
        const inspector = {
          business_name: businessName,
          owner_name: null,
          email: null,
          phone: cleanPhone(phone),
          website: cleanWebsite(website),
          address_street: address,
          address_city: city,
          address_state: state,
          address_zip: cityStateZip?.match(/\d{5}(-\d{4})?/)?.[0],
          certifications: extractCertifications(businessName),
          services: ['Home Inspection'],
          years_in_business: null,
          license_number: null
        };
        
        if (!isDuplicate(inspector)) {
          addInspector(inspector);
          inspectors.push(inspector);
        }
      }
    });
    
    log(`Found ${inspectors.length} unique inspectors from Yellow Pages in ${city}, ${state}`);
    await sleep(3000); // Rate limiting
    return inspectors;
    
  } catch (error) {
    log(`Error scraping Yellow Pages for ${city}, ${state}: ${error.message}`);
    return [];
  }
}

// Enhanced HomeAdvisor scraping
async function scrapeHomeAdvisor(city, state) {
  try {
    log(`Scraping HomeAdvisor: ${city}, ${state}`);
    
    const url = `https://www.homeadvisor.com/rated.${city}.${state}.home-inspectors.html`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const inspectors = [];
    
    $('.provider-summary, .pro-card').each((index, element) => {
      if (index > 10) return;
      
      const businessName = $(element).find('.provider-name, .business-name, h3').first().text().trim();
      const phone = $(element).find('.phone-number, .phone').first().text().trim();
      const rating = $(element).find('.rating, .stars').first().text().trim();
      
      if (businessName) {
        const inspector = {
          business_name: businessName,
          owner_name: null,
          email: null,
          phone: cleanPhone(phone),
          website: null,
          address_street: null,
          address_city: city,
          address_state: state,
          address_zip: null,
          certifications: extractCertifications(businessName),
          services: ['Home Inspection'],
          years_in_business: null,
          license_number: null
        };
        
        if (!isDuplicate(inspector)) {
          addInspector(inspector);
          inspectors.push(inspector);
        }
      }
    });
    
    log(`Found ${inspectors.length} unique inspectors from HomeAdvisor in ${city}, ${state}`);
    await sleep(2000);
    return inspectors;
    
  } catch (error) {
    log(`Error scraping HomeAdvisor for ${city}, ${state}: ${error.message}`);
    return [];
  }
}

// Save inspectors to database
async function saveInspectors(inspectors) {
  if (inspectors.length === 0) return;
  
  try {
    const { data, error } = await supabase
      .from('inspectors')
      .insert(inspectors)
      .select();
    
    if (error) throw error;
    
    log(`Successfully saved ${data.length} inspectors to database`);
    totalCollected += data.length;
    
  } catch (error) {
    log(`Error saving inspectors to database: ${error.message}`);
    
    // Try to save individually if batch fails
    let successCount = 0;
    for (const inspector of inspectors) {
      try {
        const { error: individualError } = await supabase
          .from('inspectors')
          .insert([inspector]);
        
        if (!individualError) {
          successCount++;
        } else {
          log(`Failed to save individual inspector: ${inspector.business_name} - ${individualError.message}`);
        }
      } catch (e) {
        log(`Exception saving individual inspector: ${e.message}`);
      }
    }
    
    totalCollected += successCount;
    log(`Saved ${successCount} out of ${inspectors.length} inspectors individually`);
  }
}

// Main scraping function
async function scrapeInspectors() {
  await ensureLogsDir();
  log('Starting comprehensive inspector data collection...');
  
  // Test environment first
  try {
    const testEnv = require('./test-environment');
    const envTest = await testEnv();
    if (!envTest) {
      throw new Error('Environment test failed');
    }
  } catch (error) {
    log(`Environment test failed: ${error.message}`);
    return { success: false, error: 'Environment not configured' };
  }
  
  const batchSize = 25; // Smaller batches for better reliability
  let currentBatch = [];
  
  for (const state of TARGET_STATES) {
    log(`Processing state: ${state}`);
    const cities = PRIORITY_CITIES[state] || [];
    
    for (const city of cities) {
      try {
        log(`Starting collection for ${city}, ${state}`);
        
        // Scrape Google Maps (primary source)
        const googleResults = await scrapeGoogleMaps(city, state);
        currentBatch.push(...googleResults);
        
        // Rate limiting between sources
        await sleep(3000);
        
        // Scrape Yellow Pages (secondary source)
        const yellowPagesResults = await scrapeYellowPages(city, state);
        currentBatch.push(...yellowPagesResults);
        
        await sleep(2000);
        
        // Scrape HomeAdvisor (tertiary source)
        const homeAdvisorResults = await scrapeHomeAdvisor(city, state);
        currentBatch.push(...homeAdvisorResults);
        
        // Save batch if it reaches the batch size
        if (currentBatch.length >= batchSize) {
          await saveInspectors(currentBatch);
          currentBatch = [];
        }
        
        // Rate limiting between cities
        await sleep(5000);
        
        log(`Completed ${city}, ${state}. Total unique inspectors collected: ${collectedInspectors.size}, saved: ${totalCollected}`);
        
        // Stop if we've reached our target
        if (totalCollected >= 1000) {
          log('Reached target of 1000 inspectors');
          break;
        }
        
      } catch (error) {
        log(`Error processing ${city}, ${state}: ${error.message}`);
        await sleep(2000); // Brief pause before continuing
      }
    }
    
    if (totalCollected >= 1000) break;
  }
  
  // Save remaining batch
  if (currentBatch.length > 0) {
    await saveInspectors(currentBatch);
  }
  
  // Final summary
  log(`\n=== SCRAPING COMPLETE ===`);
  log(`Total unique inspectors collected: ${collectedInspectors.size}`);
  log(`Total inspectors saved to database: ${totalCollected}`);
  
  const duplicateRate = collectedInspectors.size > 0 ? 
    ((collectedInspectors.size - totalCollected) / collectedInspectors.size * 100).toFixed(2) : 0;
  log(`Duplicate rate: ${duplicateRate}%`);
  
  // Save collection summary
  const summary = {
    timestamp: new Date().toISOString(),
    totalCollected: totalCollected,
    uniqueInspectors: collectedInspectors.size,
    duplicateRate: parseFloat(duplicateRate),
    statesProcessed: TARGET_STATES.length,
    sources: ['Google Maps', 'Yellow Pages', 'HomeAdvisor'],
    targetReached: totalCollected >= 1000
  };
  
  await fs.writeJson(path.join(__dirname, '..', 'logs', 'scraping-summary.json'), summary, { spaces: 2 });
  
  return {
    success: true,
    totalCollected,
    uniqueInspectors: collectedInspectors.size,
    duplicateRate: parseFloat(duplicateRate)
  };
}

// Export for potential module use
module.exports = {
  scrapeInspectors,
  TARGET_STATES,
  PRIORITY_CITIES
};

// Run if called directly
if (require.main === module) {
  scrapeInspectors().catch(error => {
    log(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}