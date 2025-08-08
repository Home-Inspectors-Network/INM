#!/usr/bin/env node

/**
 * Enhanced Multi-City Enrichment System
 * - Detects service areas and assigns inspectors to multiple cities
 * - Extracts comprehensive modern directory information
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bay Area cities for service area detection
const BAY_AREA_CITIES = [
  'San Francisco', 'Oakland', 'San Jose', 'Palo Alto', 'Berkeley', 'Fremont',
  'Mountain View', 'Hayward', 'Sunnyvale', 'Daly City', 'Santa Clara',
  'Redwood City', 'San Mateo', 'Richmond', 'Concord', 'Vallejo', 'Livermore',
  'Union City', 'Pittsburg', 'Castro Valley', 'San Bruno', 'San Rafael',
  'Milpitas', 'Alameda', 'Burlingame', 'Foster City', 'Menlo Park'
];

// Counties for broader service area detection
const BAY_AREA_COUNTIES = [
  'Alameda County', 'Santa Clara County', 'San Mateo County', 
  'Contra Costa County', 'Marin County', 'Solano County', 
  'San Francisco County', 'Napa County', 'Sonoma County'
];

class EnhancedMultiCityEnricher {
  constructor() {
    this.results = {
      processed: 0,
      multi_city_assignments: 0,
      enriched_features: 0,
      errors: []
    };
  }

  async enrichInspector(inspector) {
    console.log(`\\n🔍 ENRICHING: ${inspector.business_name}`);
    console.log(`🌐 Website: ${inspector.website}`);

    try {
      // Step 1: Get main website content
      const mainContent = await this.scrapeWebsite(inspector.website);
      
      // Step 2: Detect and scrape service area pages
      const serviceAreas = await this.detectServiceAreas(inspector.website, mainContent);
      
      // Step 3: Extract comprehensive business data
      const businessData = await this.extractComprehensiveData(inspector.website, mainContent);
      
      // Step 4: Assign to multiple cities based on service areas
      const cityAssignments = this.determineCityAssignments(inspector, serviceAreas);
      
      // Step 5: Store enriched data and multi-city assignments
      await this.storeEnrichedInspector(inspector, businessData, cityAssignments);
      
      console.log(`  ✅ Enriched with ${Object.keys(businessData).length} data points`);
      console.log(`  🏙️  Assigned to ${cityAssignments.length} cities: ${cityAssignments.join(', ')}`);
      
      this.results.processed++;
      this.results.multi_city_assignments += cityAssignments.length - 1; // -1 for original city
      this.results.enriched_features += Object.keys(businessData).length;
      
    } catch (error) {
      console.error(`  ❌ Enrichment failed: ${error.message}`);
      this.results.errors.push({
        inspector: inspector.business_name,
        error: error.message
      });
    }
  }

  async scrapeWebsite(url) {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return cheerio.load(response.data);
  }

  async detectServiceAreas(baseUrl, $) {
    console.log(`  🗺️  Detecting service areas...`);
    
    const serviceAreaData = {
      cities: new Set(),
      counties: new Set(),
      pages_found: []
    };

    // 1. Look for service area links on main page
    const serviceAreaLinks = this.findServiceAreaLinks($, baseUrl);
    
    // 2. Check main page content for city mentions
    this.extractCitiesFromContent($, serviceAreaData);
    
    // 3. Scrape dedicated service area pages
    for (const link of serviceAreaLinks) {
      try {
        console.log(`    🔗 Checking: ${link}`);
        const $servicePage = await this.scrapeWebsite(link);
        this.extractCitiesFromContent($servicePage, serviceAreaData);
        serviceAreaData.pages_found.push(link);
      } catch (error) {
        console.log(`    ⚠️  Failed to scrape ${link}: ${error.message}`);
      }
    }

    console.log(`    📍 Found cities: ${Array.from(serviceAreaData.cities).join(', ')}`);
    console.log(`    🏛️  Found counties: ${Array.from(serviceAreaData.counties).join(', ')}`);
    
    return serviceAreaData;
  }

  findServiceAreaLinks($, baseUrl) {
    const links = [];
    const patterns = [
      /service.area/i, /areas?.we.serve/i, /coverage/i, /locations/i,
      /cities.served/i, /our.service.area/i, /where.we.work/i
    ];

    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().toLowerCase();
      
      // Check if link text or href matches service area patterns
      if (patterns.some(pattern => pattern.test(text) || pattern.test(href))) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        links.push(fullUrl);
      }
    });

    return [...new Set(links)]; // Remove duplicates
  }

  extractCitiesFromContent($, serviceAreaData) {
    const content = $('body').text().toLowerCase();
    
    // Find Bay Area cities mentioned in content
    BAY_AREA_CITIES.forEach(city => {
      const cityLower = city.toLowerCase();
      if (content.includes(cityLower)) {
        serviceAreaData.cities.add(city);
      }
    });

    // Find counties mentioned
    BAY_AREA_COUNTIES.forEach(county => {
      const countyLower = county.toLowerCase();
      if (content.includes(countyLower)) {
        serviceAreaData.counties.add(county);
        
        // Add all cities in that county
        this.addCitiesForCounty(county, serviceAreaData.cities);
      }
    });
  }

  addCitiesForCounty(county, citiesSet) {
    const cityByCounty = {
      'Alameda County': ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Union City', 'Alameda'],
      'Santa Clara County': ['San Jose', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'Santa Clara'],
      'San Mateo County': ['Daly City', 'Redwood City', 'San Mateo', 'Burlingame', 'Foster City'],
      'Contra Costa County': ['Concord', 'Richmond', 'Pittsburg', 'Castro Valley'],
      'Marin County': ['San Rafael'],
      'Solano County': ['Vallejo'],
      'San Francisco County': ['San Francisco']
    };

    if (cityByCounty[county]) {
      cityByCounty[county].forEach(city => citiesSet.add(city));
    }
  }

  async extractComprehensiveData(url, $) {
    console.log(`  📊 Extracting comprehensive business data...`);
    
    const data = {};

    try {
      // Business Hours
      data.business_hours = this.extractBusinessHours($);
      
      // Social Media Links
      data.social_media = this.extractSocialMedia($);
      
      // Blog Posts / Recent Content
      data.recent_content = await this.extractRecentContent($, url);
      
      // Contact Methods
      data.contact_methods = this.extractContactMethods($);
      
      // Professional Credentials
      data.credentials = this.extractCredentials($);
      
      // Service Information
      data.detailed_services = this.extractDetailedServices($);
      
      // Technology Features
      data.tech_features = this.extractTechFeatures($);
      
      // Media Content
      data.media_content = this.extractMediaContent($);
      
      // Awards and Recognition
      data.awards = this.extractAwards($);
      
      // Team Information
      data.team_info = this.extractTeamInfo($);

    } catch (error) {
      console.log(`    ⚠️  Partial data extraction: ${error.message}`);
    }

    return data;
  }

  extractBusinessHours($) {
    const hours = {};
    const text = $('body').text();
    
    // Look for common hour patterns
    const hourPatterns = [
      /monday?.*?(\d{1,2}:\d{2}\s*[ap]m.*?\d{1,2}:\d{2}\s*[ap]m)/i,
      /hours?:?\s*([^\\n]+)/i,
      /open:?\s*([^\\n]+)/i
    ];

    hourPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        hours.raw_text = match[1];
      }
    });

    return Object.keys(hours).length > 0 ? hours : null;
  }

  extractSocialMedia($) {
    const social = {};
    
    $('a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="twitter.com"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href.includes('facebook.com')) social.facebook = href;
      if (href.includes('linkedin.com')) social.linkedin = href;
      if (href.includes('instagram.com')) social.instagram = href;
      if (href.includes('youtube.com')) social.youtube = href;
      if (href.includes('twitter.com')) social.twitter = href;
    });

    return Object.keys(social).length > 0 ? social : null;
  }

  async extractRecentContent($, baseUrl) {
    const content = [];
    
    // Look for blog links, news, recent posts
    $('a[href*="blog"], a[href*="news"], a[href*="articles"]').each((i, elem) => {
      if (i < 5) { // Limit to 5 recent items
        const href = $(elem).attr('href');
        const title = $(elem).text().trim();
        
        if (title && href) {
          content.push({
            title,
            url: href.startsWith('http') ? href : new URL(href, baseUrl).href
          });
        }
      }
    });

    return content.length > 0 ? content : null;
  }

  extractContactMethods($) {
    const methods = {};
    const text = $('body').text();
    
    // Email patterns
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) methods.email = emailMatch[1];
    
    // Phone patterns
    const phoneMatch = text.match(/(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
    if (phoneMatch) methods.phone = phoneMatch[1];
    
    // Live chat detection
    if (text.toLowerCase().includes('live chat') || $('[class*="chat"], [id*="chat"]').length > 0) {
      methods.live_chat = true;
    }

    return Object.keys(methods).length > 0 ? methods : null;
  }

  extractCredentials($) {
    const credentials = [];
    const text = $('body').text();
    
    // Look for certifications
    const certPatterns = [
      /ASHI/i, /InterNACHI/i, /NAHI/i, /CREIA/i, /AHIT/i, /CSLB/i,
      /licensed/i, /certified/i, /insured/i, /bonded/i
    ];

    certPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        credentials.push(pattern.source.replace(/[^a-zA-Z]/g, ''));
      }
    });

    return credentials.length > 0 ? credentials : null;
  }

  extractDetailedServices($) {
    const services = [];
    const text = $('body').text().toLowerCase();
    
    // Service keywords to look for
    const serviceKeywords = [
      'home inspection', 'property inspection', 'residential inspection',
      'termite inspection', 'pest inspection', 'mold inspection',
      'radon testing', 'foundation inspection', 'pool inspection',
      'commercial inspection', 'new construction', 'thermal imaging'
    ];

    serviceKeywords.forEach(service => {
      if (text.includes(service)) {
        services.push({
          name: service,
          found_on_site: true
        });
      }
    });

    return services.length > 0 ? services : null;
  }

  extractTechFeatures($) {
    const features = [];
    const text = $('body').text().toLowerCase();
    
    // Technology feature keywords
    if (text.includes('online booking') || text.includes('schedule online')) {
      features.push('online_booking');
    }
    if (text.includes('digital report') || text.includes('pdf report')) {
      features.push('digital_reports');
    }
    if (text.includes('mobile app') || text.includes('app available')) {
      features.push('mobile_app');
    }

    return features.length > 0 ? features : null;
  }

  extractMediaContent($) {
    const media = {
      images: $('img').length,
      videos: $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length
    };

    return (media.images > 0 || media.videos > 0) ? media : null;
  }

  extractAwards($) {
    const text = $('body').text().toLowerCase();
    const awards = [];
    
    if (text.includes('award') || text.includes('recognition')) {
      awards.push('industry_recognition');
    }
    if (text.includes('bbb') || text.includes('better business bureau')) {
      awards.push('bbb_accredited');
    }

    return awards.length > 0 ? awards : null;
  }

  extractTeamInfo($) {
    const text = $('body').text().toLowerCase();
    const team = {};
    
    if (text.includes('about us') || text.includes('our team')) {
      team.has_team_info = true;
    }
    if (text.includes('owner') || text.includes('founded')) {
      team.has_owner_info = true;
    }

    return Object.keys(team).length > 0 ? team : null;
  }

  determineCityAssignments(inspector, serviceAreas) {
    const cities = new Set();
    
    // Always include the inspector's primary city
    cities.add(inspector.city);
    
    // Add cities found in service areas
    serviceAreas.cities.forEach(city => cities.add(city));
    
    // If counties are mentioned, add major cities in those counties
    serviceAreas.counties.forEach(county => {
      this.addCitiesForCounty(county, cities);
    });

    return Array.from(cities);
  }

  async storeEnrichedInspector(inspector, businessData, cityAssignments) {
    try {
      // Update main inspector record with enriched data
      const enrichedData = {
        ...businessData,
        service_cities: cityAssignments,
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString()
      };

      await supabase
        .from('inspectors')
        .update(enrichedData)
        .eq('id', inspector.id);

      // Create entries for additional cities (multi-city assignments)
      for (const city of cityAssignments) {
        if (city !== inspector.city) {
          await this.createMultiCityEntry(inspector, businessData, city);
        }
      }

    } catch (error) {
      console.error(`    ❌ Database storage error: ${error.message}`);
      throw error;
    }
  }

  async createMultiCityEntry(originalInspector, businessData, city) {
    const multiCityEntry = {
      ...originalInspector,
      ...businessData,
      city: city,
      is_multi_city_assignment: true,
      original_inspector_id: originalInspector.id,
      created_at: new Date().toISOString()
    };

    delete multiCityEntry.id; // Let database assign new ID

    await supabase
      .from('inspectors')
      .insert(multiCityEntry);

    console.log(`    🏙️  Created entry for ${city}`);
  }
}

// Main execution function
async function runEnhancedEnrichment() {
  console.log('🚀 ENHANCED MULTI-CITY ENRICHMENT STARTING');
  console.log('==========================================\\n');

  const enricher = new EnhancedMultiCityEnricher();

  try {
    // Get inspectors that need enrichment
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .not('website', 'is', null)
      .or('enrichment_status.is.null,enrichment_status.eq.pending')
      .limit(5); // Process in batches

    if (error) {
      console.error('Database error:', error);
      return;
    }

    console.log(`📋 Found ${inspectors.length} inspectors for enrichment\\n`);

    for (const inspector of inspectors) {
      await enricher.enrichInspector(inspector);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Final summary
    console.log(`\\n🎉 ENRICHMENT COMPLETE`);
    console.log(`📊 Processed: ${enricher.results.processed} inspectors`);
    console.log(`🏙️  Multi-city assignments: ${enricher.results.multi_city_assignments}`);
    console.log(`📋 Features extracted: ${enricher.results.enriched_features}`);
    console.log(`❌ Errors: ${enricher.results.errors.length}`);

  } catch (error) {
    console.error('Enrichment failed:', error);
  }
}

if (require.main === module) {
  runEnhancedEnrichment()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { EnhancedMultiCityEnricher, runEnhancedEnrichment };