#!/usr/bin/env node

/**
 * Advanced Inspector Data Enrichment Script
 * Scrapes inspector websites for logos, services, photos, and detailed business information
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

// Logging
const logFile = path.join(__dirname, '..', 'logs', 'enrichment.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Common home inspection services to look for
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
  'Plumbing Inspection',
  'Asbestos Testing',
  'Lead Paint Testing',
  'Energy Audit',
  '203k Consultation',
  'Commercial Inspection',
  'Multi-Family Inspection',
  'Condo Inspection',
  'Move-In Inspection',
  'Warranty Inspection'
];

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

// Extract logo from website
function extractLogo($, baseUrl) {
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

  for (const selector of logoSelectors) {
    const img = $(selector).first();
    if (img.length) {
      const src = img.attr('src');
      const normalizedUrl = normalizeUrl(src, baseUrl);
      if (normalizedUrl) {
        log(`  Found logo: ${normalizedUrl}`);
        return normalizedUrl;
      }
    }
  }

  return null;
}

// Extract services from website content
function extractServices($, content) {
  const services = [];
  const serviceText = content.toLowerCase();

  // Look for service sections
  const serviceSections = $([
    'section:contains("services")',
    'div:contains("services")',
    '.services',
    '#services',
    'ul li',
    '.service-item',
    '.service-list li'
  ].join(', '));

  // Check against our known services
  COMMON_SERVICES.forEach(service => {
    const servicePattern = new RegExp(service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    if (servicePattern.test(serviceText)) {
      // Try to find price and description
      let description = '';
      let priceRange = '';
      
      // Look for service-specific content
      serviceSections.each((i, elem) => {
        const text = $(elem).text();
        if (servicePattern.test(text)) {
          description = text.substring(0, 200).trim();
          
          // Look for price patterns
          const priceMatch = text.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/);
          if (priceMatch) {
            priceRange = priceMatch[0];
          }
        }
      });

      services.push({
        name: service,
        description: description || `Professional ${service.toLowerCase()} services`,
        price_range: priceRange || 'Contact for pricing',
        found_on_site: true
      });
    }
  });

  return services;
}

// Extract photo gallery from website
function extractPhotos($, baseUrl) {
  const photos = [];
  const photoSelectors = [
    '.gallery img',
    '.portfolio img',
    '.slider img',
    '.carousel img',
    'img[src*="gallery"]',
    'img[src*="work"]',
    'img[src*="project"]',
    'img[alt*="inspection"]',
    'img[alt*="team"]'
  ];

  photoSelectors.forEach(selector => {
    $(selector).each((i, elem) => {
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

  return photos.slice(0, 10); // Limit to 10 photos
}

// Extract business hours
function extractBusinessHours($, content) {
  const hoursText = content.toLowerCase();
  const hours = {};
  
  // Look for common hour patterns
  const hourPatterns = [
    /monday[:\s]*(\d+(?::\d+)?\s*(?:am|pm)?)\s*(?:-|to)\s*(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /mon[:\s]*(\d+(?::\d+)?\s*(?:am|pm)?)\s*(?:-|to)\s*(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /(\d+(?::\d+)?\s*(?:am|pm)?)\s*(?:-|to)\s*(\d+(?::\d+)?\s*(?:am|pm)?)/i
  ];

  // Simple extraction - can be enhanced
  if (hoursText.includes('24/7') || hoursText.includes('24 hours')) {
    return { type: '24/7', note: 'Available 24/7' };
  }
  
  if (hoursText.includes('by appointment')) {
    return { type: 'appointment', note: 'By appointment only' };
  }

  return {};
}

// Extract social media links
function extractSocialMedia($, baseUrl) {
  const social = {};
  const socialSelectors = {
    facebook: 'a[href*="facebook.com"]',
    twitter: 'a[href*="twitter.com"]',
    linkedin: 'a[href*="linkedin.com"]',
    instagram: 'a[href*="instagram.com"]',
    youtube: 'a[href*="youtube.com"]',
    yelp: 'a[href*="yelp.com"]',
    google: 'a[href*="google.com/maps"]'
  };

  Object.entries(socialSelectors).forEach(([platform, selector]) => {
    const link = $(selector).first();
    if (link.length) {
      social[platform] = link.attr('href');
    }
  });

  return social;
}

// Scrape individual inspector website
async function enrichInspectorData(inspector) {
  if (!inspector.website) {
    log(`  No website found for ${inspector.business_name}`);
    return null;
  }

  try {
    log(`  Scraping website: ${inspector.website}`);
    
    // Set reasonable timeout and headers
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

    // Extract all enrichment data
    const enrichmentData = {
      logo_url: extractLogo($, baseUrl),
      company_description: $('meta[name="description"]').attr('content') || 
                          $('.about, .description, .intro').first().text().substring(0, 500).trim(),
      detailed_services: extractServices($, content),
      photo_gallery: extractPhotos($, baseUrl),
      business_hours: extractBusinessHours($, content),
      social_media: extractSocialMedia($, baseUrl),
      last_enriched_at: new Date().toISOString(),
      enrichment_status: 'completed'
    };

    log(`  Enrichment completed: ${enrichmentData.detailed_services.length} services, ${enrichmentData.photo_gallery.length} photos`);
    return enrichmentData;

  } catch (error) {
    log(`  Error scraping ${inspector.website}: ${error.message}`);
    return {
      last_enriched_at: new Date().toISOString(),
      enrichment_status: 'failed',
      enrichment_error: error.message
    };
  }
}

// Update inspector in database
async function updateInspectorData(inspectorId, enrichmentData) {
  try {
    const { error } = await supabase
      .from('inspectors')
      .update(enrichmentData)
      .eq('id', inspectorId);

    if (error) {
      log(`  Database update error for inspector ${inspectorId}: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    log(`  Database error: ${error.message}`);
    return false;
  }
}

// Main enrichment function
async function enrichInspectors(limit = 10) {
  log('🔍 Starting Inspector Data Enrichment');
  log('=====================================');

  try {
    // Get inspectors that haven't been enriched yet
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .neq('website', null)
      .neq('website', '')
      .or('enrichment_status.is.null,enrichment_status.eq.pending,enrichment_status.eq.failed')
      .limit(limit);

    if (error) {
      log(`Error fetching inspectors: ${error.message}`);
      return;
    }

    if (inspectors.length === 0) {
      log('No inspectors found that need enrichment');
      return;
    }

    log(`Found ${inspectors.length} inspectors to enrich\n`);

    let enriched = 0;
    let failed = 0;

    for (let i = 0; i < inspectors.length; i++) {
      const inspector = inspectors[i];
      log(`\n${i + 1}/${inspectors.length}: Processing ${inspector.business_name}`);

      // Mark as in progress
      await updateInspectorData(inspector.id, { enrichment_status: 'in_progress' });

      // Enrich the data
      const enrichmentData = await enrichInspectorData(inspector);
      
      if (enrichmentData) {
        const success = await updateInspectorData(inspector.id, enrichmentData);
        if (success) {
          enriched++;
          log(`  ✅ Successfully enriched ${inspector.business_name}`);
        } else {
          failed++;
        }
      } else {
        failed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    log('\n📊 Enrichment Summary');
    log('====================');
    log(`✅ Successfully enriched: ${enriched}`);
    log(`❌ Failed: ${failed}`);
    log(`📍 Total processed: ${inspectors.length}`);

  } catch (error) {
    log(`Fatal error: ${error.message}`);
    throw error;
  }
}

// Test specific inspector (like Golden Gate Home Inspections)
async function testEnrichment(businessName) {
  log(`🧪 Testing enrichment for: ${businessName}`);
  
  const { data: inspector, error } = await supabase
    .from('inspectors')
    .select('*')
    .ilike('business_name', `%${businessName}%`)
    .single();

  if (error || !inspector) {
    log(`Inspector not found: ${businessName}`);
    return;
  }

  log(`Found inspector: ${inspector.business_name} - ${inspector.website}`);
  
  const enrichmentData = await enrichInspectorData(inspector);
  if (enrichmentData) {
    log('\n📊 Enrichment Results:');
    log(`Logo: ${enrichmentData.logo_url || 'Not found'}`);
    log(`Services: ${enrichmentData.detailed_services.length} found`);
    log(`Photos: ${enrichmentData.photo_gallery.length} found`);
    
    enrichmentData.detailed_services.forEach(service => {
      log(`  - ${service.name}: ${service.price_range}`);
    });

    // Update database
    await updateInspectorData(inspector.id, enrichmentData);
    log('\n✅ Test enrichment completed and saved to database');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'test' && args[1]) {
    testEnrichment(args[1])
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
      });
  } else {
    const limit = parseInt(args[0]) || 10;
    enrichInspectors(limit)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Enrichment failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { enrichInspectors, testEnrichment };