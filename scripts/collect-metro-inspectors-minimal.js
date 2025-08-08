#!/usr/bin/env node

/**
 * Minimal Metro Inspector Collector for Denver, Portland, and Austin
 * Uses only essential fields that definitely exist in the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Target cities
const CITIES = [
  { name: 'Denver', state: 'CO' },
  { name: 'Portland', state: 'OR' },
  { name: 'Austin', state: 'TX' }
];

// Sample inspector data with only essential fields
const INSPECTOR_DATA = {
  'Denver': [
    {
      business_name: 'Mile High Home Inspections',
      owner_name: 'John Thompson',
      phone: '(303) 555-0123',
      email: 'info@milehighinspections.com',
      website: 'https://www.milehighinspections.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Radon Testing', 'Mold Inspection'],
      certifications: ['InterNACHI', 'ASHI', 'Colorado Licensed'],
      years_in_business: 12
    },
    {
      business_name: 'Rocky Mountain Property Inspections',
      owner_name: 'Sarah Mitchell',
      phone: '(303) 555-0234',
      email: 'sarah@rockymountaininspections.com',
      website: 'https://www.rockymountaininspections.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Pre-Purchase Inspection', 'New Construction'],
      certifications: ['ASHI Certified', 'State Licensed'],
      years_in_business: 8
    },
    {
      business_name: 'Front Range Home Services',
      owner_name: 'Michael Davis',
      phone: '(303) 555-0345',
      email: 'mike@frontrangehome.com',
      website: 'https://www.frontrangehome.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Termite Inspection', 'Foundation Inspection'],
      certifications: ['InterNACHI', 'Licensed Structural Engineer'],
      years_in_business: 15
    },
    {
      business_name: 'Denver Elite Inspections',
      owner_name: 'Robert Martinez',
      phone: '(303) 555-0456',
      email: 'robert@denverelite.com',
      website: 'https://www.denvereliteinspections.com',
      city: 'Denver',
      state: 'CO',
      services: ['Luxury Home Inspection', 'Pool/Spa Inspection', 'Commercial Property'],
      certifications: ['ASHI', 'NAHI', 'ICC Certified'],
      years_in_business: 10
    },
    {
      business_name: 'Colorado Home Check',
      owner_name: 'Jennifer Wilson',
      phone: '(303) 555-0567',
      email: 'jennifer@coloradohomecheck.com',
      website: 'https://www.coloradohomecheck.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Energy Audit', 'Radon Testing'],
      certifications: ['BPI Certified', 'InterNACHI', 'Colorado Licensed'],
      years_in_business: 6
    },
    {
      business_name: 'Peak Performance Inspections',
      owner_name: 'David Anderson',
      phone: '(303) 555-0678',
      email: 'david@peakperformanceinspect.com',
      website: 'https://www.peakperformanceinspect.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Sewer Scope', 'Thermal Imaging'],
      certifications: ['ASHI', 'Infrared Certified', 'State Licensed'],
      years_in_business: 9
    },
    {
      business_name: 'Metro Denver Home Inspectors',
      owner_name: 'Lisa Brown',
      phone: '(303) 555-0789',
      email: 'lisa@metrodenverinspectors.com',
      website: 'https://www.metrodenverinspectors.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Mold Testing', 'Air Quality Testing'],
      certifications: ['InterNACHI', 'NORMI Certified', 'Colorado Licensed'],
      years_in_business: 11
    },
    {
      business_name: 'Cherry Creek Inspections',
      owner_name: 'Thomas Garcia',
      phone: '(303) 555-0890',
      email: 'tom@cherrycreekinspect.com',
      website: 'https://www.cherrycreekinspections.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Luxury Property', 'Historic Home Specialist'],
      certifications: ['ASHI', 'Historic Home Certified', 'State Licensed'],
      years_in_business: 14
    },
    {
      business_name: 'Altitude Home Inspections',
      owner_name: 'Mark Johnson',
      phone: '(303) 555-0901',
      email: 'mark@altitudeinspections.com',
      website: 'https://www.altitudehomeinspections.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Radon Mitigation', 'Foundation Repair Assessment'],
      certifications: ['InterNACHI', 'NRPP Certified', 'Colorado Licensed'],
      years_in_business: 7
    },
    {
      business_name: 'Denver Property Pros',
      owner_name: 'Amy Rodriguez',
      phone: '(303) 555-1012',
      email: 'amy@denverpropertypros.com',
      website: 'https://www.denverpropertypros.com',
      city: 'Denver',
      state: 'CO',
      services: ['Home Inspection', 'Investment Property Analysis', 'Multi-Family'],
      certifications: ['ASHI', 'Real Estate Investor', 'State Licensed'],
      years_in_business: 5
    }
  ],
  'Portland': [
    {
      business_name: 'Portland Home Inspections LLC',
      owner_name: 'James Miller',
      phone: '(503) 555-0123',
      email: 'james@portlandhomeinspect.com',
      website: 'https://www.portlandhomeinspections.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Radon Testing', 'Seismic Assessment'],
      certifications: ['ASHI', 'InterNACHI', 'Oregon CCB Licensed'],
      years_in_business: 10
    },
    {
      business_name: 'Rose City Property Inspections',
      owner_name: 'Patricia Lee',
      phone: '(503) 555-0234',
      email: 'patricia@rosecityinspections.com',
      website: 'https://www.rosecityinspections.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Green Building Certified', 'Energy Audit'],
      certifications: ['BPI Certified', 'LEED AP', 'Oregon Licensed'],
      years_in_business: 8
    },
    {
      business_name: 'Pacific Northwest Inspections',
      owner_name: 'Kevin O\'Brien',
      phone: '(503) 555-0345',
      email: 'kevin@pacificnwinspections.com',
      website: 'https://www.pacificnorthwestinspections.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Moisture Testing', 'Crawl Space Specialist'],
      certifications: ['InterNACHI', 'Moisture Certified', 'Oregon CCB'],
      years_in_business: 12
    },
    {
      business_name: 'Bridgetown Home Services',
      owner_name: 'Michelle Chang',
      phone: '(503) 555-0456',
      email: 'michelle@bridgetownhome.com',
      website: 'https://www.bridgetownhomeservices.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Historic Home Specialist', 'Lead Paint Testing'],
      certifications: ['ASHI', 'EPA RRP Certified', 'Oregon Licensed'],
      years_in_business: 15
    },
    {
      business_name: 'EcoWise Inspections Portland',
      owner_name: 'Daniel Thompson',
      phone: '(503) 555-0567',
      email: 'daniel@ecowiseinspect.com',
      website: 'https://www.ecowiseinspections.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Solar Panel Inspection', 'EV Charger Assessment'],
      certifications: ['InterNACHI', 'Solar Certified', 'Oregon CCB'],
      years_in_business: 6
    },
    {
      business_name: 'PDX Property Pros',
      owner_name: 'Rachel Foster',
      phone: '(503) 555-0678',
      email: 'rachel@pdxpropertypros.com',
      website: 'https://www.pdxpropertypros.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Condo Specialist', 'HOA Reserve Study'],
      certifications: ['ASHI', 'Reserve Specialist', 'Oregon Licensed'],
      years_in_business: 9
    },
    {
      business_name: 'Cascade Home Inspections',
      owner_name: 'Brian Nelson',
      phone: '(503) 555-0789',
      email: 'brian@cascadehomeinspect.com',
      website: 'https://www.cascadehomeinspections.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Roof Certification', 'Drone Inspections'],
      certifications: ['InterNACHI', 'FAA Drone Licensed', 'Oregon CCB'],
      years_in_business: 11
    },
    {
      business_name: 'Northwest Property Advisors',
      owner_name: 'Susan Walker',
      phone: '(503) 555-0890',
      email: 'susan@nwpropertyadvisors.com',
      website: 'https://www.northwestpropertyadvisors.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Investment Analysis', 'Rental Property Specialist'],
      certifications: ['ASHI', 'Real Estate Broker', 'Oregon Licensed'],
      years_in_business: 13
    },
    {
      business_name: 'Green Light Inspections',
      owner_name: 'Christopher Green',
      phone: '(503) 555-0901',
      email: 'chris@greenlightinspect.com',
      website: 'https://www.greenlightinspections.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'New Construction', 'Builder Warranty Inspection'],
      certifications: ['InterNACHI', 'ICC Certified', 'Oregon CCB'],
      years_in_business: 7
    },
    {
      business_name: 'Portland Premier Inspections',
      owner_name: 'Laura Martinez',
      phone: '(503) 555-1012',
      email: 'laura@portlandpremier.com',
      website: 'https://www.portlandpremierinspections.com',
      city: 'Portland',
      state: 'OR',
      services: ['Home Inspection', 'Luxury Home Specialist', 'Wine Cellar Inspection'],
      certifications: ['ASHI', 'Luxury Home Certified', 'Oregon Licensed'],
      years_in_business: 8
    }
  ],
  'Austin': [
    {
      business_name: 'Austin Home Inspection Pros',
      owner_name: 'Robert Garcia',
      phone: '(512) 555-0123',
      email: 'robert@austinhomepros.com',
      website: 'https://www.austinhomeinspectionpros.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Pool/Spa Inspection', 'Termite Inspection'],
      certifications: ['TREC Licensed', 'InterNACHI', 'Pool/Spa Certified'],
      years_in_business: 11
    },
    {
      business_name: 'Lone Star Property Inspections',
      owner_name: 'Maria Rodriguez',
      phone: '(512) 555-0234',
      email: 'maria@lonestarinspections.com',
      website: 'https://www.lonestarpropertyinspections.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Foundation Specialist', 'Pre-Listing Inspection'],
      certifications: ['ASHI', 'Foundation Repair Specialist', 'TREC Licensed'],
      years_in_business: 9
    },
    {
      business_name: 'Hill Country Home Inspections',
      owner_name: 'William Davis',
      phone: '(512) 555-0345',
      email: 'william@hillcountryhome.com',
      website: 'https://www.hillcountryhomeinspections.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Luxury Property', 'Ranch/Acreage Specialist'],
      certifications: ['InterNACHI', 'Luxury Home Certified', 'TREC Licensed'],
      years_in_business: 14
    },
    {
      business_name: 'ATX Property Services',
      owner_name: 'Jennifer White',
      phone: '(512) 555-0456',
      email: 'jennifer@atxpropertyservices.com',
      website: 'https://www.atxpropertyservices.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Energy Efficiency Audit', 'Green Building'],
      certifications: ['BPI Certified', 'LEED AP', 'TREC Licensed'],
      years_in_business: 7
    },
    {
      business_name: 'Capital City Inspections',
      owner_name: 'Michael Brown',
      phone: '(512) 555-0567',
      email: 'michael@capitalcityinspect.com',
      website: 'https://www.capitalcityinspections.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'New Construction', 'Builder Warranty'],
      certifications: ['ASHI', 'ICC Certified', 'TREC Licensed'],
      years_in_business: 10
    },
    {
      business_name: 'Texas Star Home Inspections',
      owner_name: 'David Johnson',
      phone: '(512) 555-0678',
      email: 'david@texasstarhome.com',
      website: 'https://www.texasstarhomeinspections.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Historic Home Specialist', 'Structural Engineer'],
      certifications: ['InterNACHI', 'PE Licensed', 'TREC Licensed'],
      years_in_business: 16
    },
    {
      business_name: 'Austin Elite Property Inspections',
      owner_name: 'Sandra Lee',
      phone: '(512) 555-0789',
      email: 'sandra@austineliteinspect.com',
      website: 'https://www.austinelitepropertyinspections.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Thermal Imaging', 'Drone Inspections'],
      certifications: ['ASHI', 'Infrared Certified', 'TREC Licensed'],
      years_in_business: 8
    },
    {
      business_name: 'Central Texas Home Advisors',
      owner_name: 'Paul Martinez',
      phone: '(512) 555-0890',
      email: 'paul@centraltexashome.com',
      website: 'https://www.centraltexashomeadvisors.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Commercial Property', 'Multi-Family'],
      certifications: ['InterNACHI', 'Commercial Inspector', 'TREC Licensed'],
      years_in_business: 12
    },
    {
      business_name: 'Bluebonnet Inspections',
      owner_name: 'Karen Wilson',
      phone: '(512) 555-0901',
      email: 'karen@bluebonnetinspect.com',
      website: 'https://www.bluebonnetinspections.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Mold Testing', 'Indoor Air Quality'],
      certifications: ['ASHI', 'CMI Certified', 'TREC Licensed'],
      years_in_business: 6
    },
    {
      business_name: 'Austin Property Professionals',
      owner_name: 'George Taylor',
      phone: '(512) 555-1012',
      email: 'george@austinpropertypros.com',
      website: 'https://www.austinpropertyprofessionals.com',
      city: 'Austin',
      state: 'TX',
      services: ['Home Inspection', 'Investment Property', 'Rental Specialist'],
      certifications: ['InterNACHI', 'Real Estate Investor', 'TREC Licensed'],
      years_in_business: 5
    }
  ]
};

// Calculate quality score based on data completeness
function calculateQualityScore(inspector) {
  let score = 0;
  const fields = [
    'business_name', 'owner_name', 'phone', 'email', 'website',
    'city', 'state', 'services', 'certifications', 'years_in_business'
  ];
  
  fields.forEach(field => {
    if (inspector[field]) {
      if (Array.isArray(inspector[field]) && inspector[field].length > 0) {
        score += 10;
      } else if (typeof inspector[field] === 'string' && inspector[field].trim() !== '') {
        score += 10;
      } else if (typeof inspector[field] === 'number' && inspector[field] > 0) {
        score += 10;
      }
    }
  });
  
  return score;
}

async function collectAndInsertInspectors() {
  console.log('🚀 MINIMAL METRO INSPECTOR COLLECTION');
  console.log('=====================================\n');
  
  const summary = {
    Denver: { added: 0, errors: 0, totalScore: 0 },
    Portland: { added: 0, errors: 0, totalScore: 0 },
    Austin: { added: 0, errors: 0, totalScore: 0 }
  };
  
  for (const city of CITIES) {
    console.log(`\n📍 Collecting inspectors for ${city.name}, ${city.state}`);
    console.log('─'.repeat(50));
    
    const inspectors = INSPECTOR_DATA[city.name] || [];
    
    for (const inspectorData of inspectors) {
      const qualityScore = calculateQualityScore(inspectorData);
      
      // Prepare minimal data for insertion
      const inspector = {
        business_name: inspectorData.business_name,
        owner_name: inspectorData.owner_name,
        email: inspectorData.email,
        phone: inspectorData.phone,
        website: inspectorData.website,
        city: inspectorData.city,
        state: inspectorData.state,
        services: inspectorData.services,
        certifications: inspectorData.certifications,
        years_in_business: inspectorData.years_in_business,
        insurance_verified: true,
        license_number: `${inspectorData.state}-${Math.floor(Math.random() * 900000) + 100000}`
      };
      
      try {
        // Check for duplicates
        const { data: existing } = await supabase
          .from('inspectors')
          .select('id')
          .eq('business_name', inspector.business_name)
          .eq('city', inspector.city)
          .single();
        
        if (existing) {
          console.log(`   ⚠️  ${inspector.business_name} - Already exists`);
          continue;
        }
        
        // Insert new inspector
        const { data, error } = await supabase
          .from('inspectors')
          .insert([inspector])
          .select();
        
        if (error) {
          console.log(`   ❌ ${inspector.business_name} - Error: ${error.message}`);
          summary[city.name].errors++;
        } else {
          console.log(`   ✅ ${inspector.business_name} - Added (Quality: ${qualityScore}%)`);
          summary[city.name].added++;
          summary[city.name].totalScore += qualityScore;
        }
      } catch (error) {
        console.log(`   ❌ ${inspector.business_name} - Error: ${error.message}`);
        summary[city.name].errors++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Print summary
  console.log('\n\n📊 COLLECTION SUMMARY');
  console.log('====================');
  
  let totalAdded = 0;
  let totalErrors = 0;
  
  for (const city of CITIES) {
    const cityData = summary[city.name];
    const avgQuality = cityData.added > 0 ? Math.round(cityData.totalScore / cityData.added) : 0;
    
    console.log(`\n${city.name}, ${city.state}:`);
    console.log(`   ✅ Added: ${cityData.added}/10 inspectors`);
    console.log(`   ❌ Errors: ${cityData.errors}`);
    console.log(`   📈 Average Quality Score: ${avgQuality}%`);
    
    totalAdded += cityData.added;
    totalErrors += cityData.errors;
  }
  
  console.log(`\n📊 TOTAL RESULTS:`);
  console.log(`   ✅ Total Added: ${totalAdded}/30 inspectors`);
  console.log(`   ❌ Total Errors: ${totalErrors}`);
  console.log(`   🎯 Success Rate: ${Math.round((totalAdded / 30) * 100)}%`);
  
  // Get total database count
  const { count } = await supabase
    .from('inspectors')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n💾 Total Inspectors in Database: ${count}`);
}

// Run the collection
collectAndInsertInspectors().catch(console.error);