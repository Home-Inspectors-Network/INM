const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// This script demonstrates how to collect top 10 inspectors for a metro
// In production, you would call MCP Firecrawl tools here
class MetroInspectorCollector {
  constructor() {
    this.currentMetro = null;
    this.stats = {
      searched: 0,
      enriched: 0,
      saved: 0,
      errors: 0
    };
  }

  async collectMetro(metroName, state, primaryCity) {
    console.log(`\n🏙️  COLLECTING TOP 10: ${metroName}`);
    console.log('=====================================\n');
    
    this.currentMetro = { name: metroName, state, city: primaryCity };
    
    // Step 1: Search for top inspectors
    console.log(`🔍 Step 1: Searching for "${primaryCity} home inspectors"...`);
    console.log('   [Would use MCP Firecrawl search here]');
    
    // Mock search results for demonstration
    const mockSearchResults = this.generateMockSearchResults(primaryCity, state);
    
    // Step 2: Process and enrich each result
    console.log(`\n📊 Step 2: Processing ${mockSearchResults.length} results...\n`);
    
    for (let i = 0; i < Math.min(mockSearchResults.length, 10); i++) {
      const result = mockSearchResults[i];
      await this.processInspector(result, i + 1);
      await this.delay(500);
    }
    
    this.generateMetroReport();
  }

