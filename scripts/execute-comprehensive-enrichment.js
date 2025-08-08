#!/usr/bin/env node

/**
 * Comprehensive Enhanced Multi-City Enrichment System
 * Processes all 97 inspectors with 0/100 quality scores
 * Applies quality scoring and multi-city service area detection
 * Target: 80+ inspectors with excellent scores (85+)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bay Area cities for multi-city assignments
const BAY_AREA_CITIES = [
  'San Francisco', 'Oakland', 'San Jose', 'Palo Alto', 'Berkeley', 'Fremont',
  'Mountain View', 'Hayward', 'Sunnyvale', 'Daly City', 'Santa Clara',
  'Redwood City', 'San Mateo', 'Richmond', 'Concord', 'Vallejo', 'Livermore',
  'Union City', 'Pittsburg', 'Castro Valley', 'San Bruno', 'San Rafael',
  'Milpitas', 'Alameda', 'Burlingame', 'Foster City', 'Menlo Park',
  'Cupertino', 'Los Altos', 'Pacifica', 'Dublin', 'Pleasanton'
];

// Comprehensive service patterns
const SERVICE_PATTERNS = [
  'Pre-Purchase Home Inspection', 'Pre-Listing Home Inspection',
  'New Construction Inspection', 'Radon Testing', 'Mold Inspection',
  'Termite Inspection', 'Septic Inspection', 'Well Water Testing',
  'Thermal Imaging', 'Pool/Spa Inspection', 'Chimney Inspection',
  'Roof Inspection', 'Foundation Inspection', 'HVAC Inspection',
  'Electrical Inspection', 'Plumbing Inspection', 'Asbestos Testing',
  'Lead Paint Testing', 'Energy Audit', '203k Consultation',
  'Commercial Inspection', 'Multi-Family Inspection', 'Condo Inspection',
  'Move-In Inspection', 'Warranty Inspection', 'Insurance Inspection'
];

// Logging setup
const logFile = path.join(__dirname, '..', 'logs', 'comprehensive-enrichment.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

class ComprehensiveEnrichmentSystem {
  constructor() {
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      multi_city_assignments: 0,
      quality_scores: [],
      errors: []
    };
    this.retryDelay = 3000; // 3 seconds between requests
  }

  // Enhanced quality scoring system (100 points total)
  calculateQualityScore(inspector) {
    let score = 0;
    
    // Complete profile: 20 points
    if (inspector.business_name && inspector.phone && inspector.address_city && inspector.address_state) {
      score += 20;
    }
    
    // Website with enrichment: 25 points
    if (inspector.website && inspector.enrichment_status === 'completed') {
      score += 25;
    }
    
    // Professional credentials: 15 points
    if (inspector.certifications && inspector.certifications.length > 0) {
      score += Math.min(inspector.certifications.length * 5, 15);
    }
    
    // Detailed services: 20 points
    if (inspector.detailed_services && inspector.detailed_services.length >= 5) {
      score += 20;
    } else if (inspector.detailed_services && inspector.detailed_services.length > 0) {
      score += 15;
    }
    
    // Logo and branding: 10 points
    if (inspector.logo_url) {
      score += 10;
    }
    
    // Business hours and availability: 5 points
    if (inspector.business_hours && Object.keys(inspector.business_hours).length > 0) {
      score += 5;
    }
    
    // Social media presence: 5 points
    if (inspector.social_media && Object.keys(inspector.social_media).length > 0) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  // Enhanced website scraping with error handling
  async scrapeWebsite(url) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InspectorsNearMe-Bot/2.0; +https://inspectorsnearme.com)'
        },
        validateStatus: (status) => status < 500 // Accept redirects and 4xx errors
      });

      return {
        success: true,
        $: cheerio.load(response.data),
        content: response.data
      };
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { success: false, error: 'Website not accessible' };
      }
      if (error.message.includes('certificate') || error.message.includes('SSL')) {
        // Try without SSL verification
        try {
          const response = await axios.get(url, {
            timeout: 15000,
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; InspectorsNearMe-Bot/2.0)'
            }
          });
          return {
            success: true,
            $: cheerio.load(response.data),
            content: response.data
          };
        } catch (sslError) {
          return { success: false, error: 'SSL certificate issues' };
        }
      }
      return { success: false, error: error.message };
    }
  }

  // Extract logo with multiple fallback strategies
  extractLogo($, baseUrl) {
    const logoSelectors = [
      'img[alt*="logo" i]', 'img[src*="logo" i]', 'img[class*="logo" i]',
      '.logo img', '#logo img', '.brand img', '.navbar-brand img',
      'header img:first-of-type', '.site-logo img', '.header-logo img',
      '[class*="brand"] img', '[id*="brand"] img'
    ];

    for (const selector of logoSelectors) {
      const img = $(selector).first();
      if (img.length) {
        const src = img.attr('src');
        if (src) {
          const normalizedUrl = this.normalizeUrl(src, baseUrl);
          if (normalizedUrl) {
            log(`    🎨 Found logo: ${normalizedUrl}`);
            return normalizedUrl;
          }
        }
      }
    }

    return null;
  }

  // Enhanced service extraction with pricing and descriptions
  extractDetailedServices($, content) {
    const services = [];
    const serviceText = content.toLowerCase();

    SERVICE_PATTERNS.forEach(servicePattern => {
      const pattern = new RegExp(servicePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      if (pattern.test(serviceText)) {
        let description = '';
        let priceRange = '';
        
        // Try to extract context around the service
        const serviceSection = $(`*:contains("${servicePattern}")`).first();
        if (serviceSection.length) {
          const contextText = serviceSection.text();
          description = contextText.substring(0, 200).trim();
          
          // Look for price patterns
          const priceMatch = contextText.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/);
          if (priceMatch) {
            priceRange = priceMatch[0];
          }
        }

        services.push({
          name: servicePattern,
          description: description || `Professional ${servicePattern.toLowerCase()} services`,
          price_range: priceRange || 'Contact for pricing',
          found_on_site: true
        });
      }
    });

    return services;
  }

  // Multi-city service area detection
  detectServiceAreas($, content) {
    const serviceCities = new Set();
    const contentLower = content.toLowerCase();

    // Look for service area pages and content
    const serviceAreaIndicators = [
      'service area', 'areas we serve', 'coverage area', 'locations served',
      'cities served', 'service cities', 'where we serve'
    ];

    let hasServiceAreaPage = serviceAreaIndicators.some(indicator => 
      contentLower.includes(indicator)
    );

    // Check for Bay Area cities mentioned in content
    BAY_AREA_CITIES.forEach(city => {
      const cityPattern = new RegExp(`\\b${city.toLowerCase()}\\b`, 'g');
      if (cityPattern.test(contentLower)) {
        serviceCities.add(city);
      }
    });

    // Check for county mentions
    const counties = [
      'alameda county', 'santa clara county', 'san mateo county',
      'contra costa county', 'marin county', 'solano county'
    ];

    counties.forEach(county => {
      if (contentLower.includes(county)) {
        // Add major cities for that county
        this.addCitiesForCounty(county, serviceCities);
      }
    });

    return {
      cities: Array.from(serviceCities),
      hasServiceAreaPage
    };
  }

  addCitiesForCounty(county, citiesSet) {
    const cityByCounty = {
      'alameda county': ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Union City', 'Alameda'],
      'santa clara county': ['San Jose', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'Santa Clara', 'Cupertino'],
      'san mateo county': ['Daly City', 'Redwood City', 'San Mateo', 'Burlingame', 'Foster City', 'Pacifica'],
      'contra costa county': ['Concord', 'Richmond', 'Pittsburg', 'Castro Valley'],
      'marin county': ['San Rafael'],
      'solano county': ['Vallejo']
    };

    if (cityByCounty[county]) {
      cityByCounty[county].forEach(city => citiesSet.add(city));
    }
  }

  // Extract comprehensive business data
  extractBusinessData($, content, baseUrl) {
    const data = {};

    try {
      // Logo
      data.logo_url = this.extractLogo($, baseUrl);
      
      // Company description
      data.company_description = $('meta[name="description"]').attr('content') || 
                                $('.about, .description, .intro').first().text().substring(0, 500).trim();
      
      // Detailed services
      data.detailed_services = this.extractDetailedServices($, content);
      
      // Photo gallery
      data.photo_gallery = this.extractPhotos($, baseUrl);
      
      // Business hours
      data.business_hours = this.extractBusinessHours($, content);
      
      // Social media
      data.social_media = this.extractSocialMedia($, baseUrl);
      
      // Contact methods
      data.contact_methods = this.extractContactMethods($, content);
      
      // Professional credentials
      data.certifications = this.extractCredentials($, content);
      
      // Service areas for multi-city assignments
      const serviceAreas = this.detectServiceAreas($, content);
      data.service_cities = serviceAreas.cities;

    } catch (error) {
      log(`    ⚠️ Partial data extraction error: ${error.message}`);
    }

    return data;
  }

  extractPhotos($, baseUrl) {
    const photos = [];
    const photoSelectors = [
      '.gallery img', '.portfolio img', '.slider img', '.carousel img',
      'img[src*="gallery"]', 'img[src*="work"]', 'img[src*="project"]',
      'img[alt*="inspection"]', 'img[alt*="team"]'
    ];

    photoSelectors.forEach(selector => {
      $(selector).slice(0, 5).each((i, elem) => {
        const src = $(elem).attr('src');
        const alt = $(elem).attr('alt') || '';
        const normalizedUrl = this.normalizeUrl(src, baseUrl);
        
        if (normalizedUrl && !photos.some(p => p.url === normalizedUrl)) {
          photos.push({
            url: normalizedUrl,
            caption: alt.substring(0, 100),
            type: alt.toLowerCase().includes('team') ? 'team' : 'service'
          });
        }
      });
    });

    return photos;
  }

  extractBusinessHours($, content) {
    const hours = {};
    const text = content.toLowerCase();
    
    // Look for hour patterns
    const hourPatterns = [
      /monday.*?(\d{1,2}:\d{2}\s*[ap]m.*?\d{1,2}:\d{2}\s*[ap]m)/i,
      /hours?:?\s*([^\n]{20,100})/i,
      /open:?\s*([^\n]{10,50})/i
    ];

    hourPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && !hours.raw_text) {
        hours.raw_text = match[1];
      }
    });

    // Check for 24/7 or appointment only
    if (text.includes('24/7') || text.includes('24 hours')) {
      hours.type = '24/7';
    } else if (text.includes('by appointment')) {
      hours.type = 'appointment';
    }

    return Object.keys(hours).length > 0 ? hours : null;
  }

  extractSocialMedia($, baseUrl) {
    const social = {};
    const socialSelectors = {
      facebook: 'a[href*="facebook.com"]',
      linkedin: 'a[href*="linkedin.com"]',
      instagram: 'a[href*="instagram.com"]',
      youtube: 'a[href*="youtube.com"]',
      twitter: 'a[href*="twitter.com"]',
      yelp: 'a[href*="yelp.com"]'
    };

    Object.entries(socialSelectors).forEach(([platform, selector]) => {
      const link = $(selector).first();
      if (link.length) {
        social[platform] = link.attr('href');
      }
    });

    return Object.keys(social).length > 0 ? social : null;
  }

  extractContactMethods($, content) {
    const methods = {};
    
    // Email patterns
    const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) methods.email = emailMatch[1];
    
    // Phone patterns  
    const phoneMatch = content.match(/(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
    if (phoneMatch) methods.phone = phoneMatch[1];
    
    // Live chat detection
    if (content.toLowerCase().includes('live chat') || $('[class*="chat"], [id*="chat"]').length > 0) {
      methods.live_chat = true;
    }

    return Object.keys(methods).length > 0 ? methods : null;
  }

  extractCredentials($, content) {
    const credentials = [];
    const text = content.toLowerCase();
    
    const certPatterns = [
      { pattern: /ashi/i, name: 'ASHI' },
      { pattern: /internachi/i, name: 'InterNACHI' },
      { pattern: /nahi/i, name: 'NAHI' },
      { pattern: /creia/i, name: 'CREIA' },
      { pattern: /ahit/i, name: 'AHIT' },
      { pattern: /licensed/i, name: 'Licensed' },
      { pattern: /certified/i, name: 'Certified' },
      { pattern: /insured/i, name: 'Insured' },
      { pattern: /bonded/i, name: 'Bonded' }
    ];

    certPatterns.forEach(cert => {
      if (cert.pattern.test(text)) {
        credentials.push(cert.name);
      }
    });

    return credentials.length > 0 ? credentials : null;
  }

  normalizeUrl(url, baseUrl) {
    try {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      if (url.startsWith('//')) return 'https:' + url;
      if (url.startsWith('/')) return new URL(url, baseUrl).href;
      return new URL(url, baseUrl).href;
    } catch {
      return null;
    }
  }

  // Main enrichment process for a single inspector
  async enrichInspector(inspector) {
    log(`\n🔍 Processing: ${inspector.business_name}`);
    log(`  📍 City: ${inspector.address_city || inspector.city}`);
    log(`  🌐 Website: ${inspector.website}`);

    try {
      // Mark as in progress
      await this.updateInspectorStatus(inspector.id, 'in_progress');

      // Scrape website
      const scrapeResult = await this.scrapeWebsite(inspector.website);
      
      if (!scrapeResult.success) {
        log(`  ❌ Website scraping failed: ${scrapeResult.error}`);
        await this.updateInspectorStatus(inspector.id, 'failed', scrapeResult.error);
        this.stats.failed++;
        return;
      }

      // Extract comprehensive business data
      const businessData = this.extractBusinessData(scrapeResult.$, scrapeResult.content, inspector.website);
      
      // Calculate quality score
      const tempInspector = { ...inspector, ...businessData };
      const qualityScore = this.calculateQualityScore(tempInspector);
      
      // Prepare update data
      const updateData = {
        ...businessData,
        quality_score: qualityScore,
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString(),
        last_enriched_at: new Date().toISOString()
      };

      // Update inspector in database
      const { error } = await supabase
        .from('inspectors')
        .update(updateData)
        .eq('id', inspector.id);

      if (error) {
        log(`  ❌ Database update error: ${error.message}`);
        this.stats.failed++;
        return;
      }

      // Handle multi-city assignments
      if (businessData.service_cities && businessData.service_cities.length > 1) {
        const additionalCities = businessData.service_cities.filter(city => 
          city !== (inspector.address_city || inspector.city)
        );
        this.stats.multi_city_assignments += additionalCities.length;
        
        log(`  🏙️ Multi-city service: ${businessData.service_cities.join(', ')}`);
      }

      // Log success metrics
      const servicesCount = businessData.detailed_services ? businessData.detailed_services.length : 0;
      const photosCount = businessData.photo_gallery ? businessData.photo_gallery.length : 0;
      
      log(`  ✅ SUCCESS - Quality Score: ${qualityScore}/100`);
      log(`  📋 Services: ${servicesCount}, Photos: ${photosCount}`);
      log(`  🎨 Logo: ${businessData.logo_url ? 'Found' : 'Not found'}`);
      
      this.stats.successful++;
      this.stats.quality_scores.push(qualityScore);

    } catch (error) {
      log(`  ❌ Enrichment failed: ${error.message}`);
      await this.updateInspectorStatus(inspector.id, 'failed', error.message);
      this.stats.errors.push({
        inspector: inspector.business_name,
        error: error.message
      });
      this.stats.failed++;
    }

    this.stats.processed++;
  }

  async updateInspectorStatus(inspectorId, status, errorMessage = null) {
    const updateData = {
      enrichment_status: status,
      last_enriched_at: new Date().toISOString()
    };

    if (errorMessage) {
      updateData.enrichment_error = errorMessage;
    }

    await supabase
      .from('inspectors')
      .update(updateData)
      .eq('id', inspectorId);
  }

  // Generate comprehensive summary report
  generateSummaryReport() {
    const avgQualityScore = this.stats.quality_scores.length > 0 
      ? (this.stats.quality_scores.reduce((a, b) => a + b, 0) / this.stats.quality_scores.length).toFixed(1)
      : 0;

    const excellentCount = this.stats.quality_scores.filter(score => score >= 85).length;
    const goodCount = this.stats.quality_scores.filter(score => score >= 70 && score < 85).length;
    const needsImprovementCount = this.stats.quality_scores.filter(score => score < 70).length;

    const report = {
      timestamp: new Date().toISOString(),
      processing_stats: {
        total_processed: this.stats.processed,
        successful_enrichments: this.stats.successful,
        failed_enrichments: this.stats.failed,
        success_rate: `${((this.stats.successful / this.stats.processed) * 100).toFixed(1)}%`
      },
      quality_metrics: {
        average_quality_score: avgQualityScore,
        excellent_scores: excellentCount,
        good_scores: goodCount,
        needs_improvement: needsImprovementCount,
        score_distribution: this.stats.quality_scores.sort((a, b) => b - a)
      },
      multi_city_assignments: this.stats.multi_city_assignments,
      errors: this.stats.errors
    };

    return report;
  }

  // Main execution method
  async execute() {
    log('🚀 COMPREHENSIVE ENRICHMENT SYSTEM STARTING');
    log('===========================================');
    
    try {
      // Ensure logs directory exists
      await fs.ensureDir(path.dirname(logFile));

      // Get inspectors with websites that need enrichment
      const { data: inspectors, error } = await supabase
        .from('inspectors')
        .select('*')
        .not('website', 'is', null)
        .neq('website', '')
        .or('enrichment_status.is.null,enrichment_status.eq.pending,enrichment_status.eq.failed')
        .limit(100); // Process in batches

      if (error) {
        log(`❌ Database error: ${error.message}`);
        return;
      }

      if (inspectors.length === 0) {
        log('✅ No inspectors found that need enrichment');
        return;
      }

      log(`📋 Found ${inspectors.length} inspectors to enrich\n`);

      // Process each inspector
      for (let i = 0; i < inspectors.length; i++) {
        const inspector = inspectors[i];
        log(`\n[${i + 1}/${inspectors.length}] Starting enrichment...`);
        
        await this.enrichInspector(inspector);
        
        // Rate limiting to avoid overwhelming websites
        if (i < inspectors.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }

      // Generate and display final report
      const report = this.generateSummaryReport();
      
      log('\n🎉 ENRICHMENT COMPLETE');
      log('=====================');
      log(`📊 Processed: ${report.processing_stats.total_processed} inspectors`);
      log(`✅ Success Rate: ${report.processing_stats.success_rate}`);
      log(`📈 Average Quality Score: ${report.quality_metrics.average_quality_score}/100`);
      log(`🏆 Excellent Scores (85+): ${report.quality_metrics.excellent_scores}`);
      log(`👍 Good Scores (70-84): ${report.quality_metrics.good_scores}`);
      log(`🔧 Needs Improvement (<70): ${report.quality_metrics.needs_improvement}`);
      log(`🏙️ Multi-city Assignments: ${report.multi_city_assignments}`);
      log(`❌ Errors: ${report.errors.length}`);

      // Save detailed report
      const reportPath = path.join(__dirname, '..', 'logs', 'comprehensive-enrichment-report.json');
      await fs.writeJson(reportPath, report, { spaces: 2 });
      log(`\n📄 Detailed report saved: ${reportPath}`);

      // Check if we met our target
      if (report.quality_metrics.excellent_scores >= 80) {
        log('\n🎯 TARGET ACHIEVED: 80+ inspectors with excellent scores!');
      } else {
        log(`\n⚠️  Target Progress: ${report.quality_metrics.excellent_scores}/80 excellent scores achieved`);
      }

    } catch (error) {
      log(`💥 FATAL ERROR: ${error.message}`);
      throw error;
    }
  }
}

// Execute the comprehensive enrichment system
if (require.main === module) {
  const enrichmentSystem = new ComprehensiveEnrichmentSystem();
  
  enrichmentSystem.execute()
    .then(() => {
      log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { ComprehensiveEnrichmentSystem };