#!/usr/bin/env node

/**
 * TOP 10 MOCK COLLECTOR - PHASE 3 DEMO (FIXED)
 * 
 * Phase 3: Mock Collection of Top 10 Mold Inspectors for 20 Major Cities
 * Fixed version that matches the current database schema
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
  { name: 'New York City', state: 'NY', shortName: 'NYC' },
  { name: 'Los Angeles', state: 'CA', shortName: 'LA' },
  { name: 'Chicago', state: 'IL', shortName: 'Chicago' },
  { name: 'Houston', state: 'TX', shortName: 'Houston' },
  { name: 'Phoenix', state: 'AZ', shortName: 'Phoenix' }
];

// Mock mold inspector business names
const MOLD_BUSINESS_PREFIXES = [
  'Professional', 'Certified', 'Expert', 'Premier', 'Quality',
  'Advanced', 'Complete', 'Trusted', 'Reliable', 'Accurate'
];

const MOLD_BUSINESS_CORES = [
  'Mold Inspection', 'Mold Testing', 'Indoor Air Quality', 'Environmental Testing',
  'Mold Assessment', 'Air Quality Solutions', 'Mold Detection', 'Environmental Health',
  'Mold Analysis', 'IAQ Testing'
];

const MOLD_BUSINESS_SUFFIXES = [
  'Services', 'Professionals', 'Experts', 'Solutions', 'Group',
  'Company', 'Associates', 'Consultants', 'Labs', 'Testing'
];

class MoldMockCollector {
  constructor() {
    this.stats = {
      total_processed: 0,
      total_collected: 0,
      cities_completed: 0,
      errors: [],
      start_time: new Date()
    };
    
    this.allInspectors = [];
    this.logDir = path.join(__dirname, '../logs/mold-mock-collection');
    fs.ensureDirSync(this.logDir);
  }

  async collectAllCities() {
    console.log('🦠 TOP 10 MOLD INSPECTORS MOCK COLLECTION - PHASE 3 DEMO');
    console.log('========================================================');
    console.log(`📍 Target: ${TARGET_CITIES.length} cities × 10 inspectors = ${TARGET_CITIES.length * 10} total`);
    console.log(`🎯 Inspector Type: Mold Inspectors`);
    console.log(`⚠️  MODE: Mock Collection (No API calls)`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    // First, ensure enrichment columns exist
    await this.ensureEnrichmentColumns();

    for (const city of TARGET_CITIES) {
      await this.collectCityInspectors(city);
      
      // Rate limiting simulation
      await this.delay(500);
    }

    await this.finalReport();
  }

  async ensureEnrichmentColumns() {
    console.log('📋 Checking database schema...');
    try {
      // Run the enrichment columns SQL
      const queries = [
        `ALTER TABLE inspectors 
         ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(20) DEFAULT 'pending',
         ADD COLUMN IF NOT EXISTS enrichment_data JSONB,
         ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
         ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP,
         ADD COLUMN IF NOT EXISTS city VARCHAR(100),
         ADD COLUMN IF NOT EXISTS state VARCHAR(2),
         ADD COLUMN IF NOT EXISTS inspector_type VARCHAR(50) DEFAULT 'general',
         ADD COLUMN IF NOT EXISTS data_source VARCHAR(50),
         ADD COLUMN IF NOT EXISTS search_engine VARCHAR(50),
         ADD COLUMN IF NOT EXISTS source_url TEXT,
         ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP,
         ADD COLUMN IF NOT EXISTS description TEXT`,
         
        `UPDATE inspectors 
         SET city = address_city, 
             state = address_state 
         WHERE city IS NULL OR state IS NULL`,
         
        `CREATE INDEX IF NOT EXISTS idx_inspectors_enrichment_status ON inspectors(enrichment_status)`,
        `CREATE INDEX IF NOT EXISTS idx_inspectors_quality_score ON inspectors(quality_score)`,
        `CREATE INDEX IF NOT EXISTS idx_inspectors_inspector_type ON inspectors(inspector_type)`
      ];

      for (const query of queries) {
        try {
          const { error } = await supabase.rpc('execute_sql', { query });
          if (error && !error.message.includes('already exists')) {
            console.log(`  ⚠️  Schema update warning: ${error.message}`);
          }
        } catch (err) {
          // Ignore errors - columns might already exist
        }
      }
      
      console.log('  ✅ Schema check complete\n');
    } catch (error) {
      console.log('  ⚠️  Could not update schema. Proceeding with existing columns.\n');
    }
  }

  async collectCityInspectors(city) {
    console.log(`\n📍 COLLECTING: ${city.name}, ${city.state}`);
    console.log('─'.repeat(50));
    
    const cityStartTime = Date.now();
    
    try {
      // Generate 10 mock mold inspectors for this city
      const inspectors = this.generateMockInspectors(city, 10);
      
      // Save to database
      await this.saveInspectors(inspectors, city);
      
      const duration = ((Date.now() - cityStartTime) / 1000).toFixed(1);
      console.log(`  ✅ Completed ${city.name}: ${inspectors.length} inspectors saved (${duration}s)`);
      
      this.stats.cities_completed++;
      this.allInspectors.push(...inspectors);
      
    } catch (error) {
      console.log(`  ❌ City collection failed: ${error.message}`);
      this.stats.errors.push({ city: city.name, error: error.message });
    }
  }

  generateMockInspectors(city, count) {
    const inspectors = [];
    const usedNames = new Set();
    
    for (let i = 0; i < count; i++) {
      let businessName;
      
      // Generate unique business name
      do {
        const prefix = MOLD_BUSINESS_PREFIXES[Math.floor(Math.random() * MOLD_BUSINESS_PREFIXES.length)];
        const core = MOLD_BUSINESS_CORES[Math.floor(Math.random() * MOLD_BUSINESS_CORES.length)];
        const suffix = MOLD_BUSINESS_SUFFIXES[Math.floor(Math.random() * MOLD_BUSINESS_SUFFIXES.length)];
        
        // Sometimes use city name in business name
        if (Math.random() > 0.7) {
          businessName = `${city.shortName} ${core} ${suffix}`;
        } else if (Math.random() > 0.5) {
          businessName = `${prefix} ${core} of ${city.shortName}`;
        } else {
          businessName = `${prefix} ${core} ${suffix}`;
        }
      } while (usedNames.has(businessName));
      
      usedNames.add(businessName);
      
      // Generate mock data - only include fields that exist in schema
      const inspector = {
        business_name: businessName,
        owner_name: this.generateOwnerName(),
        email: this.generateEmail(businessName),
        phone: this.generatePhone(city),
        website: this.generateWebsite(businessName),
        address_street: this.generateStreetAddress(),
        address_city: city.name,
        address_state: city.state,
        address_zip: this.generateZipCode(city),
        services: this.generateMoldServices(),
        certifications: this.generateMoldCertifications(),
        years_in_business: Math.floor(Math.random() * 20) + 5,
        insurance_verified: Math.random() > 0.2,
        license_number: Math.random() > 0.3 ? this.generateLicenseNumber(city.state) : null
      };
      
      inspectors.push(inspector);
    }
    
    return inspectors;
  }

  generateOwnerName() {
    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'David', 'Linda', 'James', 'Barbara'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return Math.random() > 0.5 ? `${first} ${last}` : null;
  }

  generateEmail(businessName) {
    if (Math.random() > 0.8) return null; // 20% don't have email
    
    const cleanName = businessName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', `${cleanName}.com`];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return `info@${domain}`;
  }

  generatePhone(city) {
    // Use realistic area codes for each city
    const areaCodes = {
      'New York City': ['212', '718', '917', '646'],
      'Los Angeles': ['213', '323', '424', '310'],
      'Chicago': ['312', '773', '872'],
      'Houston': ['713', '281', '832'],
      'Phoenix': ['602', '480', '623']
    };
    
    const cityAreaCodes = areaCodes[city.name] || ['555'];
    const areaCode = cityAreaCodes[Math.floor(Math.random() * cityAreaCodes.length)];
    
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    
    return `(${areaCode}) ${exchange}-${number}`;
  }

  generateWebsite(businessName) {
    if (Math.random() > 0.9) return null; // 10% don't have website
    
    const cleanName = businessName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `https://www.${cleanName}.com`;
  }

  generateStreetAddress() {
    const streetNames = [
      'Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Park',
      'Broadway', 'Market', 'Industrial', 'Commercial', 'Business', 'Professional'
    ];
    
    const streetTypes = ['Street', 'Avenue', 'Boulevard', 'Drive', 'Road', 'Parkway', 'Way', 'Place'];
    
    const number = Math.floor(Math.random() * 9000) + 1000;
    const street = streetNames[Math.floor(Math.random() * streetNames.length)];
    const type = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    
    // Sometimes add suite number
    if (Math.random() > 0.6) {
      const suite = Math.floor(Math.random() * 300) + 100;
      return `${number} ${street} ${type}, Suite ${suite}`;
    }
    
    return `${number} ${street} ${type}`;
  }

  generateZipCode(city) {
    // Simplified - just generate random 5 digits
    return String(Math.floor(Math.random() * 90000) + 10000);
  }

  generateMoldServices() {
    const allServices = [
      'Mold Inspection',
      'Mold Testing',
      'Black Mold Testing',
      'Indoor Air Quality Testing',
      'Moisture Testing',
      'Environmental Testing',
      'Post-Remediation Testing',
      'Commercial Mold Inspection',
      'Residential Mold Inspection'
    ];
    
    // Always include basic mold inspection
    const services = ['Mold Inspection'];
    
    // Add 2-5 additional services
    const additionalCount = Math.floor(Math.random() * 4) + 2;
    const availableServices = allServices.filter(s => s !== 'Mold Inspection');
    
    for (let i = 0; i < additionalCount && availableServices.length > 0; i++) {
      const index = Math.floor(Math.random() * availableServices.length);
      services.push(availableServices[index]);
      availableServices.splice(index, 1);
    }
    
    return services;
  }

  generateMoldCertifications() {
    const allCerts = [
      'CMI', 'CMR', 'CIE', 'CIAQP', 'ACAC', 'IICRC', 'NORMI', 'MICRO',
      'State Licensed', 'EPA Certified', 'Licensed', 'Certified', 'Insured'
    ];
    
    // Most have 2-4 certifications
    const certCount = Math.floor(Math.random() * 3) + 2;
    const certs = [];
    const availableCerts = [...allCerts];
    
    for (let i = 0; i < certCount && availableCerts.length > 0; i++) {
      const index = Math.floor(Math.random() * availableCerts.length);
      certs.push(availableCerts[index]);
      availableCerts.splice(index, 1);
    }
    
    return certs;
  }

  generateLicenseNumber(state) {
    const prefix = state.toUpperCase();
    const number = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}-MLD-${number}`;
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
          .eq('address_city', inspector.address_city)
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

  async finalReport() {
    const duration = (Date.now() - this.stats.start_time.getTime()) / 1000 / 60;
    
    console.log('\n🎉 MOLD INSPECTOR MOCK COLLECTION COMPLETE!');
    console.log('==========================================');
    console.log(`✅ Cities Completed: ${this.stats.cities_completed}/${TARGET_CITIES.length}`);
    console.log(`📊 Total Mold Inspectors Collected: ${this.stats.total_collected}`);
    console.log(`📈 Average per City: ${(this.stats.total_collected / this.stats.cities_completed).toFixed(1)}`);
    console.log(`⏱️  Total Duration: ${duration.toFixed(1)} minutes`);
    console.log(`❌ Total Errors: ${this.stats.errors.length}`);
    
    // Save detailed report
    const reportPath = path.join(this.logDir, `mold-mock-collection-report-${Date.now()}.json`);
    await fs.writeJson(reportPath, {
      stats: this.stats,
      inspectors: this.allInspectors,
      errors: this.stats.errors
    }, { spaces: 2 });
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Database summary
    const { count } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n💾 Database Status:`);
    console.log(`   Total Inspectors in Database: ${count}`);
    console.log(`   New Mold Inspectors Added: ${this.stats.total_collected}`);
    
    console.log('\n⚠️  NOTE: This was a MOCK collection for demonstration purposes.');
    console.log('   Real collection would use Firecrawl API for actual data.');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Set up Firecrawl API key in .env.local');
    console.log('   2. Run the real collector: node scripts/top10-mold-collector.js');
    console.log('   3. Monitor progress and adjust search queries as needed');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute collection
if (require.main === module) {
  const collector = new MoldMockCollector();
  
  collector.collectAllCities()
    .then(() => {
      console.log('\n✅ Mold inspector mock collection completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Collection failed:', error);
      process.exit(1);
    });
}

module.exports = MoldMockCollector;