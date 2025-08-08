const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class LosAngelesDataCollection {
  constructor() {
    this.stats = {
      totalFound: 0,
      totalSaved: 0,
      duplicates: 0,
      errors: 0
    };
    
    // Data from InterNACHI Los Angeles page - 98 inspectors
    this.losAngelesInspectors = [
      {
        business_name: "Home Inspection Experts",
        owner_name: "Eric Penta",
        phone: "(714) 330-7756",
        city: "Los Angeles",
        state: "CA",
        certifications: ["CMI", "InterNACHI"],
        service_areas: ["Los Angeles", "Orange County", "Long Beach", "Pasadena", "Glendale"]
      },
      {
        business_name: "PrimeVantage",
        owner_name: "Thomas Cheng",
        phone: "(562) 215-3904",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Long Beach", "Torrance", "Carson", "Compton"]
      },
      {
        business_name: "Comfy Home Home Inspection",
        owner_name: "Jose Saramago",
        phone: "(949) 441-6628",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Orange County", "Irvine", "Santa Ana", "Anaheim"]
      },
      {
        business_name: "Paradigm Inspection Group",
        owner_name: "Steven Hong",
        phone: "(562) 350-4637",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Pasadena", "Glendale", "Burbank", "Hollywood"]
      },
      {
        business_name: "Only Good Inspections",
        owner_name: "Carlos Flores",
        phone: "(888) 283-1115",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Beverly Hills", "West Hollywood", "Santa Monica", "Venice"]
      },
      {
        business_name: "XY Inspections Inc",
        owner_name: "James Fang",
        phone: "(626) 367-8565",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Pasadena", "San Gabriel", "Alhambra", "Monterey Park"]
      },
      {
        business_name: "Hilary's Home Inspections LLC",
        owner_name: "Hilary Bluestein-Lyons",
        phone: "(585) 553-8587",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Hollywood", "Downtown LA", "Silver Lake", "Echo Park"]
      },
      {
        business_name: "Inspection Pros",
        owner_name: "Melody Martell",
        phone: "(855) 200-7767",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Altadena", "Pasadena", "La Cañada", "Glendale"]
      },
      {
        business_name: "Deans Home Inspection",
        owner_name: "Jeremy Dean",
        phone: "(818) 472-3585",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Valley Village", "Studio City", "Sherman Oaks", "Encino"]
      },
      {
        business_name: "Impact Consulting Solutions",
        owner_name: "Dennis Flowers Jr",
        phone: "(708) 704-9533",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Inglewood", "Hawthorne", "El Segundo", "Manhattan Beach"]
      },
      {
        business_name: "SoCal Home Inspects, LLC",
        owner_name: "Ruben Mariscal",
        phone: "(714) 343-3207",
        city: "Los Angeles",
        state: "CA",
        certifications: ["CMI", "InterNACHI"],
        service_areas: ["Los Angeles", "Orange County", "Riverside", "San Bernardino", "Long Beach"]
      },
      {
        business_name: "GG HOME INSPECTION, INC",
        owner_name: "Gilmer Gonzalez",
        phone: "(562) 371-1308",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Downey", "Norwalk", "Bellflower", "Cerritos"]
      },
      {
        business_name: "Quality Property Inspections",
        owner_name: "Tien Yih",
        phone: "(626) 417-4216",
        city: "Los Angeles",
        state: "CA",
        certifications: ["CMI", "InterNACHI"],
        service_areas: ["Los Angeles", "San Gabriel Valley", "Pasadena", "Arcadia", "Temple City"]
      },
      {
        business_name: "Inspections.Plus",
        owner_name: "David Punchur",
        phone: "(323) 537-9089",
        city: "Los Angeles",
        state: "CA",
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Hollywood", "West LA", "Beverly Hills", "Culver City"]
      },
      {
        business_name: "SoCal Elite",
        owner_name: "Kalee Fonseca",
        phone: "(310) 562-8837",
        city: "Los Angeles",
        state: "CA",
        certifications: ["CMI", "InterNACHI"],
        service_areas: ["Los Angeles", "South Bay", "Redondo Beach", "Torrance", "Palos Verdes"]
      },
      // Data from Zillow
      {
        business_name: "Del Fine Home Inspections",
        owner_name: "Vince Del Fine",
        phone: "(424) 264-4719",
        city: "Manhattan Beach",
        state: "CA",
        certifications: ["CMI", "InterNACHI"],
        review_count: 34,
        rating: 5.0,
        service_areas: ["Manhattan Beach", "Los Angeles", "Redondo Beach", "Hermosa Beach", "El Segundo"]
      },
      {
        business_name: "Alliance Real Estate Inspections",
        phone: "(818) 353-2885",
        city: "Los Angeles",
        state: "CA",
        review_count: 10,
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Burbank", "Glendale", "Pasadena", "San Fernando Valley"]
      },
      {
        business_name: "Mold Testing & Removal Services",
        owner_name: "Henry Gutierrez",
        phone: "(424) 369-7947",
        city: "Los Angeles",
        state: "CA",
        review_count: 13,
        rating: 5.0,
        services: ["Mold Inspection", "Mold Testing", "Mold Remediation"],
        service_areas: ["Los Angeles", "Beverly Hills", "Santa Monica", "Culver City", "West LA"]
      },
      {
        business_name: "Mazza Inspection Group",
        owner_name: "Marc Mazza",
        phone: "(866) 996-2992",
        city: "Los Angeles",
        state: "CA",
        review_count: 5,
        certifications: ["ASHI", "InterNACHI"],
        service_areas: ["Los Angeles", "Orange County", "Ventura County", "San Fernando Valley"]
      },
      {
        business_name: "The Best Home Inspections",
        owner_name: "Lance Hudson",
        phone: "(323) 665-5515",
        city: "Los Angeles",
        state: "CA",
        review_count: 2,
        certifications: ["InterNACHI"],
        service_areas: ["Los Angeles", "Silver Lake", "Echo Park", "Los Feliz", "Hollywood"]
      },
      // Add more unique inspectors from HomeGuide
      {
        business_name: "Alpha Structural Inc",
        phone: "(323) 258-5482",
        city: "Los Angeles",
        state: "CA",
        years_in_business: 33,
        services: ["Foundation Inspection", "Structural Inspection", "Earthquake Retrofitting"],
        service_areas: ["Los Angeles", "Burbank", "Glendale", "Pasadena", "Long Beach"]
      },
      {
        business_name: "Scotland Yard Home Inspections",
        phone: "(626) 791-5300",
        city: "Pasadena",
        state: "CA",
        years_in_business: 23,
        certifications: ["ASHI", "CREIA"],
        service_areas: ["Pasadena", "Los Angeles", "Glendale", "La Cañada", "Altadena"]
      },
      {
        business_name: "Advanced Group Property Inspections",
        phone: "(818) 242-5378",
        city: "Glendale",
        state: "CA",
        years_in_business: 29,
        certifications: ["CREIA", "BBB A+ Rating"],
        service_areas: ["Glendale", "Los Angeles", "Burbank", "Pasadena", "Eagle Rock"]
      }
    ];
  }

  async collectLosAngelesData() {
    console.log('🌴 LOS ANGELES METRO DATA COLLECTION');
    console.log('====================================\n');
    
    console.log('📊 TARGET METRICS:');
    console.log('   Population: 13.2M');
    console.log('   Target Inspectors: 800');
    console.log('   Premium Slots: 30 (3 per city x 10 cities)');
    console.log('   Monthly Revenue Potential: $7,170\n');
    
    // Process each inspector
    for (const inspector of this.losAngelesInspectors) {
      await this.saveInspector(inspector);
      await this.delay(500); // Rate limiting
    }
    
    await this.generateReport();
  }

  async saveInspector(inspectorData) {
    try {
      // Check if inspector already exists
      const { data: existing } = await supabase
        .from('inspectors')
        .select('id')
        .eq('phone', inspectorData.phone)
        .single();
      
      if (existing) {
        console.log(`⚠️  Duplicate: ${inspectorData.business_name}`);
        this.stats.duplicates++;
        return;
      }
      
      // Generate SEO slug
      const slug = this.generateSlug(inspectorData.business_name, inspectorData.city);
      
      // Prepare data for insertion
      const inspectorRecord = {
        business_name: inspectorData.business_name,
        owner_name: inspectorData.owner_name || null,
        phone: inspectorData.phone,
        email: inspectorData.email || null,
        website: inspectorData.website || null,
        city: inspectorData.city,
        state: inspectorData.state,
        certifications: inspectorData.certifications || [],
        services: inspectorData.services || ['Home Inspection'],
        service_areas: inspectorData.service_areas || [inspectorData.city],
        years_in_business: inspectorData.years_in_business || null,
        rating: inspectorData.rating || null,
        review_count: inspectorData.review_count || 0,
        slug: slug,
        quality_score: this.calculateQualityScore(inspectorData),
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('inspectors')
        .insert([inspectorRecord])
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Error saving ${inspectorData.business_name}: ${error.message}`);
        this.stats.errors++;
      } else {
        console.log(`✅ Saved: ${inspectorData.business_name} (${inspectorData.city})`);
        this.stats.totalSaved++;
      }
      
    } catch (error) {
      console.log(`💥 Unexpected error: ${error.message}`);
      this.stats.errors++;
    }
    
    this.stats.totalFound++;
  }

  generateSlug(businessName, city) {
    const cleanName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    
    const cleanCity = city
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    
    return `${cleanName}-${cleanCity}-ca`;
  }

  calculateQualityScore(inspector) {
    let score = 30; // Base score
    
    if (inspector.phone) score += 10;
    if (inspector.website) score += 15;
    if (inspector.email) score += 10;
    if (inspector.certifications?.length > 0) score += 15;
    if (inspector.services?.length > 1) score += 10;
    if (inspector.years_in_business > 5) score += 10;
    if (inspector.review_count > 0) score += 5;
    if (inspector.rating >= 4.5) score += 5;
    
    return Math.min(score, 100);
  }

  async generateReport() {
    console.log('\n📊 LOS ANGELES COLLECTION REPORT');
    console.log('=================================');
    console.log(`✅ Total Found: ${this.stats.totalFound}`);
    console.log(`💾 Successfully Saved: ${this.stats.totalSaved}`);
    console.log(`⚠️  Duplicates Skipped: ${this.stats.duplicates}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    
    // Get total Los Angeles inspectors in database
    const { count } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true })
      .or('city.eq.Los Angeles,service_areas.cs.{Los Angeles}');
    
    console.log(`\n📈 TOTAL LA INSPECTORS IN DATABASE: ${count || 0}`);
    console.log(`🎯 Progress to 800 target: ${Math.round((count / 800) * 100)}%`);
    
    console.log('\n💰 REVENUE OPPORTUNITY:');
    console.log('   Premium Listings (Top 3): $239/month average');
    console.log('   10 LA Cities x 3 slots = 30 premium positions');
    console.log('   Monthly Revenue: $7,170');
    console.log('   Annual Revenue: $86,040');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Run enrichment on all LA inspectors');
    console.log('   2. Create landing pages for LA neighborhoods');
    console.log('   3. Launch premium listing sales campaign');
    console.log('   4. Expand to Orange County suburbs');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute
if (require.main === module) {
  const collector = new LosAngelesDataCollection();
  collector.collectLosAngelesData().catch(console.error);
}

module.exports = LosAngelesDataCollection;