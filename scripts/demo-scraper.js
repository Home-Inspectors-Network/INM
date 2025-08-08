const fs = require('fs-extra');
const path = require('path');

// Demo data generator for testing the scraping system
class DemoInspectorGenerator {
  constructor() {
    this.businesses = [
      'Accurate Home Inspections',
      'Premier Property Inspection Services',
      'HomeGuard Inspection Company',
      'Quality First Home Inspectors',
      'Reliable Residential Inspections',
      'TrustPoint Home Inspection',
      'Eagle Eye Property Inspections',
      'Complete Home Inspection Services',
      'Professional Property Evaluations',
      'SafeCheck Home Inspections',
      'AllClear Inspection Services',
      'Certified Property Inspectors',
      'Detailed Home Inspection Co.',
      'Thorough Property Assessments',
      'First Choice Home Inspections'
    ];

    this.firstNames = [
      'John', 'Michael', 'David', 'Robert', 'James', 'William', 'Christopher',
      'Mark', 'Steven', 'Paul', 'Andrew', 'Kenneth', 'Daniel', 'Brian', 'Thomas'
    ];

    this.lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
    ];

    this.streets = [
      'Main Street', 'Oak Avenue', 'Pine Road', 'Maple Drive', 'Cedar Lane',
      'Elm Street', 'Park Avenue', 'First Street', 'Second Avenue', 'Third Street',
      'Church Road', 'School Street', 'Washington Avenue', 'Lincoln Drive', 'Madison Street'
    ];

    this.certifications = [
      ['ASHI', 'InterNACHI'],
      ['InterNACHI'],
      ['ASHI'],
      ['NAHI', 'CREIA'],
      ['ICC', 'ASHI'],
      ['InterNACHI', 'NACHI'],
      ['Certified', 'Licensed'],
      ['AHIT'],
      ['IAEI', 'ICC'],
      ['Licensed']
    ];

    this.services = [
      ['Home Inspection', 'Radon Testing'],
      ['Home Inspection', 'Mold Testing', 'Termite Inspection'],
      ['Residential Inspection', 'New Construction Inspection'],
      ['Home Inspection', 'Well Water Testing'],
      ['Property Inspection', 'Septic Inspection'],
      ['Home Inspection', 'Pool Inspection', 'HVAC Inspection'],
      ['Residential Inspection', 'Electrical Inspection'],
      ['Home Inspection', 'Plumbing Inspection'],
      ['Property Inspection', 'Roof Inspection'],
      ['Home Inspection', 'Foundation Inspection']
    ];

