#!/usr/bin/env node

/**
 * Bay Area Inspector Enrichment Pipeline
 * Processes newly discovered inspectors for complete data enrichment
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');
const { enrichInspectors, testEnrichment } = require('./enrich-inspector-data');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Logging
const logFile = path.join(__dirname, '..', 'logs', 'bay-area-enrichment.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Load discovered inspectors from JSON files
async function loadDiscoveredInspectors() {
  const logsDir = path.join(__dirname, '..', 'logs');
  const inspectorFiles = [
    'san-jose-inspectors-phase3-2025-07-28.json',
    'oakland-inspectors-phase2-2025-07-28T08-16-17-386Z.json'
  ];
  
  let allInspectors = [];
  
  for (const filename of inspectorFiles) {
    const filePath = path.join(logsDir, filename);
    
    if (await fs.pathExists(filePath)) {
      log(`Loading inspectors from ${filename}`);
      const data = await fs.readJson(filePath);
      const inspectors = data.inspectors || [];
      allInspectors.push(...inspectors);
      log(`  Loaded ${inspectors.length} inspectors`);
    }
  }
  
  // Remove duplicates based on phone number
  const uniqueInspectors = [];
  const seenPhones = new Set();
  
  for (const inspector of allInspectors) {
    const phoneKey = inspector.phone?.replace(/[^\d]/g, '') || inspector.business_name;
    if (!seenPhones.has(phoneKey)) {
      seenPhones.add(phoneKey);
      uniqueInspectors.push(inspector);
    }
  }
  
  log(`Total unique inspectors to process: ${uniqueInspectors.length}`);
  return uniqueInspectors;
}

// Insert inspectors into database
async function insertInspectorsToDatabase(inspectors) {
  log('🗄️ Inserting inspectors into database...');
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const inspector of inspectors) {
    try {
      // Check if inspector already exists
      const { data: existing, error: searchError } = await supabase
        .from('inspectors')
        .select('id')
        .or(`phone.eq.${inspector.phone},business_name.eq.${inspector.business_name}`)
        .limit(1);
      
      if (searchError) {
        log(`  Search error for ${inspector.business_name}: ${searchError.message}`);
        errors++;
        continue;
      }
      
      if (existing && existing.length > 0) {
        log(`  ⏭️ Skipping existing inspector: ${inspector.business_name}`);
        skipped++;
        continue;
      }
      
      // Prepare inspector data for database
      const dbInspector = {
        business_name: inspector.business_name,
        owner_name: inspector.owner_name || null,
        phone: inspector.phone || null,
        email: inspector.email || null,
        website: inspector.website || null,
        address_street: inspector.address_street || null,
        address_city: inspector.address_city || null,
        address_state: inspector.address_state || 'CA',
        address_zip: inspector.address_zip || null,
        lat: inspector.lat || null,
        lng: inspector.lng || null,
        google_place_id: inspector.google_place_id || null,
        google_rating: inspector.google_rating || null,
        google_reviews_count: inspector.google_reviews_count || null,
        certifications: inspector.certifications || [],
        services: inspector.services || [],
        business_status: inspector.business_status || 'OPERATIONAL',
        data_source: inspector.data_source || 'Bay Area Discovery',
        search_phase: inspector.search_phase || 'Bay Area Phase',
        created_at: new Date().toISOString(),
        enrichment_status: inspector.website ? 'pending' : 'no_website'
      };
      
      const { error } = await supabase
        .from('inspectors')
        .insert(dbInspector);
      
      if (error) {
        log(`  ❌ Insert error for ${inspector.business_name}: ${error.message}`);
        errors++;
      } else {
        log(`  ✅ Inserted: ${inspector.business_name}`);
        inserted++;
      }
      
    } catch (error) {
      log(`  ❌ Fatal error for ${inspector.business_name}: ${error.message}`);
      errors++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  log(`\n📊 Database Insertion Summary:`);
  log(`✅ Inserted: ${inserted}`);
  log(`⏭️ Skipped (existing): ${skipped}`);
  log(`❌ Errors: ${errors}`);
  
  return { inserted, skipped, errors };
}

// Get inspectors ready for enrichment
async function getInspectorsForEnrichment() {
  const { data: inspectors, error } = await supabase
    .from('inspectors')
    .select('*')
    .neq('website', null)
    .neq('website', '')
    .in('enrichment_status', ['pending', 'failed', null])
    .or('search_phase.like.%Bay Area%,data_source.like.%Bay Area%')
    .order('google_reviews_count', { ascending: false }); // Prioritize high-review inspectors
  
  if (error) {
    log(`Error fetching inspectors for enrichment: ${error.message}`);
    return [];
  }
  
  return inspectors || [];
}

// Enhanced enrichment with retry logic
async function enrichInspectorWithRetry(inspector, maxRetries = 2) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      log(`  📍 Attempt ${attempt + 1}/${maxRetries} for ${inspector.business_name}`);
      
      // Mark as in progress
      await supabase
        .from('inspectors')
        .update({ 
          enrichment_status: 'in_progress',
          last_enriched_at: new Date().toISOString() 
        })
        .eq('id', inspector.id);
      
      // Use existing enrichment function
      const enrichmentData = await enrichInspectorData(inspector);
      
      if (enrichmentData && enrichmentData.enrichment_status === 'completed') {
        // Update database with enriched data
        const { error } = await supabase
          .from('inspectors')
          .update(enrichmentData)
          .eq('id', inspector.id);
        
        if (error) {
          log(`  ❌ Database update error: ${error.message}`);
          return false;
        }
        
        log(`  ✅ Successfully enriched: ${inspector.business_name}`);
        log(`    - Logo: ${enrichmentData.logo_url ? '✓' : '✗'}`);
        log(`    - Services: ${enrichmentData.detailed_services?.length || 0}`);
        log(`    - Photos: ${enrichmentData.photo_gallery?.length || 0}`);
        
        return true;
      }
      
    } catch (error) {
      log(`  ⚠️ Attempt ${attempt + 1} failed: ${error.message}`);
      attempt++;
      
      if (attempt >= maxRetries) {
        // Mark as failed
        await supabase
          .from('inspectors')
          .update({ 
            enrichment_status: 'failed',
            enrichment_error: error.message,
            last_enriched_at: new Date().toISOString()
          })
          .eq('id', inspector.id);
        
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return false;
}

// Import enrichment logic from existing script
async function enrichInspectorData(inspector) {
  if (!inspector.website) {
    return {
      enrichment_status: 'no_website',
      last_enriched_at: new Date().toISOString()
    };
  }

  try {
    const axios = require('axios');
    const cheerio = require('cheerio');
    
    log(`  🌐 Scraping website: ${inspector.website}`);
    
    const response = await axios.get(inspector.website, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InspectorsNearMe-Bot/1.0; +https://inspectorsnearme.com/bot)'
      },
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const content = $.text();
    const baseUrl = inspector.website;

    // Extract logo
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[src*="logo" i]',
      'img[class*="logo" i]',
      '.logo img',
      '#logo img',
      'header img:first-of-type',
      '.navbar-brand img',
      '.site-logo img'
    ];

    let logo_url = null;
    for (const selector of logoSelectors) {
      const img = $(selector).first();
      if (img.length) {
        const src = img.attr('src');
        const normalizedUrl = normalizeUrl(src, baseUrl);
        if (normalizedUrl) {
          logo_url = normalizedUrl;
          break;
        }
      }
    }

    // Extract services
    const COMMON_SERVICES = [
      'Pre-Purchase Home Inspection',
      'Pre-Listing Home Inspection', 
      'New Construction Inspection',
      'Radon Testing',
      'Mold Inspection',
      'Termite Inspection',
      'Septic Inspection',
      'Well Water Testing',
      'Thermal Imaging',
      'Pool/Spa Inspection',
      'Chimney Inspection',
      'Roof Inspection',
      'Foundation Inspection',
      'HVAC Inspection',
      'Electrical Inspection',
      'Plumbing Inspection'
    ];

    const services = [];
    const serviceText = content.toLowerCase();
    
    COMMON_SERVICES.forEach(service => {
      const servicePattern = new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (servicePattern.test(serviceText)) {
        services.push({
          name: service,
          description: `Professional ${service.toLowerCase()} services`,
          price_range: 'Contact for pricing',
          found_on_site: true
        });
      }
    });

    // Extract photos
    const photos = [];
    const photoSelectors = [
      '.gallery img',
      '.portfolio img',
      '.slider img',
      'img[src*="gallery"]',
      'img[alt*="inspection"]'
    ];

    photoSelectors.forEach(selector => {
      $(selector).each((i, elem) => {
        if (photos.length >= 10) return; // Limit to 10 photos
        
        const src = $(elem).attr('src');
        const alt = $(elem).attr('alt') || '';
        const normalizedUrl = normalizeUrl(src, baseUrl);
        
        if (normalizedUrl && !photos.some(p => p.url === normalizedUrl)) {
          photos.push({
            url: normalizedUrl,
            caption: alt.substring(0, 100),
            type: alt.toLowerCase().includes('team') ? 'team' : 'service'
          });
        }
      });
    });

    // Extract business hours
    const businessHours = {};
    if (content.toLowerCase().includes('24/7')) {
      businessHours.type = '24/7';
      businessHours.note = 'Available 24/7';
    } else if (content.toLowerCase().includes('by appointment')) {
      businessHours.type = 'appointment';
      businessHours.note = 'By appointment only';
    }

    // Extract social media
    const social = {};
    const socialSelectors = {
      facebook: 'a[href*="facebook.com"]',
      twitter: 'a[href*="twitter.com"]',
      linkedin: 'a[href*="linkedin.com"]',
      instagram: 'a[href*="instagram.com"]',
      yelp: 'a[href*="yelp.com"]'
    };

    Object.entries(socialSelectors).forEach(([platform, selector]) => {
      const link = $(selector).first();
      if (link.length) {
        social[platform] = link.attr('href');
      }
    });

    return {
      logo_url,
      company_description: $('meta[name="description"]').attr('content') || 
                          $('.about, .description, .intro').first().text().substring(0, 500).trim(),
      detailed_services: services,
      photo_gallery: photos,
      business_hours: businessHours,
      social_media: social,
      last_enriched_at: new Date().toISOString(),
      enrichment_status: 'completed'
    };

  } catch (error) {
    log(`  ❌ Error scraping ${inspector.website}: ${error.message}`);
    return {
      last_enriched_at: new Date().toISOString(),
      enrichment_status: 'failed',
      enrichment_error: error.message
    };
  }
}

// Helper function to normalize URLs
function normalizeUrl(url, baseUrl) {
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

// Generate enrichment report
async function generateEnrichmentReport() {
  log('📊 Generating enrichment report...');
  
  const { data: allInspectors, error } = await supabase
    .from('inspectors')
    .select('*')
    .or('search_phase.like.%Bay Area%,data_source.like.%Bay Area%');
  
  if (error) {
    log(`Error fetching inspectors for report: ${error.message}`);
    return;
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    total_inspectors: allInspectors.length,
    with_websites: allInspectors.filter(i => i.website).length,
    enrichment_status: {
      completed: allInspectors.filter(i => i.enrichment_status === 'completed').length,
      pending: allInspectors.filter(i => i.enrichment_status === 'pending').length,
      failed: allInspectors.filter(i => i.enrichment_status === 'failed').length,
      no_website: allInspectors.filter(i => i.enrichment_status === 'no_website').length
    },
    quality_metrics: {
      with_logos: allInspectors.filter(i => i.logo_url).length,
      with_detailed_services: allInspectors.filter(i => i.detailed_services && i.detailed_services.length > 0).length,
      with_photos: allInspectors.filter(i => i.photo_gallery && i.photo_gallery.length > 0).length,
      with_social_media: allInspectors.filter(i => i.social_media && Object.keys(i.social_media).length > 0).length
    },
    top_performers: allInspectors
      .filter(i => i.google_rating >= 4.5 && i.google_reviews_count >= 20)
      .sort((a, b) => (b.google_reviews_count || 0) - (a.google_reviews_count || 0))
      .slice(0, 10)
      .map(i => ({
        business_name: i.business_name,
        rating: i.google_rating,
        reviews: i.google_reviews_count,
        website: i.website,
        enrichment_status: i.enrichment_status
      }))
  };
  
  // Calculate success rates
  const withWebsites = report.with_websites;
  const enriched = report.enrichment_status.completed;
  
  report.success_rates = {
    enrichment_rate: withWebsites > 0 ? ((enriched / withWebsites) * 100).toFixed(1) : 0,
    logo_coverage: report.total_inspectors > 0 ? ((report.quality_metrics.with_logos / report.total_inspectors) * 100).toFixed(1) : 0,
    services_coverage: report.total_inspectors > 0 ? ((report.quality_metrics.with_detailed_services / report.total_inspectors) * 100).toFixed(1) : 0
  };
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'logs', 'bay-area-enrichment-report.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });
  
  log(`\n📈 ENRICHMENT REPORT`);
  log(`==================`);
  log(`Total Inspectors: ${report.total_inspectors}`);
  log(`With Websites: ${report.with_websites}`);
  log(`Enrichment Success Rate: ${report.success_rates.enrichment_rate}%`);
  log(`Logo Coverage: ${report.success_rates.logo_coverage}%`);
  log(`Services Coverage: ${report.success_rates.services_coverage}%`);
  log(`\nTop Performers: ${report.top_performers.length}`);
  
  return report;
}

// Main enrichment pipeline
async function runBayAreaEnrichmentPipeline() {
  log('🚀 STARTING BAY AREA ENRICHMENT PIPELINE');
  log('=========================================');
  
  try {
    // Ensure logs directory exists
    await fs.ensureDir(path.dirname(logFile));
    
    // Step 1: Load discovered inspectors
    log('\n📥 STEP 1: Loading discovered inspectors...');
    const discoveredInspectors = await loadDiscoveredInspectors();
    
    if (discoveredInspectors.length === 0) {
      log('No new inspectors found to process');
      return;
    }
    
    // Step 2: Insert into database
    log('\n🗄️ STEP 2: Inserting inspectors into database...');
    const insertResults = await insertInspectorsToDatabase(discoveredInspectors);
    
    // Step 3: Get inspectors ready for enrichment
    log('\n🔍 STEP 3: Fetching inspectors for enrichment...');
    const inspectorsToEnrich = await getInspectorsForEnrichment();
    
    if (inspectorsToEnrich.length === 0) {
      log('No inspectors need enrichment');
      await generateEnrichmentReport();
      return;
    }
    
    log(`Found ${inspectorsToEnrich.length} inspectors ready for enrichment`);
    
    // Step 4: Enrich inspector data
    log('\n🌟 STEP 4: Enriching inspector data...');
    
    let enriched = 0;
    let failed = 0;
    
    for (let i = 0; i < inspectorsToEnrich.length; i++) {
      const inspector = inspectorsToEnrich[i];
      log(`\n${i + 1}/${inspectorsToEnrich.length}: Processing ${inspector.business_name}`);
      
      const success = await enrichInspectorWithRetry(inspector);
      
      if (success) {
        enriched++;
      } else {
        failed++;
      }
      
      // Rate limiting between enrichments
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Step 5: Generate final report
    log('\n📊 STEP 5: Generating final report...');
    const report = await generateEnrichmentReport();
    
    log('\n🎉 ENRICHMENT PIPELINE COMPLETED');
    log('===============================');
    log(`✅ Successfully enriched: ${enriched}`);
    log(`❌ Failed: ${failed}`);
    log(`📍 Total processed: ${inspectorsToEnrich.length}`);
    log(`🎯 Enrichment success rate: ${enriched > 0 ? ((enriched / inspectorsToEnrich.length) * 100).toFixed(1) : 0}%`);
    
    // Check if we met our targets
    const targets = {
      enrichment_rate: 85,
      logo_coverage: 70,
      services_coverage: 80
    };
    
    log('\n🎯 TARGET ACHIEVEMENT:');
    Object.entries(targets).forEach(([metric, target]) => {
      const actual = parseFloat(report.success_rates[metric]);
      const status = actual >= target ? '✅' : '❌';
      log(`${status} ${metric}: ${actual}% (target: ${target}%)`);
    });
    
  } catch (error) {
    log(`❌ FATAL ERROR: ${error.message}`);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'report') {
    generateEnrichmentReport()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Report generation failed:', error);
        process.exit(1);
      });
  } else {
    runBayAreaEnrichmentPipeline()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Enrichment pipeline failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { 
  runBayAreaEnrichmentPipeline,
  loadDiscoveredInspectors,
  insertInspectorsToDatabase,
  generateEnrichmentReport
};