  generateMockSearchResults(city, state) {
    // In production, this would be actual search results from Firecrawl
    const businessTypes = [
      'Certified', 'Professional', 'Elite', 'Premier', 'Quality',
      'Trusted', 'Expert', 'Reliable', 'Accurate', 'Thorough'
    ];
    
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push({
        business_name: `${businessTypes[i]} Home Inspections ${city}`,
        website: `https://www.${businessTypes[i].toLowerCase()}inspections${city.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: this.generateLocalPhone(state),
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        review_count: Math.floor(Math.random() * 200) + 20
      });
    }
    
    return results;
  }

  async processInspector(searchResult, rank) {
    try {
      console.log(`${rank}. Processing: ${searchResult.business_name}`);
      this.stats.searched++;
      
      // Step 2a: Check if already exists
      const { data: existing } = await supabase
        .from('inspectors')
        .select('id')
        .eq('website', searchResult.website)
        .single();
      
      if (existing) {
        console.log(`   ⚠️  Already in database`);
        return;
      }
      
      // Step 2b: Enrich with website scraping
      console.log(`   🌐 Enriching from website...`);
      console.log(`   [Would use MCP Firecrawl scrape on ${searchResult.website}]`);
      
      // Mock enriched data
      const enrichedData = {
        ...searchResult,
        city: this.currentMetro.city,
        state: this.currentMetro.state,
        email: `info@${searchResult.business_name.toLowerCase().replace(/\s+/g, '')}.com`,
        services: this.generateServices(),
        certifications: this.generateCertifications(),
        service_areas: this.generateServiceAreas(this.currentMetro.city, this.currentMetro.state),
        years_in_business: Math.floor(Math.random() * 20) + 5,
        insurance_verified: Math.random() > 0.3,
        license_number: `${this.currentMetro.state}${Math.floor(Math.random() * 90000) + 10000}`,
        quality_score: this.calculateQualityScore(searchResult),
        slug: this.generateSlug(searchResult.business_name, this.currentMetro.city, this.currentMetro.state),
        created_at: new Date().toISOString()
      };
      
      console.log(`   ✅ Enriched - Quality Score: ${enrichedData.quality_score}`);
      this.stats.enriched++;
      
      // Step 2c: Save to database
      const { error } = await supabase
        .from('inspectors')
        .insert([enrichedData]);
      
      if (error) {
        console.log(`   ❌ Save failed: ${error.message}`);
        this.stats.errors++;
      } else {
        console.log(`   💾 Saved to database`);
        this.stats.saved++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.stats.errors++;
    }
  }

  generateLocalPhone(state) {
    const areaCodes = {
      'NY': ['212', '718', '917', '646'],
      'IL': ['312', '773', '708', '847'],
      'TX': ['214', '469', '713', '281'],
      'PA': ['215', '267', '610'],
      'DC': ['202'],
      'FL': ['305', '786', '954'],
      'GA': ['404', '770', '678'],
      'MA': ['617', '857', '508'],
      'AZ': ['602', '480', '623'],
      'WA': ['206', '425', '253']
    };
    
    const codes = areaCodes[state] || ['555'];
    const areaCode = codes[Math.floor(Math.random() * codes.length)];
    
    return `(${areaCode}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  generateServices() {
    const allServices = [
      'Home Inspection', 'Pre-Purchase Inspection', 'Pre-Sale Inspection',
      'New Construction Inspection', 'Condo Inspection', 'Radon Testing',
      'Mold Inspection', 'Termite Inspection', 'Pool Inspection',
      'Roof Inspection', 'Foundation Inspection', 'HVAC Inspection'
    ];
    
    // Always include basic service plus 2-5 random ones
    const services = ['Home Inspection'];
    const additionalCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < additionalCount; i++) {
      const service = allServices[Math.floor(Math.random() * allServices.length)];
      if (!services.includes(service)) {
        services.push(service);
      }
    }
    
    return services;
  }

  generateCertifications() {
    const certs = ['InterNACHI', 'ASHI', 'State Licensed', 'NAHI', 'CREIA'];
    const count = Math.floor(Math.random() * 3) + 1;
    return certs.slice(0, count);
  }

  generateServiceAreas(primaryCity, state) {
    // Include primary city plus nearby areas
    const areas = [primaryCity];
    
    // Add 3-5 nearby cities
    const nearbyCities = {
      'New York': ['Brooklyn', 'Queens', 'Manhattan', 'Bronx', 'Staten Island'],
      'Chicago': ['Aurora', 'Naperville', 'Evanston', 'Oak Park', 'Skokie'],
      'Houston': ['Pasadena', 'Pearland', 'Sugar Land', 'The Woodlands', 'Katy'],
      'Phoenix': ['Mesa', 'Scottsdale', 'Chandler', 'Tempe', 'Glendale'],
      'Philadelphia': ['Camden', 'Chester', 'Upper Darby', 'Bensalem'],
      'Dallas': ['Fort Worth', 'Arlington', 'Plano', 'Irving', 'Garland']
    };
    
    const nearby = nearbyCities[primaryCity] || ['Nearby City 1', 'Nearby City 2'];
    areas.push(...nearby.slice(0, Math.floor(Math.random() * 3) + 2));
    
    return areas;
  }

  calculateQualityScore(inspector) {
    let score = 50; // Base score for being in top 10
    
    // Add points for various factors
    if (inspector.website) score += 10;
    if (inspector.phone) score += 10;
    if (inspector.rating >= 4.5) score += 10;
    if (inspector.review_count > 50) score += 10;
    if (inspector.review_count > 100) score += 5;
    
    // Random bonus for mock data
    score += Math.floor(Math.random() * 15);
    
    return Math.min(score, 95);
  }

  generateSlug(businessName, city, state) {
    const clean = (str) => str.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${clean(businessName)}-${clean(city)}-${state.toLowerCase()}`;
  }

  generateMetroReport() {
    console.log(`\n📊 ${this.currentMetro.name.toUpperCase()} COLLECTION SUMMARY`);
    console.log('=====================================');
    console.log(`🔍 Searched: ${this.stats.searched}`);
    console.log(`✨ Enriched: ${this.stats.enriched}`);
    console.log(`💾 Saved: ${this.stats.saved}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    
    const successRate = this.stats.searched > 0 
      ? Math.round((this.stats.saved / this.stats.searched) * 100) 
      : 0;
    
    console.log(`📈 Success Rate: ${successRate}%`);
    
    console.log(`\n💰 REVENUE OPPORTUNITY:`);
    console.log(`   Top 3 Premium Slots: $79-$399/month`);
    console.log(`   Average: $239/month × 3 = $717/month`);
    console.log(`   Annual: $8,604 per metro`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage for one metro
async function collectSingleMetro() {
  const collector = new MetroInspectorCollector();
  
  // Example: Collect New York
  await collector.collectMetro('New York Metro', 'NY', 'New York');
  
  // You would call this for each metro:
  // await collector.collectMetro('Chicago Metro', 'IL', 'Chicago');
  // await collector.collectMetro('Houston Metro', 'TX', 'Houston');
  // etc.
}

// Execute if called directly
if (require.main === module) {
  collectSingleMetro().catch(console.error);
}

module.exports = MetroInspectorCollector;