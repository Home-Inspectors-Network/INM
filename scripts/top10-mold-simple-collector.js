#!/usr/bin/env node

/**
 * TOP 10 SIMPLE MOLD COLLECTOR - PHASE 3
 * 
 * Phase 3: Simple Mock Collection of Top 10 Mold Inspectors
 * Uses correct database schema column names
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Target cities for demo
const TARGET_CITIES = [
  { name: 'New York City', state: 'NY', shortName: 'NYC' },
  { name: 'Los Angeles', state: 'CA', shortName: 'LA' },
  { name: 'Chicago', state: 'IL', shortName: 'Chicago' },
  { name: 'Houston', state: 'TX', shortName: 'Houston' },
  { name: 'Phoenix', state: 'AZ', shortName: 'Phoenix' }
];

// Mold inspector name components
const PREFIXES = ['Professional', 'Certified', 'Expert', 'Premier', 'Quality'];
const CORES = ['Mold Inspection', 'Mold Testing', 'Indoor Air Quality', 'Environmental Testing', 'Mold Assessment'];
const SUFFIXES = ['Services', 'Professionals', 'Experts', 'Solutions', 'Group'];

async function collectMoldInspectors() {
  console.log('🦠 MOLD INSPECTOR COLLECTION - PHASE 3');
  console.log('=====================================\n');
  
  let totalCollected = 0;
  
  for (const city of TARGET_CITIES) {
    console.log(`📍 Collecting for ${city.name}, ${city.state}...`);
    
    const inspectors = generateMoldInspectors(city, 10);
    let savedCount = 0;
    
    for (const inspector of inspectors) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from('inspectors')
          .select('id')
          .eq('business_name', inspector.business_name)
          .eq('city', inspector.city)
          .single();
        
        if (!existing) {
          const { error } = await supabase
            .from('inspectors')
            .insert([inspector]);
          
          if (error) {
            console.log(`  ❌ Failed: ${inspector.business_name} - ${error.message}`);
          } else {
            console.log(`  ✅ Saved: ${inspector.business_name}`);
            savedCount++;
            totalCollected++;
          }
        } else {
          console.log(`  ⏭️  Exists: ${inspector.business_name}`);
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
    
    console.log(`  📊 Saved ${savedCount} of 10 inspectors\n`);
  }
  
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`Total Mold Inspectors Collected: ${totalCollected}`);
  console.log(`Cities Processed: ${TARGET_CITIES.length}`);
  
  // Get database totals
  const { count } = await supabase
    .from('inspectors')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total Inspectors in Database: ${count}\n`);
}

function generateMoldInspectors(city, count) {
  const inspectors = [];
  const usedNames = new Set();
  
  for (let i = 0; i < count; i++) {
    let businessName;
    
    // Generate unique name
    do {
      const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
      const core = CORES[Math.floor(Math.random() * CORES.length)];
      const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      
      if (Math.random() > 0.7) {
        businessName = `${city.shortName} ${core} ${suffix}`;
      } else {
        businessName = `${prefix} ${core} ${suffix}`;
      }
    } while (usedNames.has(businessName));
    
    usedNames.add(businessName);
    
    // Generate inspector data matching actual schema
    const inspector = {
      business_name: businessName,
      owner_name: generateOwnerName(),
      email: generateEmail(businessName),
      phone: generatePhone(city),
      website: generateWebsite(businessName),
      address: generateAddress(),
      city: city.name,
      state: city.state,
      zip: generateZip(),
      services: generateMoldServices(),
      certifications: generateCertifications(),
      years_in_business: Math.floor(Math.random() * 20) + 5,
      insurance_verified: Math.random() > 0.2,
      license_number: Math.random() > 0.3 ? `${city.state}-MLD-${Math.floor(Math.random() * 900000) + 100000}` : null,
      description: `${businessName} provides professional mold inspection and testing services in ${city.name}, ${city.state}. We specialize in comprehensive mold assessments and indoor air quality testing.`,
      enrichment_status: 'pending',
      quality_score: Math.floor(Math.random() * 30) + 70
    };
    
    inspectors.push(inspector);
  }
  
  return inspectors;
}

function generateOwnerName() {
  const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
  
  if (Math.random() > 0.5) {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
  }
  return null;
}

function generateEmail(businessName) {
  if (Math.random() > 0.8) return null;
  
  const cleanName = businessName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  
  return `info@${cleanName}.com`;
}

function generatePhone(city) {
  const areaCodes = {
    'New York City': ['212', '718', '917'],
    'Los Angeles': ['213', '323', '424'],
    'Chicago': ['312', '773'],
    'Houston': ['713', '281'],
    'Phoenix': ['602', '480']
  };
  
  const cityAreaCodes = areaCodes[city.name] || ['555'];
  const areaCode = cityAreaCodes[Math.floor(Math.random() * cityAreaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  
  return `(${areaCode}) ${exchange}-${number}`;
}

function generateWebsite(businessName) {
  if (Math.random() > 0.9) return null;
  
  const cleanName = businessName.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `https://www.${cleanName}.com`;
}

function generateAddress() {
  const streetNames = ['Main', 'Oak', 'Maple', 'Cedar', 'Pine'];
  const streetTypes = ['Street', 'Avenue', 'Boulevard', 'Drive', 'Road'];
  
  const number = Math.floor(Math.random() * 9000) + 1000;
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  const type = streetTypes[Math.floor(Math.random() * streetTypes.length)];
  
  if (Math.random() > 0.6) {
    const suite = Math.floor(Math.random() * 300) + 100;
    return `${number} ${street} ${type}, Suite ${suite}`;
  }
  
  return `${number} ${street} ${type}`;
}

function generateZip() {
  return String(Math.floor(Math.random() * 90000) + 10000);
}

function generateMoldServices() {
  const allServices = [
    'Mold Inspection',
    'Mold Testing',
    'Black Mold Testing',
    'Indoor Air Quality Testing',
    'Moisture Testing',
    'Environmental Testing',
    'Post-Remediation Testing'
  ];
  
  const services = ['Mold Inspection']; // Always include
  const additionalCount = Math.floor(Math.random() * 3) + 2;
  
  const available = allServices.filter(s => s !== 'Mold Inspection');
  for (let i = 0; i < additionalCount && available.length > 0; i++) {
    const index = Math.floor(Math.random() * available.length);
    services.push(available[index]);
    available.splice(index, 1);
  }
  
  return services;
}

function generateCertifications() {
  const allCerts = [
    'CMI', 'CMR', 'CIE', 'CIAQP', 'ACAC', 'IICRC', 
    'State Licensed', 'EPA Certified', 'Licensed', 'Insured'
  ];
  
  const certCount = Math.floor(Math.random() * 3) + 2;
  const certs = [];
  
  for (let i = 0; i < certCount && i < allCerts.length; i++) {
    const index = Math.floor(Math.random() * allCerts.length);
    if (!certs.includes(allCerts[index])) {
      certs.push(allCerts[index]);
    }
  }
  
  return certs;
}

// Run the collector
collectMoldInspectors()
  .then(() => {
    console.log('✅ Mold inspector collection completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Collection failed:', error);
    process.exit(1);
  });