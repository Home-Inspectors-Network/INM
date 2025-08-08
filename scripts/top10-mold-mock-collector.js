#!/usr/bin/env node

/**
 * TOP 10 MOCK COLLECTOR - PHASE 3 DEMO
 * 
 * Phase 3: Mock Collection of Top 10 Mold Inspectors for 20 Major Cities
 * Simulates data collection without actual API calls for demonstration
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
    console.log(`📍 Target: 20 cities × 10 inspectors = 200 total`);
    console.log(`🎯 Inspector Type: Mold Inspectors`);
    console.log(`⚠️  MODE: Mock Collection (No API calls)`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    for (const city of TARGET_CITIES) {
      await this.collectCityInspectors(city);
      
      // Progress report every 5 cities
      if ((this.stats.cities_completed % 5) === 0 && this.stats.cities_completed > 0) {
        await this.reportProgress();
      }
      
      // Simulate rate limiting
      await this.delay(500);
    }

    await this.finalReport();
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
      this.stats.errors.push({ address_city: city.name, error: error.message });
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
      
      // Generate mock data
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
        license_number: Math.random() > 0.3 ? this.generateLicenseNumber(city.state) : null,
        inspector_type: 'mold',
        enrichment_status: 'pending',
        quality_score: Math.floor(Math.random() * 30) + 70,
        description: this.generateMoldDescription(businessName, city),
        collected_at: new Date().toISOString(),
        data_source: 'mock_top10',
        search_engine: 'mock',
        source_url: `https://example-${businessName.toLowerCase().replace(/\s+/g, '-')}.com`
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
      'Phoenix': ['602', '480', '623'],
      'Philadelphia': ['215', '267', '445'],
      'San Antonio': ['210', '726'],
      'San Diego': ['619', '858', '760'],
      'Dallas': ['214', '469', '972'],
      'San Jose': ['408', '669'],
      'San Francisco': ['415', '628'],
      'Seattle': ['206', '425', '253'],
      'Austin': ['512', '737'],
      'Denver': ['303', '720'],
      'Boston': ['617', '857'],
      'Miami': ['305', '786'],
      'Atlanta': ['404', '470', '678'],
      'Washington': ['202'],
      'Las Vegas': ['702', '725'],
      'Portland': ['503', '971']
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
    // In real implementation, would use actual zip code ranges for each city
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
      'Residential Mold Inspection',
      'Allergen Testing',
      'VOC Testing',
      'Asbestos Testing'
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
      'State Licensed', 'EPA Certified', 'NACHI', 'Licensed', 'Certified', 'Insured'
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

  generateMoldDescription(businessName, city) {
    const templates = [
      `${businessName} is a leading mold inspection and testing company serving ${city.name} and surrounding areas. We specialize in comprehensive mold assessments and indoor air quality testing.`,
      `Professional mold inspection services in ${city.name}. Our certified inspectors use advanced testing equipment to detect mold and moisture issues in residential and commercial properties.`,
      `${businessName} provides expert mold testing and environmental assessments throughout ${city.name}, ${city.state}. We offer detailed reports and recommendations for remediation.`,
      `Certified mold inspectors serving ${city.name} with comprehensive testing services. We identify mold types, moisture sources, and provide actionable remediation plans.`,
      `Trusted mold inspection company in ${city.name} offering air quality testing, surface sampling, and moisture detection. Our reports help protect your health and property.`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
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
          }
        }
        
        this.stats.total_processed++;
        
      } catch (error) {
        console.log(`    ⚠️  Database error for ${inspector.business_name}: ${error.message}`);
      }
    }
    
    return saved;
  }

  async reportProgress() {
    console.log('\n📊 PROGRESS REPORT - MOLD INSPECTORS (MOCK)');
    console.log('===========================================');
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
    
    console.log('\n🎉 MOLD INSPECTOR MOCK COLLECTION COMPLETE!');
    console.log('==========================================');
    console.log(`✅ Cities Completed: ${this.stats.cities_completed}/20`);
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
      .select('*', { count: 'exact', head: true })
      .eq('inspector_type', 'mold');
    
    console.log(`\n💾 Database Status:`);
    console.log(`   Total Mold Inspectors: ${count}`);
    console.log(`   Ready for Enrichment: ${this.stats.total_collected} new inspectors`);
    
    // Overall database summary by type
    const types = ['home', 'termite', 'mold'];
    console.log(`\n📊 Collection Progress by Type:`);
    
    for (const type of types) {
      const { count: typeCount } = await supabase
        .from('inspectors')
        .select('*', { count: 'exact', head: true })
        .eq('inspector_type', type);
      
      console.log(`   ${type.charAt(0).toUpperCase() + type.slice(1)} Inspectors: ${typeCount}`);
    }
    
    // Overall total
    const { count: totalCount } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Total All Inspectors: ${totalCount}`);
    
    console.log('\n⚠️  NOTE: This was a MOCK collection for demonstration purposes.');
    console.log('   Real collection would use Firecrawl API for actual data.');
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