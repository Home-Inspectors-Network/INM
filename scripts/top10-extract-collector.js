#!/usr/bin/env node

/**
 * TOP 10 COMPREHENSIVE COLLECTOR - EXTRACT VERSION
 * 
 * Optimized for Firecrawl Extract API
 * Two-stage process: Search for URLs, then Extract structured data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const FirecrawlApp = require('@mendable/firecrawl-js').default;
const fs = require('fs-extra');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Target 20 Major Cities
const TARGET_CITIES = [
  { name: 'New York City', state: 'NY', shortName: 'NYC' },
  { name: 'Los Angeles', state: 'CA', shortName: 'LA' },
  { name: 'Chicago', state: 'IL', shortName: 'Chicago' },
  { name: 'Houston', state: 'TX', shortName: 'Houston' },
  { name: 'Phoenix', state: 'AZ', shortName: 'Phoenix' },
  { name: 'Philadelphia', state: 'PA', shortName: 'Philly' },
  { name: 'San Antonio', state: 'TX', shortName: 'San Antonio' },
  { name: 'San Diego', state: 'CA', shortName: 'San Diego' },
  { name: 'Dallas', state: 'TX', shortName: 'Dallas' },
  { name: 'San Jose', state: 'CA', shortName: 'San Jose' },
  { name: 'San Francisco', state: 'CA', shortName: 'SF' },
  { name: 'Seattle', state: 'WA', shortName: 'Seattle' },
  { name: 'Austin', state: 'TX', shortName: 'Austin' },
  { name: 'Denver', state: 'CO', shortName: 'Denver' },
  { name: 'Boston', state: 'MA', shortName: 'Boston' },
  { name: 'Miami', state: 'FL', shortName: 'Miami' },
  { name: 'Atlanta', state: 'GA', shortName: 'Atlanta' },
  { name: 'Washington', state: 'DC', shortName: 'DC' },
  { name: 'Las Vegas', state: 'NV', shortName: 'Vegas' },
  { name: 'Portland', state: 'OR', shortName: 'Portland' }
];

// Inspector categories with specific schemas
const INSPECTOR_CATEGORIES = {
  home: {
    name: 'Home Inspectors',
    queries: [
      'home inspectors {city} {state}',
      'property inspection services {city}',
      'certified home inspector {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      description: 'string',
      specialties: ['string'],
      insuranceInfo: 'string',
      businessHours: 'string'
    }
  },
  termite: {
    name: 'Termite/Pest Inspectors',
    queries: [
      'termite inspection {city} {state}',
      'pest control inspector {city}',
      'WDO inspection {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      description: 'string',
      pestTypes: ['string'],
      treatmentMethods: ['string'],
      warranty: 'string'
    }
  },
  mold: {
    name: 'Mold Inspectors',
    queries: [
      'mold inspector {city} {state}',
      'mold testing {city}',
      'indoor air quality testing {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      description: 'string',
      testingMethods: ['string'],
      turnaroundTime: 'string',
      labCertified: 'boolean'
    }
  },
  foundation: {
    name: 'Foundation/Structural Inspectors',
    queries: [
      'foundation inspector {city} {state}',
      'structural engineer inspector {city}',
      'foundation inspection {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      engineeringLicense: 'string',
      description: 'string',
      structuralSpecialties: ['string']
    }
  },
  pool: {
    name: 'Pool/Spa Inspectors',
    queries: [
      'pool inspector {city} {state}',
      'spa inspector {city}',
      'pool inspection service {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      description: 'string',
      poolTypes: ['string'],
      equipmentBrands: ['string']
    }
  },
  radon: {
    name: 'Radon Inspectors',
    queries: [
      'radon testing {city} {state}',
      'radon inspector {city}',
      'radon measurement {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      description: 'string',
      testingProtocols: ['string'],
      mitigationServices: 'boolean'
    }
  },
  commercial: {
    name: 'Commercial Inspectors',
    queries: [
      'commercial property inspector {city} {state}',
      'commercial building inspection {city}',
      'multi-family inspector {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      description: 'string',
      propertyTypes: ['string'],
      maxSquareFootage: 'number'
    }
  },
  specialty: {
    name: 'Specialty Inspectors',
    queries: [
      'asbestos inspector {city} {state}',
      'lead paint inspector {city}',
      'environmental inspector {city}'
    ],
    schema: {
      businessName: 'string',
      phone: 'string',
      email: 'string',
      website: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zip: 'string',
      services: ['string'],
      certifications: ['string'],
      yearsInBusiness: 'number',
      licenseNumber: 'string',
      description: 'string',
      specialtyTypes: ['string'],
      epaCertified: 'boolean'
    }
  }
};

class ExtractCollector {
  constructor() {
    this.stats = {
      totalProcessed: 0,
      totalCollected: 0,
      categoriesCompleted: 0,
      errors: [],
      startTime: new Date()
    };
    
    this.logDir = path.join(__dirname, '../logs/extract-collection');
    fs.ensureDirSync(this.logDir);
  }

  async collectAllCategories() {
    console.log('🚀 TOP 10 COMPREHENSIVE COLLECTION - EXTRACT VERSION');
    console.log('==================================================');
    console.log(`📍 Target: 20 cities × 8 categories × 10 inspectors = 1,600 total`);
    console.log(`💎 Using Firecrawl Extract for structured data`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    for (const [categoryKey, category] of Object.entries(INSPECTOR_CATEGORIES)) {
      await this.collectCategory(categoryKey, category);
      this.stats.categoriesCompleted++;
      
      // Save progress
      await this.saveProgress();
      
      // Rate limiting between categories
      await this.delay(5000);
    }

    await this.finalReport();
  }

  async collectCategory(categoryKey, category) {
    console.log(`\n🏷️  CATEGORY: ${category.name}`);
    console.log('═'.repeat(60));
    
    const categoryStartTime = Date.now();
    const allUrls = [];
    
    // Stage 1: Collect URLs for all cities
    console.log('📍 Stage 1: URL Discovery');
    console.log('─'.repeat(40));
    
    for (const city of TARGET_CITIES) {
      const cityUrls = await this.discoverUrls(city, category);
      allUrls.push(...cityUrls.map(url => ({ url, city })));
      
      // Rate limiting
      await this.delay(1000);
    }
    
    console.log(`\n✅ Discovered ${allUrls.length} potential inspector URLs`);
    
    // Stage 2: Extract structured data in batches
    console.log('\n📊 Stage 2: Structured Data Extraction');
    console.log('─'.repeat(40));
    
    const batchSize = 50; // Process 50 URLs at a time
    const batches = [];
    
    for (let i = 0; i < allUrls.length; i += batchSize) {
      batches.push(allUrls.slice(i, i + batchSize));
    }
    
    let totalExtracted = 0;
    for (let i = 0; i < batches.length; i++) {
      console.log(`  📦 Processing batch ${i + 1}/${batches.length} (${batches[i].length} URLs)`);
      
      const extractedData = await this.extractBatch(batches[i], category.schema, categoryKey);
      totalExtracted += extractedData.length;
      
      // Save to database
      await this.saveInspectors(extractedData);
      
      console.log(`    ✅ Extracted ${extractedData.length} inspectors (Total: ${totalExtracted})`);
      
      // Rate limiting between batches
      await this.delay(2000);
    }
    
    const duration = ((Date.now() - categoryStartTime) / 1000).toFixed(1);
    console.log(`\n✅ ${category.name} Complete: ${totalExtracted} inspectors in ${duration}s`);
  }

  async discoverUrls(city, category) {
    const urls = new Set();
    
    for (const queryTemplate of category.queries) {
      const query = queryTemplate
        .replace('{city}', city.name)
        .replace('{state}', city.state);
      
      try {
        const results = await firecrawl.search(query, { 
          limit: 5, // Get top 5 results per query
          scrapeOptions: {
            formats: ['markdown'],
            timeout: 10000
          }
        });
        
        if (results.data) {
          results.data.forEach(result => {
            if (result.url && this.isValidInspectorUrl(result.url)) {
              urls.add(result.url);
            }
          });
        }
      } catch (error) {
        console.log(`    ⚠️  Search error for "${query}": ${error.message}`);
      }
    }
    
    return Array.from(urls);
  }

  async extractBatch(urlsWithCity, schema, categoryKey) {
    const urls = urlsWithCity.map(item => item.url);
    
    try {
      const result = await firecrawl.extract(
        urls,
        {
          schema: schema,
          prompt: `Extract business information for ${categoryKey} inspection companies. Focus on contact details, services, and certifications.`
        }
      );
      
      if (!result.data) return [];
      
      // Process and enrich extracted data
      const inspectors = [];
      for (let i = 0; i < result.data.length; i++) {
        const data = result.data[i];
        const cityInfo = urlsWithCity[i].city;
        
        if (data && this.validateExtractedData(data)) {
          inspectors.push(this.formatInspectorData(data, cityInfo, categoryKey, urls[i]));
        }
      }
      
      return inspectors;
    } catch (error) {
      console.log(`    ⚠️  Extract error: ${error.message}`);
      this.stats.errors.push(error.message);
      return [];
    }
  }

  isValidInspectorUrl(url) {
    const excludePatterns = [
      'yelp.com/search', 'google.com/search', 'facebook.com',
      'yellowpages.com/search', 'angi.com/search', 'homeadvisor.com/c/',
      'wikipedia.org', 'youtube.com', 'indeed.com', 'glassdoor.com'
    ];
    
    return !excludePatterns.some(pattern => url.includes(pattern));
  }

  validateExtractedData(data) {
    // Must have business name and at least one contact method
    return data.businessName && 
           (data.phone || data.email || data.website) &&
           data.address;
  }

  formatInspectorData(data, cityInfo, categoryKey, sourceUrl) {
    return {
      business_name: data.businessName,
      owner_name: null,
      email: data.email || null,
      phone: this.formatPhone(data.phone),
      website: data.website || sourceUrl,
      address_street: data.address,
      city: data.city || cityInfo.name,
      state: data.state || cityInfo.state,
      address_zip: data.zip || null,
      services: data.services || [],
      certifications: data.certifications || [],
      years_in_business: data.yearsInBusiness || null,
      insurance_verified: data.insuranceInfo ? true : false,
      license_number: data.licenseNumber || null,
      inspector_type: categoryKey,
      enrichment_status: 'completed', // Already enriched via Extract
      quality_score: this.calculateQualityScore(data),
      description: data.description || null,
      collected_at: new Date().toISOString(),
      data_source: 'firecrawl_extract',
      source_url: sourceUrl,
      enrichment_data: {
        inspector_type: categoryKey,
        extract_version: '2.0',
        additional_data: this.getAdditionalData(data, categoryKey)
      }
    };
  }

  formatPhone(phone) {
    if (!phone) return null;
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  calculateQualityScore(data) {
    let score = 0;
    
    // Core requirements (50 points)
    if (data.businessName && data.address && data.phone) score += 20;
    if (data.website) score += 15;
    if (data.services && data.services.length > 0) score += 15;
    
    // Additional quality (50 points)
    if (data.certifications && data.certifications.length > 0) score += 10;
    if (data.yearsInBusiness) score += 10;
    if (data.email) score += 10;
    if (data.description) score += 10;
    if (data.licenseNumber) score += 10;
    
    return score;
  }

  getAdditionalData(data, categoryKey) {
    const additional = {};
    
    // Category-specific data
    switch(categoryKey) {
      case 'termite':
        if (data.pestTypes) additional.pest_types = data.pestTypes;
        if (data.treatmentMethods) additional.treatment_methods = data.treatmentMethods;
        if (data.warranty) additional.warranty = data.warranty;
        break;
      case 'mold':
        if (data.testingMethods) additional.testing_methods = data.testingMethods;
        if (data.turnaroundTime) additional.turnaround_time = data.turnaroundTime;
        if (data.labCertified !== undefined) additional.lab_certified = data.labCertified;
        break;
      case 'foundation':
        if (data.engineeringLicense) additional.engineering_license = data.engineeringLicense;
        if (data.structuralSpecialties) additional.structural_specialties = data.structuralSpecialties;
        break;
      // Add more category-specific handling
    }
    
    if (data.businessHours) additional.business_hours = data.businessHours;
    if (data.specialties) additional.specialties = data.specialties;
    
    return additional;
  }

  async saveInspectors(inspectors) {
    if (inspectors.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('inspectors')
        .insert(inspectors)
        .select();
      
      if (error) throw error;
      
      this.stats.totalCollected += inspectors.length;
    } catch (error) {
      console.log(`    ❌ Database error: ${error.message}`);
      this.stats.errors.push(`DB: ${error.message}`);
    }
  }

  async saveProgress() {
    const progress = {
      stats: this.stats,
      timestamp: new Date().toISOString(),
      categoriesCompleted: Object.keys(INSPECTOR_CATEGORIES)
        .slice(0, this.stats.categoriesCompleted)
        .map(key => INSPECTOR_CATEGORIES[key].name)
    };
    
    const progressFile = path.join(this.logDir, 'collection-progress.json');
    await fs.writeJson(progressFile, progress, { spaces: 2 });
  }

  async finalReport() {
    const duration = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL COLLECTION REPORT');
    console.log('='.repeat(60));
    console.log(`✅ Total Inspectors Collected: ${this.stats.totalCollected}`);
    console.log(`📁 Categories Completed: ${this.stats.categoriesCompleted}/8`);
    console.log(`⏱️  Total Duration: ${duration} minutes`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      this.stats.errors.slice(0, 10).forEach(err => {
        console.log(`  - ${err}`);
      });
    }
    
    // Save final report
    const reportFile = path.join(this.logDir, `final-report-${Date.now()}.json`);
    await fs.writeJson(reportFile, {
      stats: this.stats,
      duration: `${duration} minutes`,
      timestamp: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`\n📄 Report saved to: ${reportFile}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the collector
async function main() {
  const collector = new ExtractCollector();
  
  try {
    await collector.collectAllCategories();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ExtractCollector;