    this.domains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
      'homeinspections.com', 'propertycheck.com', 'inspection.net'
    ];
  }

  generatePhoneNumber() {
    const areaCodes = ['205', '251', '256', '334', '907', '480', '520', '602', '623', '928'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${exchange}-${number}`;
  }

  generateEmail(name) {
    const domain = this.domains[Math.floor(Math.random() * this.domains.length)];
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const variants = [
      `${cleanName}@${domain}`,
      `${cleanName}.inspection@${domain}`,
      `${cleanName}${Math.floor(Math.random() * 100)}@${domain}`,
      `info@${cleanName}.com`,
      `contact@${cleanName}inspections.com`
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  generateWebsite(businessName) {
    const cleanName = businessName.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/inspection[s]?/g, '')
      .replace(/home/g, '')
      .replace(/property/g, '');
    
    const variants = [
      `https://www.${cleanName}inspections.com`,
      `https://${cleanName}home.com`,
      `https://www.${cleanName}property.net`,
      `https://${cleanName}.com`,
      null // Some don't have websites
    ];
    
    return variants[Math.floor(Math.random() * variants.length)];
  }

  generateCoordinates(city, state) {
    // Approximate coordinates for demo purposes
    const coords = {
      'Birmingham': { lat: 33.5186, lng: -86.8104 },
      'Mobile': { lat: 30.6954, lng: -88.0399 },
      'Denver': { lat: 39.7392, lng: -104.9903 },
      'Atlanta': { lat: 33.7490, lng: -84.3880 },
      'Boise': { lat: 43.6150, lng: -116.2023 }
    };

    const baseCoord = coords[city] || { lat: 40.0, lng: -98.0 };
    
    // Add some random variation
    return {
      lat: baseCoord.lat + (Math.random() - 0.5) * 0.1,
      lng: baseCoord.lng + (Math.random() - 0.5) * 0.1
    };
  }

  generateInspector(city, state) {
    const businessName = this.businesses[Math.floor(Math.random() * this.businesses.length)];
    const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    const ownerName = `${firstName} ${lastName}`;
    
    const streetNum = Math.floor(Math.random() * 9999) + 1;
    const street = this.streets[Math.floor(Math.random() * this.streets.length)];
    const zip = Math.floor(Math.random() * 90000) + 10000;
    
    const coords = this.generateCoordinates(city, state);
    
    return {
      business_name: businessName,
      owner_name: ownerName,
      email: this.generateEmail(firstName + lastName),
      phone: this.generatePhoneNumber(),
      website: this.generateWebsite(businessName),
      address_street: `${streetNum} ${street}`,
      address_city: city,
      address_state: state,
      address_zip: zip.toString(),
      lat: coords.lat,
      lng: coords.lng,
      certifications: this.certifications[Math.floor(Math.random() * this.certifications.length)],
      services: this.services[Math.floor(Math.random() * this.services.length)],
      years_in_business: Math.floor(Math.random() * 25) + 1,
      license_number: Math.random() > 0.7 ? `LIC${Math.floor(Math.random() * 100000)}` : null,
      insurance_verified: Math.random() > 0.3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

async function generateDemoData() {
  console.log('🎯 Generating demo inspector data for testing...\n');

  const generator = new DemoInspectorGenerator();
  const states = ['AL', 'CO', 'GA', 'ID', 'MI'];
  const cities = {
    'AL': ['Birmingham', 'Mobile'],
    'CO': ['Denver', 'Colorado Springs'],
    'GA': ['Atlanta', 'Augusta'],
    'ID': ['Boise', 'Meridian'],
    'MI': ['Detroit', 'Grand Rapids']
  };

  const inspectors = [];
  let totalGenerated = 0;

  for (const state of states) {
    for (const city of cities[state]) {
      const inspectorsPerCity = Math.floor(Math.random() * 15) + 10; // 10-25 per city
      
      console.log(`Generating ${inspectorsPerCity} inspectors for ${city}, ${state}`);
      
      for (let i = 0; i < inspectorsPerCity; i++) {
        const inspector = generator.generateInspector(city, state);
        inspectors.push(inspector);
        totalGenerated++;
      }
    }
  }

  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '..', 'logs');
  await fs.ensureDir(logsDir);

  // Save demo data
  const demoDataPath = path.join(logsDir, 'demo-inspector-data.json');
  await fs.writeJson(demoDataPath, {
    metadata: {
      generated: new Date().toISOString(),
      total_inspectors: totalGenerated,
      states_covered: states.length,
      cities_covered: Object.values(cities).flat().length
    },
    inspectors
  }, { spaces: 2 });

  // Generate CSV for easy import
  const csvHeaders = [
    'business_name', 'owner_name', 'email', 'phone', 'website',
    'address_street', 'address_city', 'address_state', 'address_zip',
    'lat', 'lng', 'certifications', 'services', 'years_in_business',
    'license_number', 'insurance_verified'
  ];

  const csvRows = inspectors.map(inspector => {
    return csvHeaders.map(header => {
      let value = inspector[header];
      if (Array.isArray(value)) {
        value = value.join('; ');
      }
      if (value === null || value === undefined) {
        value = '';
      }
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
  const csvPath = path.join(logsDir, 'demo-inspector-data.csv');
  await fs.writeFile(csvPath, csvContent);

  // Generate summary statistics
  const summary = {
    total_inspectors: totalGenerated,
    by_state: {},
    by_certification: {},
    by_service: {},
    avg_years_experience: inspectors.reduce((sum, i) => sum + i.years_in_business, 0) / totalGenerated,
    phone_coverage: (inspectors.filter(i => i.phone).length / totalGenerated * 100).toFixed(1),
    email_coverage: (inspectors.filter(i => i.email).length / totalGenerated * 100).toFixed(1),
    website_coverage: (inspectors.filter(i => i.website).length / totalGenerated * 100).toFixed(1),
    insurance_verified: (inspectors.filter(i => i.insurance_verified).length / totalGenerated * 100).toFixed(1)
  };

  // Calculate state distribution
  for (const state of states) {
    summary.by_state[state] = inspectors.filter(i => i.address_state === state).length;
  }

  // Calculate certification distribution
  const allCertifications = inspectors.flatMap(i => i.certifications);
  summary.by_certification = allCertifications.reduce((acc, cert) => {
    acc[cert] = (acc[cert] || 0) + 1;
    return acc;
  }, {});

  // Calculate service distribution
  const allServices = inspectors.flatMap(i => i.services);
  summary.by_service = allServices.reduce((acc, service) => {
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});

  const summaryPath = path.join(logsDir, 'demo-data-summary.json');
  await fs.writeJson(summaryPath, summary, { spaces: 2 });

  // Output results
  console.log('\n✅ Demo data generation complete!');
  console.log(`📊 Generated ${totalGenerated} inspector records`);
  console.log(`📁 Data saved to: ${demoDataPath}`);
  console.log(`📄 CSV saved to: ${csvPath}`);
  console.log(`📋 Summary saved to: ${summaryPath}`);
  
  console.log('\n📈 Quick Statistics:');
  console.log(`   • States covered: ${states.length}`);
  console.log(`   • Cities covered: ${Object.values(cities).flat().length}`);
  console.log(`   • Average years experience: ${summary.avg_years_experience.toFixed(1)}`);
  console.log(`   • Phone coverage: ${summary.phone_coverage}%`);
  console.log(`   • Email coverage: ${summary.email_coverage}%`);
  console.log(`   • Website coverage: ${summary.website_coverage}%`);

  console.log('\n🔧 Next Steps:');
  console.log('   1. Configure your .env file with real API keys');
  console.log('   2. Run "npm run test-env" to verify environment');
  console.log('   3. Run "npm run scrape" to collect real data');
  console.log('   4. Run "npm run verify" to check data quality');

  return {
    success: true,
    totalGenerated,
    files: {
      json: demoDataPath,
      csv: csvPath,
      summary: summaryPath
    }
  };
}

// Export for module use
module.exports = {
  generateDemoData,
  DemoInspectorGenerator
};

// Run if called directly
if (require.main === module) {
  generateDemoData().catch(error => {
    console.error('❌ Demo generation failed:', error);
    process.exit(1);
  });
}