#!/usr/bin/env node

/**
 * TOP 10 TERMITE INSPECTORS - MOCK COLLECTOR
 * 
 * Phase 2: Collect Top 10 Termite/Pest Inspectors for 20 Major Cities
 * Uses mock data generation to demonstrate the collection process
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Target 20 Major Cities
const TARGET_CITIES = [
  { name: 'New York City', state: 'NY', shortName: 'NYC', zip: '10001' },
  { name: 'Los Angeles', state: 'CA', shortName: 'LA', zip: '90001' },
  { name: 'Chicago', state: 'IL', shortName: 'Chicago', zip: '60601' },
  { name: 'Houston', state: 'TX', shortName: 'Houston', zip: '77001' },
  { name: 'Phoenix', state: 'AZ', shortName: 'Phoenix', zip: '85001' },
  { name: 'Philadelphia', state: 'PA', shortName: 'Philly', zip: '19101' },
  { name: 'San Antonio', state: 'TX', shortName: 'San Antonio', zip: '78201' },
  { name: 'San Diego', state: 'CA', shortName: 'San Diego', zip: '92101' },
  { name: 'Dallas', state: 'TX', shortName: 'Dallas', zip: '75201' },
  { name: 'San Jose', state: 'CA', shortName: 'San Jose', zip: '95101' },
  { name: 'San Francisco', state: 'CA', shortName: 'SF', zip: '94101' },
  { name: 'Seattle', state: 'WA', shortName: 'Seattle', zip: '98101' },
  { name: 'Austin', state: 'TX', shortName: 'Austin', zip: '78701' },
  { name: 'Denver', state: 'CO', shortName: 'Denver', zip: '80201' },
  { name: 'Boston', state: 'MA', shortName: 'Boston', zip: '02101' },
  { name: 'Miami', state: 'FL', shortName: 'Miami', zip: '33101' },
  { name: 'Atlanta', state: 'GA', shortName: 'Atlanta', zip: '30301' },
  { name: 'Washington', state: 'DC', shortName: 'DC', zip: '20001' },
  { name: 'Las Vegas', state: 'NV', shortName: 'Vegas', zip: '89101' },
  { name: 'Portland', state: 'OR', shortName: 'Portland', zip: '97201' }
];

// Realistic termite/pest inspector business name patterns
const TERMITE_BUSINESS_PATTERNS = [
  '[City] Termite Inspection Services',
  '[Prefix] Pest & Termite Inspectors',
  '[Name] Termite Control & Inspection',
  '[City] WDO Inspection Specialists',
  '[Prefix] Structural Pest Inspectors',
  '[Name] Wood Destroying Organism Services',
  '[Area] Termite & Pest Inspection Co',
  '[Prefix] Professional Pest Inspectors',
  '[Name] Certified Termite Inspectors',
  '[City] Annual Termite Inspections'
];

const PREFIXES = ['Professional', 'Expert', 'Premier', 'Elite', 'Certified', 'Licensed', 'Trusted', 'Quality', 'Complete', 'Advanced'];
const OWNER_NAMES = ['Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];
const AREA_NAMES = ['Metro', 'County', 'Regional', 'Valley', 'Bay Area', 'Central', 'North', 'South', 'East', 'West'];

class TermiteMockCollector {
  constructor() {
    this.stats = {
      total_processed: 0,
      total_collected: 0,
      cities_completed: 0,
      errors: [],
      start_time: new Date()
    };
    
    this.allInspectors = [];
    this.logDir = path.join(__dirname, '../logs/termite-mock-collection');
    fs.ensureDirSync(this.logDir);
  }

  async collectAllCities() {
    console.log('🐜 TOP 10 TERMITE/PEST INSPECTORS MOCK COLLECTION - PHASE 2');
    console.log('=======================================================');
    console.log(`📍 Target: 20 cities × 10 inspectors = 200 total`);
    console.log(`🎯 Inspector Type: Termite/Pest Inspectors`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    for (const city of TARGET_CITIES) {
      await this.collectCityInspectors(city);
      
      // Progress report every 5 cities
      if ((this.stats.cities_completed % 5) === 0 && this.stats.cities_completed > 0) {
        await this.reportProgress();
      }
      
      // Simulate rate limiting
      await this.delay(1000);
    }

    await this.finalReport();
  }

  async collectCityInspectors(city) {
    console.log(`\n📍 COLLECTING: ${city.name}, ${city.state}`);
    console.log('─'.repeat(50));
    
    const cityStartTime = Date.now();
    
    try {
      // Generate 12-15 mock inspectors
      const mockInspectors = this.generateMockInspectors(city, 12 + Math.floor(Math.random() * 4));
      
      // Sort by quality score and take top 10
      const top10 = mockInspectors
        .sort((a, b) => b.quality_score - a.quality_score)
        .slice(0, 10);
      
      // Save to database
      await this.saveInspectors(top10, city);
      
      const duration = ((Date.now() - cityStartTime) / 1000).toFixed(1);
      console.log(`  ✅ Completed ${city.name}: ${top10.length} inspectors saved (${duration}s)`);
      
      this.stats.cities_completed++;
      this.allInspectors.push(...top10);
      
    } catch (error) {
      console.log(`  ❌ City collection failed: ${error.message}`);
      this.stats.errors.push({ city: city.name, error: error.message });
    }
  }

  generateMockInspectors(city, count) {
    const inspectors = [];
    const usedNames = new Set();
    const usedPhones = new Set();
    
    for (let i = 0; i < count; i++) {
      let businessName;
      let attempts = 0;
      
      // Generate unique business name
      do {
        const pattern = TERMITE_BUSINESS_PATTERNS[Math.floor(Math.random() * TERMITE_BUSINESS_PATTERNS.length)];
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        const ownerName = OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)];
        const areaName = AREA_NAMES[Math.floor(Math.random() * AREA_NAMES.length)];
        
        businessName = pattern
          .replace('[City]', city.name)
          .replace('[Prefix]', prefix)
          .replace('[Name]', ownerName + "'s")
          .replace('[Area]', areaName);
          
        attempts++;
      } while (usedNames.has(businessName) && attempts < 10);
      
      usedNames.add(businessName);
      
      // Generate unique phone
      let phone;
      do {
        const areaCode = 200 + Math.floor(Math.random() * 800);
        const prefix = 200 + Math.floor(Math.random() * 800);
        const lineNumber = 1000 + Math.floor(Math.random() * 9000);
        phone = `(${areaCode}) ${prefix}-${lineNumber}`;
      } while (usedPhones.has(phone));
      
      usedPhones.add(phone);
      
      // Generate other data
      const streetNumber = 100 + Math.floor(Math.random() * 9900);
      const streetNames = ['Main St', 'Oak Ave', 'Elm Dr', 'Pine Rd', 'Maple Blvd', 'Cedar Ln', 'Park Way', 'First St', 'Second Ave', 'Third St'];
      const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
      
      const services = this.generateTermiteServices();
      const certifications = this.generateTermiteCertifications();
      const yearsInBusiness = 5 + Math.floor(Math.random() * 25);
      
      const inspector = {
        business_name: businessName,
        owner_name: OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)] + ' ' + 
                    ['Jr', 'Sr', 'III', ''][Math.floor(Math.random() * 4)],
        email: businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '@example.com',
        phone: phone,
        website: 'https://' + businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        address: `${streetNumber} ${streetName}`, // Using 'address' instead of 'address_street'
        city: city.name,
        state: city.state,
        zip: city.zip, // Using 'zip' instead of 'address_zip'
        services: services,
        certifications: certifications,
        years_in_business: yearsInBusiness,
        insurance_verified: Math.random() > 0.2,
        license_number: 'TPC-' + (10000 + Math.floor(Math.random() * 90000)),
        quality_score: this.calculateQualityScore({
          businessName, phone, email: true, website: true,
          address: true, services, certifications,
          description: true, yearsInBusiness
        }),
        description: `${businessName} provides comprehensive termite and pest inspection services in ${city.name}, ${city.state}. With ${yearsInBusiness} years of experience, we specialize in WDO inspections for real estate transactions.`,
        enrichment_status: 'pending',
        enrichment_data: {
          inspector_type: 'termite',
          collected_at: new Date().toISOString(),
          data_source: 'mock_top10',
          search_engine: 'mock',
          source_url: 'https://example.com'
        }
      };
      
      inspectors.push(inspector);
    }
    
    return inspectors;
  }

  generateTermiteServices() {
    const allServices = [
      'Termite Inspection',
      'WDO Inspection',
      'Pre-Purchase Pest Inspection',
      'Pest Inspection',
      'Structural Pest Control',
      'Commercial Pest Inspection',
      'Annual Termite Inspection',
      'Moisture Inspection',
      'Wood Rot Inspection',
      'Termite Treatment'
    ];
    
    // Always include core termite inspection
    const services = ['Termite Inspection'];
    
    // Add 2-5 additional services
    const additionalCount = 2 + Math.floor(Math.random() * 4);
    const availableServices = allServices.filter(s => s !== 'Termite Inspection');
    
    for (let i = 0; i < additionalCount && availableServices.length > 0; i++) {
      const index = Math.floor(Math.random() * availableServices.length);
      services.push(availableServices.splice(index, 1)[0]);
    }
    
    return services;
  }

  generateTermiteCertifications() {
    const allCerts = [
      'State Licensed',
      'NPMA',
      'TPCL',
      'ACE',
      'Licensed',
      'Certified',
      'Insured',
      'Bonded'
    ];
    
    // Always include State Licensed
    const certs = ['State Licensed'];
    
    // Add 2-4 additional certifications
    const additionalCount = 2 + Math.floor(Math.random() * 3);
    const availableCerts = allCerts.filter(c => c !== 'State Licensed');
    
    for (let i = 0; i < additionalCount && availableCerts.length > 0; i++) {
      const index = Math.floor(Math.random() * availableCerts.length);
      certs.push(availableCerts.splice(index, 1)[0]);
    }
    
    return certs;
  }

  calculateQualityScore(data) {
    let score = 0;
    
    // Basic data completeness (50 points)
    if (data.businessName) score += 10;
    if (data.phone) score += 10;
    if (data.email) score += 10;
    if (data.website) score += 10;
    if (data.address) score += 10;
    
    // Service information (20 points)
    if (data.services && data.services.length > 0) score += 10;
    if (data.services && data.services.length > 3) score += 10;
    
    // Credentials (20 points)
    if (data.certifications && data.certifications.length > 0) score += 10;
    if (data.certifications && data.certifications.length > 2) score += 10;
    
    // Additional info (10 points)
    if (data.description) score += 5;
    if (data.yearsInBusiness) score += 5;
    
    return score;
  }

  async saveInspectors(inspectors, city) {
    const saved = [];
    
    for (const inspector of inspectors) {
      try {
        // Check for existing inspector
        const { data: existing } = await supabase
          .from('inspectors')
          .select('id')
          .eq('business_name', inspector.business_name)
          .eq('city', inspector.city)
          .single();
        
        if (!existing) {
          const { data, error } = await supabase
            .from('inspectors')
            .insert([inspector])
            .select();
          
          if (error) {
            console.log(`    ⚠️  Failed to save ${inspector.business_name}: ${error.message}`);
          } else {
            saved.push(data[0]);
            this.stats.total_collected++;
            console.log(`    ✅ Saved: ${inspector.business_name}`);
          }
        } else {
          console.log(`    ⏭️  Skipped (exists): ${inspector.business_name}`);
        }
        
        this.stats.total_processed++;
        
      } catch (error) {
        console.log(`    ⚠️  Database error for ${inspector.business_name}: ${error.message}`);
      }
    }
    
    return saved;
  }

  async reportProgress() {
    console.log('\n📊 PROGRESS REPORT - TERMITE INSPECTORS');
    console.log('=====================================');
    console.log(`Cities Completed: ${this.stats.cities_completed}/20`);
    console.log(`Total Collected: ${this.stats.total_collected}`);
    console.log(`Average per City: ${(this.stats.total_collected / this.stats.cities_completed).toFixed(1)}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    const elapsed = (Date.now() - this.stats.start_time.getTime()) / 1000 / 60;
    console.log(`Time Elapsed: ${elapsed.toFixed(1)} minutes`);
    console.log(`Est. Remaining: ${((elapsed / this.stats.cities_completed) * (20 - this.stats.cities_completed)).toFixed(1)} minutes\n`);
  }

  async finalReport() {
    const duration = (Date.now() - this.stats.start_time.getTime()) / 1000 / 60;
    
    console.log('\n🎉 TERMITE INSPECTOR COLLECTION COMPLETE!');
    console.log('========================================');
    console.log(`✅ Cities Completed: ${this.stats.cities_completed}/20`);
    console.log(`📊 Total Termite Inspectors Collected: ${this.stats.total_collected}`);
    console.log(`📈 Average per City: ${(this.stats.total_collected / this.stats.cities_completed).toFixed(1)}`);
    console.log(`⏱️  Total Duration: ${duration.toFixed(1)} minutes`);
    console.log(`❌ Total Errors: ${this.stats.errors.length}`);
    
    // Save detailed report
    const reportPath = path.join(this.logDir, `termite-mock-report-${Date.now()}.json`);
    await fs.writeJson(reportPath, {
      stats: this.stats,
      inspectors: this.allInspectors,
      errors: this.stats.errors
    }, { spaces: 2 });
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Database summary by inspector type
    const { data: termiteData } = await supabase
      .from('inspectors')
      .select('enrichment_data')
      .not('enrichment_data', 'is', null);
    
    let termiteCount = 0;
    if (termiteData) {
      termiteCount = termiteData.filter(row => 
        row.enrichment_data && row.enrichment_data.inspector_type === 'termite'
      ).length;
    }
    
    console.log(`\n💾 Database Status:`);
    console.log(`   Total Termite Inspectors: ${termiteCount}`);
    console.log(`   Ready for Enrichment: ${this.stats.total_collected} new inspectors`);
    
    // Overall database summary
    const { count: totalCount } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Total All Inspectors: ${totalCount}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute collection
if (require.main === module) {
  const collector = new TermiteMockCollector();
  
  collector.collectAllCities()
    .then(() => {
      console.log('\n✅ Termite inspector mock collection completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Collection failed:', error);
      process.exit(1);
    });
}

module.exports = TermiteMockCollector;