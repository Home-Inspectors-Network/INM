#!/usr/bin/env node

/**
 * PALO ALTO COMPREHENSIVE ENRICHMENT SYSTEM
 * 
 * Executes enhanced multi-city enrichment for 72 Palo Alto inspectors:
 * - Multi-city service area detection and assignments
 * - Comprehensive modern directory data extraction
 * - Quality scoring and database integration
 * - Professional credentials and certification tracking
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

// Bay Area cities for comprehensive service area detection
const BAY_AREA_CITIES = [
  'San Francisco', 'Oakland', 'San Jose', 'Palo Alto', 'Berkeley', 'Fremont',
  'Mountain View', 'Hayward', 'Sunnyvale', 'Daly City', 'Santa Clara',
  'Redwood City', 'San Mateo', 'Richmond', 'Concord', 'Vallejo', 'Livermore',
  'Union City', 'Pittsburg', 'Castro Valley', 'San Bruno', 'San Rafael',
  'Milpitas', 'Alameda', 'Burlingame', 'Foster City', 'Menlo Park',
  'Cupertino', 'Los Altos', 'Saratoga', 'Campbell', 'Los Gatos', 'Morgan Hill',
  'Belmont', 'San Carlos', 'Half Moon Bay', 'Pacifica', 'Brisbane',
  'South San Francisco', 'Millbrae', 'San Bruno', 'Colma'
];

// Peninsula cities for focused coverage
const PENINSULA_CITIES = [
  'Palo Alto', 'Mountain View', 'Sunnyvale', 'Santa Clara', 'San Jose',
  'Redwood City', 'San Mateo', 'Burlingame', 'Foster City', 'Menlo Park',
  'Cupertino', 'Los Altos', 'Saratoga', 'Campbell', 'Los Gatos',
  'Belmont', 'San Carlos', 'Half Moon Bay', 'Pacifica'
];

class PaloAltoEnhancedEnricher {
  constructor() {
    this.results = {
      processed: 0,
      multi_city_assignments: 0,
      enhanced_features: 0,
      quality_scores: [],
      website_enrichments: 0,
      social_media_found: 0,
      credentials_discovered: 0,
      service_areas_mapped: 0,
      errors: []
    };
    
    this.logFile = `logs/palo-alto-enrichment-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    this.enrichmentData = [];
  }

  async loadPaloAltoInspectors() {
    console.log('📋 Loading Palo Alto inspectors with websites...');
    
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .eq('address_city', 'Palo Alto')
      .not('website', 'is', null)
      .neq('website', '')
      .order('business_name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`  ✓ Found ${inspectors.length} Palo Alto inspectors with websites`);
    return inspectors;
  }

  async enrichInspector(inspector) {
    console.log(`\n🔍 ENRICHING: ${inspector.business_name}`);
    console.log(`🌐 Website: ${inspector.website}`);
    console.log(`📞 Phone: ${inspector.phone || 'N/A'}`);

    const enrichmentRecord = {
      inspector_id: inspector.id,
      business_name: inspector.business_name,
      website: inspector.website,
      original_city: inspector.address_city,
      processing_timestamp: new Date().toISOString(),
      enrichment_data: {},
      quality_score: 0,
      service_cities: [],
      errors: []
    };

    try {
      // Step 1: Scrape website content
      const websiteContent = await this.scrapeWebsite(inspector.website);
      enrichmentRecord.enrichment_data.website_scraped = true;
      
      // Step 2: Detect service areas and multi-city coverage
      const serviceAreas = await this.detectServiceAreas(inspector.website, websiteContent);
      enrichmentRecord.service_cities = this.determineCityAssignments(inspector, serviceAreas);
      
      // Step 3: Extract comprehensive business data
      const businessData = await this.extractComprehensiveData(inspector.website, websiteContent);
      enrichmentRecord.enrichment_data = { ...enrichmentRecord.enrichment_data, ...businessData };
      
      // Step 4: Calculate quality score
      enrichmentRecord.quality_score = this.calculateQualityScore(inspector, businessData);
      
      // Step 5: Store enriched data in database
      await this.storeEnrichedData(inspector, businessData, enrichmentRecord.service_cities);
      
      // Step 6: Create multi-city assignments
      if (enrichmentRecord.service_cities.length > 1) {
        await this.createMultiCityAssignments(inspector, businessData, enrichmentRecord.service_cities);
        this.results.multi_city_assignments += enrichmentRecord.service_cities.length - 1;
      }
      
      // Update statistics
      this.updateStatistics(businessData, enrichmentRecord);
      
      console.log(`  ✅ SUCCESS: ${Object.keys(businessData).length} features extracted`);
      console.log(`  🏙️  Service cities (${enrichmentRecord.service_cities.length}): ${enrichmentRecord.service_cities.join(', ')}`);
      console.log(`  📊 Quality score: ${enrichmentRecord.quality_score}/100`);
      
      this.results.processed++;
      this.enrichmentData.push(enrichmentRecord);
      
    } catch (error) {
      console.error(`  ❌ FAILED: ${error.message}`);
      enrichmentRecord.errors.push(error.message);
      this.results.errors.push({
        inspector: inspector.business_name,
        website: inspector.website,
        error: error.message
      });
    }
  }

  async scrapeWebsite(url) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5
      });
      
      return cheerio.load(response.data);
    } catch (error) {
      throw new Error(`Website scraping failed: ${error.message}`);
    }
  }

  async detectServiceAreas(baseUrl, $) {
    console.log(`  🗺️  Detecting service areas...`);
    
    const serviceAreaData = {
      cities: new Set(),
      counties: new Set(),
      regions: new Set(),
      service_pages: []
    };

    try {
      // 1. Find service area pages
      const serviceLinks = this.findServiceAreaLinks($, baseUrl);
      
      // 2. Extract cities from main page
      this.extractLocationsFromContent($, serviceAreaData);
      
      // 3. Scrape dedicated service area pages
      for (const link of serviceLinks.slice(0, 3)) { // Limit to 3 pages
        try {
          console.log(`    🔗 Checking: ${link}`);
          const $servicePage = await this.scrapeWebsite(link);
          this.extractLocationsFromContent($servicePage, serviceAreaData);
          serviceAreaData.service_pages.push(link);
        } catch (error) {
          console.log(`    ⚠️  Failed to scrape ${link}: ${error.message}`);
        }
      }

      console.log(`    📍 Cities found: ${Array.from(serviceAreaData.cities).join(', ')}`);
      this.results.service_areas_mapped++;
      
    } catch (error) {
      console.log(`    ⚠️  Service area detection partial: ${error.message}`);
    }
    
    return serviceAreaData;
  }

  findServiceAreaLinks($, baseUrl) {
    const links = [];
    const patterns = [
      /service.area/i, /areas?.we.serve/i, /coverage/i, /locations/i,
      /cities.served/i, /service.coverage/i, /where.we.work/i,
      /service.locations/i, /coverage.area/i
    ];

    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().toLowerCase();
      
      if (patterns.some(pattern => pattern.test(text) || pattern.test(href))) {
        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
          links.push(fullUrl);
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });

    return [...new Set(links)];
  }

  extractLocationsFromContent($, serviceAreaData) {
    const content = $('body').text().toLowerCase();
    
    // Find Bay Area cities
    BAY_AREA_CITIES.forEach(city => {
      const cityLower = city.toLowerCase();
      if (content.includes(cityLower)) {
        serviceAreaData.cities.add(city);
      }
    });

    // Find regions and counties
    const regions = ['Bay Area', 'Silicon Valley', 'Peninsula', 'South Bay', 'East Bay'];
    regions.forEach(region => {
      if (content.includes(region.toLowerCase())) {
        serviceAreaData.regions.add(region);
        
        // Add cities based on region
        if (region === 'Peninsula' || region === 'Silicon Valley') {
          PENINSULA_CITIES.forEach(city => serviceAreaData.cities.add(city));
        }
      }
    });
  }

  async extractComprehensiveData(url, $) {
    console.log(`  📊 Extracting comprehensive business data...`);
    
    const data = {};

    try {
      // Business Hours
      data.business_hours = this.extractBusinessHours($);
      
      // Contact Information
      data.contact_info = this.extractContactInfo($);
      
      // Social Media Presence
      data.social_media = this.extractSocialMedia($);
      if (data.social_media) this.results.social_media_found++;
      
      // Professional Credentials
      data.credentials = this.extractCredentials($);
      if (data.credentials && data.credentials.length > 0) this.results.credentials_discovered++;
      
      // Services Offered
      data.services = this.extractServices($);
      
      // Technology Features
      data.tech_features = this.extractTechFeatures($);
      
      // About & Team Information
      data.about_info = this.extractAboutInfo($);
      
      // Media Content
      data.media = this.extractMediaContent($);
      
      // Reviews & Testimonials
      data.reviews_info = this.extractReviewsInfo($);
      
      // Awards & Recognition
      data.awards = this.extractAwards($);
      
      // Insurance & Licensing
      data.insurance_licensing = this.extractInsuranceLicensing($);
      
      // Equipment & Methods
      data.equipment = this.extractEquipment($);
      
      // Educational Content
      data.educational_content = this.extractEducationalContent($, url);

      this.results.enhanced_features += Object.keys(data).filter(key => data[key]).length;
      
    } catch (error) {
      console.log(`    ⚠️  Partial data extraction: ${error.message}`);
    }

    return data;
  }

  extractBusinessHours($) {
    const text = $('body').text();
    const hours = {};
    
    // Look for hours patterns
    const patterns = [
      /hours?:?\s*([^\n\r]{1,200})/i,
      /open:?\s*([^\n\r]{1,100})/i,
      /monday.*?(\d{1,2}:\d{2}.*?\d{1,2}:\d{2})/i
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && !hours.raw_text) {
        hours.raw_text = match[1].trim();
      }
    });

    // Look for specific days
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      const dayPattern = new RegExp(`${day}.*?(\\d{1,2}:\\d{2}.*?\\d{1,2}:\\d{2}|closed)`, 'i');
      const match = text.match(dayPattern);
      if (match) {
        hours[day] = match[1];
      }
    });

    return Object.keys(hours).length > 0 ? hours : null;
  }

  extractContactInfo($) {
    const contact = {};
    const text = $('body').text();
    
    // Email extraction (improved pattern)
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) contact.email = emailMatch[1];
    
    // Phone extraction (multiple patterns)
    const phonePatterns = [
      /(\(\d{3}\)\s*\d{3}-\d{4})/,
      /(\d{3}-\d{3}-\d{4})/,
      /(\d{3}\.\d{3}\.\d{4})/,
      /(\d{10})/
    ];
    
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match && !contact.phone) {
        contact.phone = match[1];
        break;
      }
    }

    // Address extraction
    const addressMatch = text.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Circle|Cir))/i);
    if (addressMatch) contact.address = addressMatch[1];

    return Object.keys(contact).length > 0 ? contact : null;
  }

  extractSocialMedia($) {
    const social = {};
    
    $('a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="twitter.com"], a[href*="yelp.com"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href.includes('facebook.com') && !href.includes('/sharer/')) social.facebook = href;
      if (href.includes('linkedin.com')) social.linkedin = href;
      if (href.includes('instagram.com')) social.instagram = href;
      if (href.includes('youtube.com') && !href.includes('/watch?')) social.youtube = href;
      if (href.includes('twitter.com') && !href.includes('/intent/')) social.twitter = href;
      if (href.includes('yelp.com') && href.includes('/biz/')) social.yelp = href;
    });

    return Object.keys(social).length > 0 ? social : null;
  }

  extractCredentials($) {
    const text = $('body').text();
    const credentials = [];
    
    const certPatterns = [
      { name: 'ASHI', pattern: /ASHI/i },
      { name: 'InterNACHI', pattern: /InterNACHI|NACHI/i },
      { name: 'NAHI', pattern: /NAHI/i },
      { name: 'CREIA', pattern: /CREIA/i },
      { name: 'AHIT', pattern: /AHIT/i },
      { name: 'CSLB', pattern: /CSLB/i },
      { name: 'Licensed', pattern: /licensed/i },
      { name: 'Certified', pattern: /certified/i },
      { name: 'Insured', pattern: /insured/i },
      { name: 'Bonded', pattern: /bonded/i }
    ];

    certPatterns.forEach(cert => {
      if (cert.pattern.test(text)) {
        credentials.push(cert.name);
      }
    });

    return credentials.length > 0 ? [...new Set(credentials)] : null;
  }

  extractServices($) {
    const text = $('body').text().toLowerCase();
    const services = [];
    
    const servicePatterns = [
      'home inspection', 'property inspection', 'residential inspection',
      'termite inspection', 'pest inspection', 'mold inspection',
      'radon testing', 'foundation inspection', 'pool inspection',
      'commercial inspection', 'new construction', 'thermal imaging',
      'roof inspection', 'electrical inspection', 'plumbing inspection',
      'hvac inspection', 'structural inspection', 'chimney inspection'
    ];

    servicePatterns.forEach(service => {
      if (text.includes(service)) {
        services.push(service);
      }
    });

    return services.length > 0 ? services : null;
  }

  extractTechFeatures($) {
    const text = $('body').text().toLowerCase();
    const features = [];
    
    const techKeywords = [
      { name: 'online_booking', patterns: ['online booking', 'schedule online', 'book online'] },
      { name: 'digital_reports', patterns: ['digital report', 'pdf report', 'online report'] },
      { name: 'mobile_app', patterns: ['mobile app', 'app available'] },
      { name: 'thermal_imaging', patterns: ['thermal imaging', 'infrared camera'] },
      { name: 'drone_inspection', patterns: ['drone', 'aerial inspection'] },
      { name: 'moisture_meters', patterns: ['moisture meter', 'moisture detection'] },
      { name: 'gas_detectors', patterns: ['gas detector', 'gas leak'] }
    ];

    techKeywords.forEach(tech => {
      if (tech.patterns.some(pattern => text.includes(pattern))) {
        features.push(tech.name);
      }
    });

    return features.length > 0 ? features : null;
  }

  extractAboutInfo($) {
    const about = {};
    const text = $('body').text();
    
    // Years in business
    const yearsMatch = text.match(/(\d+)\s*years?\s*(of\s*)?experience|(\d+)\s*years?\s*in\s*business/i);
    if (yearsMatch) {
      about.years_experience = parseInt(yearsMatch[1] || yearsMatch[3]);
    }

    // Owner information
    if (text.toLowerCase().includes('owner') || text.toLowerCase().includes('founded')) {
      about.has_owner_info = true;
    }

    // Team size
    const teamMatch = text.match(/team\s*of\s*(\d+)|(\d+)\s*inspectors?/i);
    if (teamMatch) {
      about.team_size = parseInt(teamMatch[1] || teamMatch[2]);
    }

    return Object.keys(about).length > 0 ? about : null;
  }

  extractMediaContent($) {
    const media = {
      images: $('img').length,
      videos: $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
      galleries: $('[class*="gallery"], [class*="photos"]').length
    };

    return (media.images > 0 || media.videos > 0) ? media : null;
  }

  extractReviewsInfo($) {
    const text = $('body').text().toLowerCase();
    const reviews = {};
    
    // Look for review mentions
    if (text.includes('testimonial') || text.includes('review')) {
      reviews.has_testimonials = true;
    }

    // Rating mentions
    const ratingMatch = text.match(/(\d+\.?\d*)\s*star|(\d+\.?\d*)\s*out\s*of\s*5/i);
    if (ratingMatch) {
      reviews.rating_mentioned = parseFloat(ratingMatch[1] || ratingMatch[2]);
    }

    return Object.keys(reviews).length > 0 ? reviews : null;
  }

  extractAwards($) {
    const text = $('body').text().toLowerCase();
    const awards = [];
    
    const awardKeywords = ['award', 'recognition', 'bbb', 'better business bureau', 'accredited', 'certified', 'winner'];
    
    awardKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        awards.push(keyword);
      }
    });

    return awards.length > 0 ? [...new Set(awards)] : null;
  }

  extractInsuranceLicensing($) {
    const text = $('body').text().toLowerCase();
    const insurance = {};
    
    if (text.includes('insured') || text.includes('insurance')) {
      insurance.has_insurance = true;
    }
    
    if (text.includes('licensed') || text.includes('license')) {
      insurance.has_license = true;
    }
    
    if (text.includes('bonded')) {
      insurance.bonded = true;
    }

    // Look for license numbers
    const licenseMatch = text.match(/license\s*#?\s*(\w+\d+)/i);
    if (licenseMatch) {
      insurance.license_number = licenseMatch[1];
    }

    return Object.keys(insurance).length > 0 ? insurance : null;
  }

  extractEquipment($) {
    const text = $('body').text().toLowerCase();
    const equipment = [];
    
    const equipmentKeywords = [
      'thermal camera', 'infrared camera', 'moisture meter', 'gas detector',
      'electrical tester', 'ladder', 'flashlight', 'camera', 'inspection tools'
    ];

    equipmentKeywords.forEach(item => {
      if (text.includes(item)) {
        equipment.push(item);
      }
    });

    return equipment.length > 0 ? equipment : null;
  }

  extractEducationalContent($, baseUrl) {
    const content = [];
    
    // Look for blog, articles, resources
    $('a[href*="blog"], a[href*="article"], a[href*="resource"], a[href*="tip"]').each((i, elem) => {
      if (i < 5) { // Limit to 5 items
        const href = $(elem).attr('href');
        const title = $(elem).text().trim();
        
        if (title && href) {
          try {
            content.push({
              title,
              url: href.startsWith('http') ? href : new URL(href, baseUrl).href
            });
          } catch (e) {
            // Skip invalid URLs
          }
        }
      }
    });

    return content.length > 0 ? content : null;
  }

  determineCityAssignments(inspector, serviceAreas) {
    const cities = new Set();
    
    // Always include primary city
    cities.add(inspector.address_city);
    
    // Add cities from service areas
    serviceAreas.cities.forEach(city => cities.add(city));
    
    // If no specific cities found but Peninsula/Silicon Valley mentioned, add key cities
    if (serviceAreas.regions.has('Peninsula') || serviceAreas.regions.has('Silicon Valley')) {
      PENINSULA_CITIES.forEach(city => cities.add(city));
    }

    return Array.from(cities);
  }

  calculateQualityScore(inspector, businessData) {
    let score = 0;
    
    // Base information (30 points)
    if (inspector.phone) score += 10;
    if (inspector.website) score += 10;
    if (inspector.address_street) score += 10;
    
    // Enhanced data (70 points)
    if (businessData.contact_info?.email) score += 10;
    if (businessData.social_media) score += 10;
    if (businessData.credentials) score += 15;
    if (businessData.business_hours) score += 10;
    if (businessData.services) score += 5;
    if (businessData.tech_features) score += 5;
    if (businessData.insurance_licensing) score += 5;
    if (businessData.media && businessData.media.images > 5) score += 5;
    if (businessData.about_info) score += 5;

    return score;
  }

  updateStatistics(businessData, enrichmentRecord) {
    this.results.quality_scores.push(enrichmentRecord.quality_score);
    if (businessData.contact_info || businessData.social_media || businessData.credentials) {
      this.results.website_enrichments++;
    }
  }

  async storeEnrichedData(inspector, businessData, serviceCities) {
    try {
      const updateData = {
        // Store enriched data as JSONB
        enrichment_data: businessData,
        service_cities: serviceCities,
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString(),
        quality_score: this.calculateQualityScore(inspector, businessData)
      };

      // Update existing fields if we found better data
      if (businessData.contact_info?.email && !inspector.email) {
        updateData.email = businessData.contact_info.email;
      }
      
      if (businessData.contact_info?.phone && !inspector.phone) {
        updateData.phone = businessData.contact_info.phone;
      }

      await supabase
        .from('inspectors')
        .update(updateData)
        .eq('id', inspector.id);

    } catch (error) {
      throw new Error(`Database storage failed: ${error.message}`);
    }
  }

  async createMultiCityAssignments(originalInspector, businessData, cities) {
    const assignments = [];
    
    for (const city of cities) {
      if (city !== originalInspector.address_city) {
        try {
          const multiCityEntry = {
            business_name: originalInspector.business_name,
            owner_name: originalInspector.owner_name,
            email: businessData.contact_info?.email || originalInspector.email,
            phone: originalInspector.phone,
            website: originalInspector.website,
            address_street: originalInspector.address_street,
            address_city: city,
            address_state: originalInspector.address_state,
            address_zip: originalInspector.address_zip,
            lat: originalInspector.lat,
            lng: originalInspector.lng,
            services: originalInspector.services,
            certifications: originalInspector.certifications,
            insurance_verified: originalInspector.insurance_verified,
            rating: originalInspector.rating,
            review_count: originalInspector.review_count,
            years_in_business: originalInspector.years_in_business,
            is_multi_city_assignment: true,
            original_inspector_id: originalInspector.id,
            enrichment_data: businessData,
            service_cities: cities,
            quality_score: this.calculateQualityScore(originalInspector, businessData),
            created_at: new Date().toISOString()
          };

          await supabase
            .from('inspectors')
            .insert(multiCityEntry);

          assignments.push(city);
          console.log(`    🏙️  Created assignment for ${city}`);
          
        } catch (error) {
          console.log(`    ⚠️  Failed to create assignment for ${city}: ${error.message}`);
        }
      }
    }
    
    return assignments;
  }

  async saveResults() {
    const finalResults = {
      metadata: {
        execution_date: new Date().toISOString(),
        total_processed: this.results.processed,
        multi_city_assignments: this.results.multi_city_assignments,
        average_quality_score: this.results.quality_scores.length > 0 
          ? Math.round(this.results.quality_scores.reduce((a, b) => a + b, 0) / this.results.quality_scores.length)
          : 0,
        success_rate: ((this.results.processed / (this.results.processed + this.results.errors.length)) * 100).toFixed(1) + '%'
      },
      statistics: this.results,
      enrichment_records: this.enrichmentData
    };

    await fs.ensureDir('logs');
    await fs.writeJson(this.logFile, finalResults, { spaces: 2 });
    
    console.log(`\n📁 Results saved to: ${this.logFile}`);
    return finalResults;
  }
}

// Main execution function
async function runPaloAltoEnrichment() {
  console.log('🚀 PALO ALTO ENHANCED ENRICHMENT SYSTEM');
  console.log('==========================================');
  console.log('Target: 72 Palo Alto inspectors with websites');
  console.log('Scope: Multi-city assignments + comprehensive enrichment\n');

  const enricher = new PaloAltoEnhancedEnricher();

  try {
    // Load Palo Alto inspectors
    const inspectors = await enricher.loadPaloAltoInspectors();
    
    if (inspectors.length === 0) {
      console.log('❌ No Palo Alto inspectors found with websites');
      return;
    }

    console.log(`\n📋 Processing ${inspectors.length} inspectors...\n`);

    // Process each inspector
    for (let i = 0; i < inspectors.length; i++) {
      const inspector = inspectors[i];
      
      console.log(`\n[${i + 1}/${inspectors.length}] Processing: ${inspector.business_name}`);
      
      await enricher.enrichInspector(inspector);
      
      // Rate limiting - 3 second delay between requests
      if (i < inspectors.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Save results and generate summary
    const results = await enricher.saveResults();
    
    console.log('\n🎉 PALO ALTO ENRICHMENT COMPLETE');
    console.log('=================================');
    console.log(`📊 Processed: ${results.metadata.total_processed} inspectors`);
    console.log(`🏙️  Multi-city assignments: ${results.metadata.multi_city_assignments}`);
    console.log(`⭐ Average quality score: ${results.metadata.average_quality_score}/100`);
    console.log(`✅ Success rate: ${results.metadata.success_rate}`);
    console.log(`🌐 Website enrichments: ${enricher.results.website_enrichments}`);
    console.log(`📱 Social media found: ${enricher.results.social_media_found}`);
    console.log(`🏆 Credentials discovered: ${enricher.results.credentials_discovered}`);
    console.log(`🗺️  Service areas mapped: ${enricher.results.service_areas_mapped}`);
    
    if (enricher.results.errors.length > 0) {
      console.log(`\n⚠️  Errors (${enricher.results.errors.length}):`);
      enricher.results.errors.forEach(error => {
        console.log(`  - ${error.inspector}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Enrichment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runPaloAltoEnrichment()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { PaloAltoEnhancedEnricher, runPaloAltoEnrichment };