#!/usr/bin/env node

/**
 * Home Inspector Enrichment System
 * Specifically designed to enrich the 200 home inspectors that were just collected
 * Processes inspectors with enrichment_status = 'pending' and inspector_type = 'home'
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

// Bay Area cities for multi-city service area detection
const BAY_AREA_CITIES = [
  'San Francisco', 'Oakland', 'San Jose', 'Palo Alto', 'Berkeley', 'Fremont',
  'Mountain View', 'Hayward', 'Sunnyvale', 'Daly City', 'Santa Clara',
  'Redwood City', 'San Mateo', 'Richmond', 'Concord', 'Vallejo', 'Livermore',
  'Union City', 'Pittsburg', 'Castro Valley', 'San Bruno', 'San Rafael',
  'Milpitas', 'Alameda', 'Burlingame', 'Foster City', 'Menlo Park',
  'Cupertino', 'Los Altos', 'Pacifica', 'Dublin', 'Pleasanton'
];

// Home inspection specific service patterns
const HOME_INSPECTION_SERVICES = [
  'Pre-Purchase Home Inspection', 'Pre-Listing Home Inspection',
  'New Construction Inspection', 'Radon Testing', 'Mold Inspection',
  'Termite Inspection', 'Septic Inspection', 'Well Water Testing',
  'Thermal Imaging', 'Pool/Spa Inspection', 'Chimney Inspection',
  'Roof Inspection', 'Foundation Inspection', 'HVAC Inspection',
  'Electrical Inspection', 'Plumbing Inspection', 'Asbestos Testing',
  'Lead Paint Testing', 'Energy Audit', '203k Consultation',
  'Move-In Inspection', 'Warranty Inspection', 'Insurance Inspection',
  'Annual Home Maintenance Inspection', 'Pre-Renovation Inspection',
  'Four Point Inspection', 'Wind Mitigation Inspection'
];

// Logging setup
const logFile = path.join(__dirname, '..', 'logs', 'home-inspector-enrichment.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

class HomeInspectorEnrichmentSystem {
  constructor() {
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      quality_scores: [],
      enrichedData: {
        withPhone: 0,
        withEmail: 0,
        withWebsite: 0,
        withLogo: 0,
        withServices: 0,
        withCertifications: 0
      }
    };
    this.batchSize = 20;
    this.retryDelay = 2000; // 2 seconds between requests
  }

  // Quality scoring system (100 points total)
  calculateQualityScore(inspector) {
    let score = 0;
    
    // Complete NAP (Name, Address, Phone): 20 points
    if (inspector.business_name && inspector.phone && inspector.address_city && inspector.address_state) {
      score += 20;
    }
    
    // Website with service details: 15 points
    if (inspector.website && inspector.detailed_services && inspector.detailed_services.length > 0) {
      score += 15;
    }
    
    // Verified business category match: 15 points
    if (inspector.inspector_type === 'home' && inspector.categories?.includes('home inspection')) {
      score += 15;
    }
    
    // Professional certifications: 10 points
    if (inspector.certifications && inspector.certifications.length > 0) {
      score += 10;
    }
    
    // Years in business: 10 points
    if (inspector.years_in_business && inspector.years_in_business > 0) {
      score += 10;
    }
    
    // Customer reviews/ratings: 10 points
    if (inspector.rating && inspector.rating >= 4.0 && inspector.review_count > 10) {
      score += 10;
    }
    
    // Detailed service descriptions: 10 points
    if (inspector.detailed_services && inspector.detailed_services.length >= 5) {
      score += 10;
    }
    
    // Photos and visual content: 5 points
    if (inspector.logo_url || (inspector.photo_gallery && inspector.photo_gallery.length > 0)) {
      score += 5;
    }
    
    // Business hours and availability: 5 points
    if (inspector.business_hours && Object.keys(inspector.business_hours).length > 0) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  // Website scraping with enhanced error handling
  async scrapeWebsite(url) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        validateStatus: (status) => status < 500
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
      return { success: false, error: error.message };
    }
  }

  // Extract comprehensive contact information
  extractContactInfo($, content) {
    const contact = {};
    
    // Enhanced phone extraction
    const phonePatterns = [
      /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
      /(\d{3}[-.\s]\d{3}[-.\s]\d{4})/g,
      /(\d{10})/g
    ];
    
    for (const pattern of phonePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Clean and validate phone numbers
        const phone = matches[0].replace(/[^\d]/g, '');
        if (phone.length === 10) {
          contact.phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
          break;
        }
      }
    }
    
    // Enhanced email extraction
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatches = content.match(emailPattern);
    if (emailMatches) {
      // Filter out common non-contact emails
      const validEmail = emailMatches.find(email => 
        !email.includes('example.com') && 
        !email.includes('email.com') &&
        !email.includes('@sentry')
      );
      if (validEmail) {
        contact.email = validEmail.toLowerCase();
      }
    }
    
    // Extract contact form URL
    const contactFormLink = $('a[href*="contact"], a:contains("Contact")').first();
    if (contactFormLink.length) {
      contact.contact_form_url = contactFormLink.attr('href');
    }
    
    return contact;
  }

  // Extract detailed services specific to home inspection
  extractDetailedServices($, content) {
    const services = [];
    const contentLower = content.toLowerCase();
    
    HOME_INSPECTION_SERVICES.forEach(service => {
      const servicePattern = new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      if (servicePattern.test(content)) {
        let description = '';
        let priceRange = '';
        
        // Try to find service descriptions
        const serviceElements = $(`*:contains("${service}")`).filter((i, el) => {
          const text = $(el).text();
          return text.length > service.length && text.length < 500;
        });
        
        if (serviceElements.length > 0) {
          const contextText = serviceElements.first().text().trim();
          description = contextText.substring(0, 200);
          
          // Look for pricing
          const priceMatch = contextText.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/);
          if (priceMatch) {
            priceRange = priceMatch[0];
          }
        }
        
        services.push({
          name: service,
          description: description || `Professional ${service.toLowerCase()} services`,
          price_range: priceRange || 'Contact for pricing',
          category: this.categorizeService(service)
        });
      }
    });
    
    return services;
  }

  categorizeService(serviceName) {
    const categories = {
      'inspection': ['Home Inspection', 'Pre-Purchase', 'Pre-Listing', 'New Construction', 'Move-In', 'Warranty', 'Annual'],
      'environmental': ['Radon', 'Mold', 'Asbestos', 'Lead Paint', 'Well Water'],
      'structural': ['Foundation', 'Roof', 'Chimney'],
      'systems': ['HVAC', 'Electrical', 'Plumbing', 'Septic'],
      'specialty': ['Pool/Spa', 'Thermal Imaging', 'Energy Audit', '203k', 'Four Point', 'Wind Mitigation']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => serviceName.toLowerCase().includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    return 'general';
  }

  // Extract professional credentials and certifications
  extractCredentials($, content) {
    const credentials = [];
    const contentLower = content.toLowerCase();
    
    const certificationPatterns = [
      { pattern: /ASHI\s*(Certified|Member)?/i, name: 'ASHI Certified', full: 'American Society of Home Inspectors' },
      { pattern: /InterNACHI\s*(Certified|Member)?/i, name: 'InterNACHI Certified', full: 'International Association of Certified Home Inspectors' },
      { pattern: /NAHI\s*(Certified|Member)?/i, name: 'NAHI Certified', full: 'National Association of Home Inspectors' },
      { pattern: /CREIA\s*(Certified|Member)?/i, name: 'CREIA Member', full: 'California Real Estate Inspection Association' },
      { pattern: /AHIT\s*(Certified|Graduate)?/i, name: 'AHIT Graduate', full: 'American Home Inspectors Training' },
      { pattern: /Licensed\s+Home\s+Inspector/i, name: 'Licensed Home Inspector' },
      { pattern: /Certified\s+Professional\s+Inspector/i, name: 'Certified Professional Inspector' },
      { pattern: /Master\s+Inspector/i, name: 'Master Inspector' },
      { pattern: /ICC\s*(Certified|Inspector)?/i, name: 'ICC Certified', full: 'International Code Council' },
      { pattern: /NRPP\s*(Certified)?/i, name: 'NRPP Certified', full: 'National Radon Proficiency Program' }
    ];
    
    certificationPatterns.forEach(cert => {
      if (cert.pattern.test(content)) {
        credentials.push({
          name: cert.name,
          full_name: cert.full || cert.name,
          found_in_content: true
        });
      }
    });
    
    // Look for license numbers
    const licenseMatch = content.match(/License\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (licenseMatch) {
      credentials.push({
        name: 'State License',
        number: licenseMatch[1],
        type: 'license'
      });
    }
    
    return credentials;
  }

  // Extract years in business
  extractYearsInBusiness($, content) {
    const patterns = [
      /(\d+)\+?\s*years?\s*(of\s*)?(experience|business|serving)/i,
      /since\s*(\d{4})/i,
      /established\s*(\d{4})/i,
      /founded\s*(\d{4})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        if (match[1].length === 4) {
          // It's a year, calculate years in business
          return new Date().getFullYear() - parseInt(match[1]);
        } else {
          // It's already years
          return parseInt(match[1]);
        }
      }
    }
    
    return null;
  }

  // Extract logo URL
  extractLogo($, baseUrl) {
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[src*="logo" i]',
      'img[class*="logo" i]',
      '.logo img',
      '#logo img',
      '.navbar-brand img',
      '.header img:first-of-type',
      'header img[src*=".png"], header img[src*=".jpg"], header img[src*=".svg"]'
    ];
    
    for (const selector of logoSelectors) {
      const img = $(selector).first();
      if (img.length) {
        const src = img.attr('src');
        if (src && !src.includes('placeholder')) {
          return this.normalizeUrl(src, baseUrl);
        }
      }
    }
    
    return null;
  }

  // Extract business hours
  extractBusinessHours($, content) {
    const hours = {};
    const contentLower = content.toLowerCase();
    
    // Common patterns
    if (contentLower.includes('24/7') || contentLower.includes('24 hours')) {
      hours.type = '24/7';
      hours.always_open = true;
    } else if (contentLower.includes('by appointment')) {
      hours.type = 'By Appointment';
      hours.appointment_only = true;
    } else {
      // Look for specific day/time patterns
      const daysPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:-]+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi;
      const matches = content.match(daysPattern);
      
      if (matches) {
        hours.type = 'Regular Hours';
        hours.schedule = matches.join(', ');
      }
    }
    
    // Emergency availability
    if (contentLower.includes('emergency') && contentLower.includes('available')) {
      hours.emergency_available = true;
    }
    
    return Object.keys(hours).length > 0 ? hours : null;
  }

  // Detect service areas for multi-city assignment
  detectServiceAreas($, content) {
    const serviceCities = new Set();
    const contentLower = content.toLowerCase();
    
    // Look for service area sections
    const serviceAreaSelectors = [
      '*:contains("service area")',
      '*:contains("areas we serve")',
      '*:contains("coverage area")',
      '*:contains("locations")'
    ];
    
    let serviceAreaContent = '';
    for (const selector of serviceAreaSelectors) {
      const element = $(selector).filter((i, el) => {
        const text = $(el).text();
        return text.length > 50 && text.length < 5000;
      }).first();
      
      if (element.length) {
        serviceAreaContent = element.text();
        break;
      }
    }
    
    // Check for Bay Area cities
    const searchContent = serviceAreaContent || contentLower;
    BAY_AREA_CITIES.forEach(city => {
      const cityPattern = new RegExp(`\\b${city.toLowerCase()}\\b`, 'g');
      if (cityPattern.test(searchContent)) {
        serviceCities.add(city);
      }
    });
    
    // Check for county mentions
    const countyMentions = {
      'alameda county': ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Alameda'],
      'santa clara county': ['San Jose', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'Santa Clara'],
      'san mateo county': ['Daly City', 'Redwood City', 'San Mateo', 'Burlingame', 'Foster City'],
      'contra costa county': ['Concord', 'Richmond', 'Pittsburg'],
      'marin county': ['San Rafael'],
      'san francisco county': ['San Francisco']
    };
    
    Object.entries(countyMentions).forEach(([county, cities]) => {
      if (searchContent.includes(county)) {
        cities.forEach(city => serviceCities.add(city));
      }
    });
    
    return Array.from(serviceCities);
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
    try {
      log(`Processing: ${inspector.business_name} (${inspector.city || inspector.address_city})`);
      
      // Skip if no website
      if (!inspector.website) {
        log(`  ⚠️  No website available, limited enrichment`);
        
        // Still calculate quality score with available data
        const qualityScore = this.calculateQualityScore(inspector);
        
        await supabase
          .from('inspectors')
          .update({
            quality_score: qualityScore,
            enrichment_status: 'partial',
            enriched_at: new Date().toISOString()
          })
          .eq('id', inspector.id);
        
        this.stats.successful++;
        this.stats.quality_scores.push(qualityScore);
        return;
      }
      
      // Update status to in_progress
      await supabase
        .from('inspectors')
        .update({ enrichment_status: 'in_progress' })
        .eq('id', inspector.id);
      
      // Scrape website
      const scrapeResult = await this.scrapeWebsite(inspector.website);
      
      if (!scrapeResult.success) {
        log(`  ❌ Website scraping failed: ${scrapeResult.error}`);
        
        await supabase
          .from('inspectors')
          .update({
            enrichment_status: 'failed',
            enrichment_error: scrapeResult.error
          })
          .eq('id', inspector.id);
        
        this.stats.failed++;
        return;
      }
      
      const { $, content } = scrapeResult;
      
      // Extract all enrichment data
      const enrichmentData = {
        // Contact information
        ...this.extractContactInfo($, content),
        
        // Professional details
        certifications: this.extractCredentials($, content),
        years_in_business: this.extractYearsInBusiness($, content),
        
        // Services
        detailed_services: this.extractDetailedServices($, content),
        
        // Visual assets
        logo_url: this.extractLogo($, inspector.website),
        
        // Business intelligence
        business_hours: this.extractBusinessHours($, content),
        
        // Service areas
        service_cities: this.detectServiceAreas($, content),
        
        // Meta information
        company_description: $('meta[name="description"]').attr('content') || 
                           $('.about, .description').first().text().substring(0, 500).trim(),
        
        // Social media
        social_media: {
          facebook: $('a[href*="facebook.com"]').first().attr('href'),
          linkedin: $('a[href*="linkedin.com"]').first().attr('href'),
          yelp: $('a[href*="yelp.com"]').first().attr('href')
        }
      };
      
      // Clean up empty values
      Object.keys(enrichmentData.social_media).forEach(key => {
        if (!enrichmentData.social_media[key]) delete enrichmentData.social_media[key];
      });
      if (Object.keys(enrichmentData.social_media).length === 0) {
        delete enrichmentData.social_media;
      }
      
      // Calculate quality score
      const tempInspector = { ...inspector, ...enrichmentData };
      const qualityScore = this.calculateQualityScore(tempInspector);
      
      // Prepare final update
      const updateData = {
        ...enrichmentData,
        quality_score: qualityScore,
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString(),
        last_enriched_at: new Date().toISOString()
      };
      
      // Update database
      const { error } = await supabase
        .from('inspectors')
        .update(updateData)
        .eq('id', inspector.id);
      
      if (error) {
        log(`  ❌ Database update error: ${error.message}`);
        this.stats.failed++;
        return;
      }
      
      // Update statistics
      this.stats.successful++;
      this.stats.quality_scores.push(qualityScore);
      
      if (enrichmentData.phone) this.stats.enrichedData.withPhone++;
      if (enrichmentData.email) this.stats.enrichedData.withEmail++;
      if (enrichmentData.logo_url) this.stats.enrichedData.withLogo++;
      if (enrichmentData.detailed_services?.length > 0) this.stats.enrichedData.withServices++;
      if (enrichmentData.certifications?.length > 0) this.stats.enrichedData.withCertifications++;
      
      log(`  ✅ SUCCESS - Quality Score: ${qualityScore}/100`);
      log(`  📋 Services: ${enrichmentData.detailed_services?.length || 0}, Certifications: ${enrichmentData.certifications?.length || 0}`);
      
    } catch (error) {
      log(`  ❌ Enrichment error: ${error.message}`);
      
      await supabase
        .from('inspectors')
        .update({
          enrichment_status: 'failed',
          enrichment_error: error.message
        })
        .eq('id', inspector.id);
      
      this.stats.failed++;
    }
  }

  // Process a batch of inspectors
  async processBatch(inspectors) {
    log(`\n📦 Processing batch of ${inspectors.length} inspectors`);
    
    for (let i = 0; i < inspectors.length; i++) {
      await this.enrichInspector(inspectors[i]);
      this.stats.processed++;
      
      // Rate limiting
      if (i < inspectors.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  // Generate progress report
  generateProgressReport() {
    const avgQualityScore = this.stats.quality_scores.length > 0
      ? (this.stats.quality_scores.reduce((a, b) => a + b, 0) / this.stats.quality_scores.length).toFixed(1)
      : 0;
    
    const successRate = this.stats.processed > 0
      ? ((this.stats.successful / this.stats.processed) * 100).toFixed(1)
      : 0;
    
    return {
      timestamp: new Date().toISOString(),
      progress: {
        total_processed: this.stats.processed,
        successful: this.stats.successful,
        failed: this.stats.failed,
        success_rate: `${successRate}%`
      },
      quality_metrics: {
        average_score: avgQualityScore,
        excellent_count: this.stats.quality_scores.filter(s => s >= 85).length,
        good_count: this.stats.quality_scores.filter(s => s >= 70 && s < 85).length,
        needs_improvement: this.stats.quality_scores.filter(s => s < 70).length
      },
      enrichment_coverage: {
        with_phone: this.stats.enrichedData.withPhone,
        with_email: this.stats.enrichedData.withEmail,
        with_website: this.stats.enrichedData.withWebsite,
        with_logo: this.stats.enrichedData.withLogo,
        with_services: this.stats.enrichedData.withServices,
        with_certifications: this.stats.enrichedData.withCertifications
      }
    };
  }

  // Main execution method
  async execute() {
    log('🚀 HOME INSPECTOR ENRICHMENT SYSTEM STARTING');
    log('==========================================');
    
    try {
      // Ensure logs directory exists
      await fs.ensureDir(path.dirname(logFile));
      
      // Get total count of pending home inspectors
      const { count: totalCount } = await supabase
        .from('inspectors')
        .select('*', { count: 'exact', head: true })
        .eq('inspector_type', 'home')
        .eq('enrichment_status', 'pending');
      
      log(`📊 Found ${totalCount} pending home inspectors to enrich`);
      
      if (totalCount === 0) {
        log('✅ No pending home inspectors found');
        return;
      }
      
      // Process in batches
      let offset = 0;
      let batchNumber = 1;
      
      while (offset < totalCount) {
        log(`\n🔄 Loading batch ${batchNumber} (${offset + 1}-${Math.min(offset + this.batchSize, totalCount)} of ${totalCount})`);
        
        // Get batch of inspectors
        const { data: batch, error } = await supabase
          .from('inspectors')
          .select('*')
          .eq('inspector_type', 'home')
          .eq('enrichment_status', 'pending')
          .order('created_at', { ascending: true })
          .range(offset, offset + this.batchSize - 1);
        
        if (error) {
          log(`❌ Database error: ${error.message}`);
          break;
        }
        
        if (batch && batch.length > 0) {
          await this.processBatch(batch);
          
          // Progress report every 40 inspectors
          if (this.stats.processed % 40 === 0 || this.stats.processed === totalCount) {
            const report = this.generateProgressReport();
            log('\n📊 PROGRESS REPORT');
            log('==================');
            log(`Processed: ${report.progress.total_processed}/${totalCount} (${((this.stats.processed/totalCount)*100).toFixed(1)}%)`);
            log(`Success Rate: ${report.progress.success_rate}`);
            log(`Average Quality Score: ${report.quality_metrics.average_score}/100`);
            log(`Excellent Scores: ${report.quality_metrics.excellent_count}`);
            log(`With Phone: ${report.enrichment_coverage.with_phone}`);
            log(`With Email: ${report.enrichment_coverage.with_email}`);
            log(`With Services: ${report.enrichment_coverage.with_services}`);
          }
        }
        
        offset += this.batchSize;
        batchNumber++;
      }
      
      // Final report
      const finalReport = this.generateProgressReport();
      
      log('\n🎉 ENRICHMENT COMPLETE');
      log('====================');
      log(`Total Processed: ${finalReport.progress.total_processed}`);
      log(`Success Rate: ${finalReport.progress.success_rate}`);
      log(`Average Quality Score: ${finalReport.quality_metrics.average_score}/100`);
      log(`\nQuality Distribution:`);
      log(`  🏆 Excellent (85+): ${finalReport.quality_metrics.excellent_count}`);
      log(`  👍 Good (70-84): ${finalReport.quality_metrics.good_count}`);
      log(`  🔧 Needs Improvement (<70): ${finalReport.quality_metrics.needs_improvement}`);
      log(`\nEnrichment Coverage:`);
      log(`  📞 With Phone: ${finalReport.enrichment_coverage.with_phone}`);
      log(`  📧 With Email: ${finalReport.enrichment_coverage.with_email}`);
      log(`  🎨 With Logo: ${finalReport.enrichment_coverage.with_logo}`);
      log(`  📋 With Services: ${finalReport.enrichment_coverage.with_services}`);
      log(`  🏅 With Certifications: ${finalReport.enrichment_coverage.with_certifications}`);
      
      // Save detailed report
      const reportPath = path.join(__dirname, '..', 'logs', 'home-inspector-enrichment-report.json');
      await fs.writeJson(reportPath, finalReport, { spaces: 2 });
      log(`\n📄 Detailed report saved: ${reportPath}`);
      
      // Success rate evaluation
      const successRate = parseFloat(finalReport.progress.success_rate);
      if (successRate >= 90) {
        log('\n🎯 TARGET ACHIEVED: 90%+ successful enrichment rate!');
      } else {
        log(`\n⚠️  Target Progress: ${successRate}% / 90% success rate`);
      }
      
    } catch (error) {
      log(`💥 FATAL ERROR: ${error.message}`);
      throw error;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const enrichmentSystem = new HomeInspectorEnrichmentSystem();
  
  enrichmentSystem.execute()
    .then(() => {
      log('✅ Enrichment completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Enrichment failed:', error);
      process.exit(1);
    });
}

module.exports = { HomeInspectorEnrichmentSystem };