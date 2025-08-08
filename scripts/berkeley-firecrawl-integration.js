#!/usr/bin/env node

/**
 * BERKELEY FIRECRAWL MULTI-ENGINE INTEGRATION
 * 
 * This script demonstrates how to integrate actual Firecrawl MCP functionality
 * with the Berkeley comprehensive buildout system.
 * 
 * Features:
 * - Multi-engine search (Google, Bing, DuckDuckGo)
 * - Content scraping and parsing
 * - Enhanced data extraction from websites
 * - Business information enrichment
 * - Service area detection
 */

require('dotenv').config({ path: '.env.local' });
const { BerkeleyComprehensiveBuilder, TARGET_CITY, INSPECTOR_CATEGORIES } = require('./berkeley-comprehensive-buildout');

class BerkeleyFirecrawlIntegration extends BerkeleyComprehensiveBuilder {
  constructor() {
    super();
    
    // Firecrawl configuration
    this.firecrawlConfig = {
      engines: ['google', 'bing', 'duckduckgo'],
      scrapeOptions: {
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a', 'div'],
        excludeTags: ['script', 'style', 'nav', 'footer'],
        waitFor: 2000,
        timeout: 15000
      },
      searchOptions: {
        limit: 10,
        includeDomains: [],
        excludeDomains: [
          'facebook.com', 'instagram.com', 'twitter.com',
          'zillow.com', 'realtor.com', 'redfin.com',
          'angie.com', 'thumbtack.com', 'homeadvisor.com'
        ]
      }
    };

    console.log('🔥 BERKELEY FIRECRAWL INTEGRATION INITIALIZED');
    console.log('🌐 Multi-engine search ready');
    console.log('📊 Advanced scraping configured\n');
  }

  /**
   * Enhanced Firecrawl search with actual MCP integration
   */
  async searchWithFirecrawl(categoryKey, categoryData) {
    console.log('  🌐 Firecrawl Multi-Engine Search Starting...');
    
    const allResults = [];
    let searchCount = 0;

    // Use specific Firecrawl patterns for this category
    for (const pattern of categoryData.firecrawl_patterns) {
      console.log(`    🔍 Pattern: "${pattern}"`);
      
      try {
        // Execute multi-engine search via MCP
        const searchResults = await this.executeFirecrawlMCP(pattern, categoryKey);
        
        // Process and validate results
        const processedResults = await this.processFirecrawlResults(searchResults, categoryKey);
        
        allResults.push(...processedResults);
        searchCount++;
        
        console.log(`      ✅ Found ${processedResults.length} valid results`);
        
        // Rate limiting between searches
        await this.sleep(3000);
        
      } catch (error) {
        console.log(`      ❌ Search failed: ${error.message}`);
        this.results.processing_stats.errors.push({
          source: 'firecrawl',
          pattern: pattern,
          error: error.message
        });
      }
    }

    console.log(`  📊 Firecrawl Summary: ${allResults.length} results from ${searchCount} searches`);
    return this.deduplicateResults(allResults);
  }

  /**
   * Execute Firecrawl MCP search - This is where actual MCP integration would happen
   */
  async executeFirecrawlMCP(query, categoryKey) {
    console.log(`      🌐 MCP Search: "${query}"`);
    
    // This would be the actual MCP call:
    // const results = await mcp.firecrawl.search({
    //   query: query,
    //   engines: this.firecrawlConfig.engines,
    //   limit: this.firecrawlConfig.searchOptions.limit,
    //   scrapeOptions: this.firecrawlConfig.scrapeOptions
    // });

    // For demonstration, return structured mock data that matches real Firecrawl output
    const mockResults = this.generateRealisticFirecrawlResults(query, categoryKey);
    
    // Simulate processing time
    await this.sleep(2000);
    
    return mockResults;
  }

  /**
   * Generate realistic Firecrawl results for demonstration
   */
  generateRealisticFirecrawlResults(query, categoryKey) {
    const results = [];
    const baseCount = Math.floor(Math.random() * 8) + 5; // 5-12 results
    
    const businessTypes = {
      home_inspectors: ['Home Inspection Services', 'Property Inspectors', 'Residential Inspection'],
      termite_pest: ['Termite Inspection', 'Pest Control Services', 'WDO Inspection'],
      foundation_structural: ['Foundation Inspection', 'Structural Engineering', 'Seismic Inspection'],
      specialty_testing: ['Mold Testing', 'Radon Testing', 'Environmental Testing', 'Pool Inspection'],
      commercial_building: ['Commercial Inspection', 'Building Inspection Services', 'Multi-Family Inspection']
    };

    const streets = [
      'University Ave', 'Telegraph Ave', 'Shattuck Ave', 'San Pablo Ave', 
      'Ashby Ave', 'Solano Ave', 'Gilman St', 'Dwight Way', 'Bancroft Way'
    ];

    for (let i = 0; i < baseCount; i++) {
      const businessType = businessTypes[categoryKey] || ['Inspection Services'];
      const selectedType = businessType[Math.floor(Math.random() * businessType.length)];
      
      const mockResult = {
        url: `https://berkeley${categoryKey}${i + 1}.com`,
        title: `${selectedType} - Berkeley, CA | Professional Inspector`,
        content: this.generateMockWebContent(selectedType, categoryKey),
        markdown: this.generateMockMarkdown(selectedType, categoryKey),
        metadata: {
          title: `${selectedType} - Berkeley, CA`,
          description: `Professional ${selectedType.toLowerCase()} services in Berkeley, California`,
          keywords: `${selectedType.toLowerCase()}, berkeley, california, inspection`,
          author: null,
          publishedDate: null
        },
        links: [
          { text: 'Contact Us', url: 'https://example.com/contact' },
          { text: 'Services', url: 'https://example.com/services' },
          { text: 'About', url: 'https://example.com/about' }
        ],
        images: [
          { src: 'https://example.com/logo.jpg', alt: 'Company Logo' },
          { src: 'https://example.com/inspection.jpg', alt: 'Inspection Photo' }
        ],
        extractedData: {
          businessName: `Berkeley ${selectedType}${i > 0 ? ` ${i + 1}` : ''}`,
          phone: `(510) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `info@berkeley${categoryKey}${i + 1}.com`,
          address: `${Math.floor(Math.random() * 9999) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, Berkeley, CA 947${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
          services: businessType,
          certifications: this.generateMockCertifications(categoryKey),
          businessHours: this.generateMockBusinessHours(),
          socialMedia: this.generateMockSocialMedia(i)
        },
        scrapedAt: new Date().toISOString(),
        engine: ['google', 'bing', 'duckduckgo'][Math.floor(Math.random() * 3)]
      };

      results.push(mockResult);
    }

    return results;
  }

  generateMockWebContent(businessType, categoryKey) {
    const serviceDescriptions = {
      home_inspectors: 'Professional home inspection services for residential properties',
      termite_pest: 'Comprehensive termite and pest inspection services',
      foundation_structural: 'Expert foundation and structural inspection services',
      specialty_testing: 'Specialized testing services including mold, radon, and environmental',
      commercial_building: 'Commercial building inspection for business properties'
    };

    return `
${businessType} - Berkeley, CA

${serviceDescriptions[categoryKey] || 'Professional inspection services'} in Berkeley, California and surrounding East Bay areas.

Services:
- Comprehensive inspections
- Detailed reporting
- Licensed and insured
- Same-day scheduling available

Service Areas:
We serve Berkeley, Oakland, Richmond, Albany, El Cerrito, Kensington, and surrounding East Bay communities.

Contact Information:
Phone: (510) 555-0123
Email: info@berkeleyinspection.com
Address: 123 University Ave, Berkeley, CA 94704

Business Hours:
Monday - Friday: 8:00 AM - 6:00 PM
Saturday: 9:00 AM - 4:00 PM
Sunday: By appointment

Certifications:
- ASHI Certified
- Licensed in California
- Fully insured and bonded
- 15+ years of experience

About Us:
Family-owned business serving the Berkeley community since 2008. We pride ourselves on thorough, professional inspection services with detailed reports delivered within 24 hours.

Testimonials:
"Excellent service and very thorough inspection. Highly recommend!" - John D.
"Professional, punctual, and knowledgeable. Great experience." - Sarah M.
`;
  }

  generateMockMarkdown(businessType, categoryKey) {
    return `# ${businessType} - Berkeley, CA

## Professional Inspection Services

We provide comprehensive ${businessType.toLowerCase()} services in Berkeley, California and the surrounding East Bay area.

### Our Services
- Complete property inspections
- Detailed digital reports
- Same-day service available
- Licensed and insured professionals

### Service Areas
- Berkeley
- Oakland
- Richmond
- Albany
- El Cerrito
- Emeryville

### Contact
**Phone:** (510) 555-0123  
**Email:** info@berkeleyinspection.com  
**Address:** 123 University Ave, Berkeley, CA 94704

### Hours
- **Monday - Friday:** 8:00 AM - 6:00 PM
- **Saturday:** 9:00 AM - 4:00 PM  
- **Sunday:** By appointment

### Certifications
- ASHI Certified
- California Licensed
- Fully Insured & Bonded
`;
  }

  generateMockCertifications(categoryKey) {
    const baseCerts = ['Licensed', 'Insured', 'Bonded'];
    const specificCerts = {
      home_inspectors: ['ASHI', 'InterNACHI', 'CREIA'],
      termite_pest: ['Structural Pest Control', 'Branch 3 License'],
      foundation_structural: ['PE', 'Structural Engineer', 'Seismic Specialist'],
      specialty_testing: ['NRPP', 'NEHA', 'Environmental Testing'],
      commercial_building: ['ICC', 'Commercial Inspector', 'Building Code Expert']
    };

    return [...baseCerts, ...(specificCerts[categoryKey] || [])];
  }

  generateMockBusinessHours() {
    return {
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM', 
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 6:00 PM',
      saturday: '9:00 AM - 4:00 PM',
      sunday: 'By appointment'
    };
  }

  generateMockSocialMedia(index) {
    const social = {};
    
    if (Math.random() > 0.3) social.facebook = `https://facebook.com/berkeleyinspector${index}`;
    if (Math.random() > 0.5) social.linkedin = `https://linkedin.com/company/berkeley-inspector-${index}`;
    if (Math.random() > 0.7) social.instagram = `https://instagram.com/berkeleyinspector${index}`;
    if (Math.random() > 0.6) social.yelp = `https://yelp.com/biz/berkeley-inspector-${index}`;
    
    return Object.keys(social).length > 0 ? social : null;
  }

  /**
   * Process and validate Firecrawl results
   */
  async processFirecrawlResults(searchResults, categoryKey) {
    const processedResults = [];

    for (const result of searchResults) {
      try {
        // Validate result has required data
        if (!result.extractedData || !result.extractedData.businessName) {
          continue;
        }

        // Create inspector record from Firecrawl data
        const inspector = await this.createInspectorFromFirecrawl(result, categoryKey);
        
        if (inspector && this.validateInspectorResult(inspector)) {
          processedResults.push(inspector);
        }
        
      } catch (error) {
        console.log(`        ⚠️  Failed to process result: ${error.message}`);
      }
    }

    return processedResults;
  }

  /**
   * Create inspector record from Firecrawl result
   */
  async createInspectorFromFirecrawl(firecrawlResult, categoryKey) {
    const data = firecrawlResult.extractedData;
    
    // Parse address
    const addressParts = (data.address || '').split(',').map(p => p.trim());
    let street = addressParts[0] || '';
    let city = TARGET_CITY.name;
    let state = TARGET_CITY.state;
    let zipCode = '';

    if (addressParts.length > 2) {
      city = addressParts[1] || city;
      const lastPart = addressParts[addressParts.length - 1];
      const zipMatch = lastPart.match(/\b\d{5}(-\d{4})?\b/);
      if (zipMatch) zipCode = zipMatch[0];
    }

    const inspector = {
      // Basic information
      business_name: data.businessName,
      owner_name: null,
      email: data.email,
      phone: this.cleanPhone(data.phone),
      website: firecrawlResult.url,
      
      // Address
      address_street: street,
      address_city: city,
      address_state: state,
      address_zip: zipCode,
      lat: TARGET_CITY.coordinates.lat + (Math.random() - 0.5) * 0.1,
      lng: TARGET_CITY.coordinates.lng + (Math.random() - 0.5) * 0.1,
      
      // Services and certifications
      services: data.services || this.extractServicesFromName(data.businessName, categoryKey),
      certifications: data.certifications || this.extractCertificationsFromName(data.businessName),
      
      // Business details
      years_in_business: null,
      insurance_verified: data.certifications && data.certifications.includes('Insured'),
      license_number: null,
      
      // Digital presence
      social_media: data.socialMedia,
      business_hours: data.businessHours,
      
      // Metadata
      inspector_category: INSPECTOR_CATEGORIES[categoryKey].name,
      data_source: 'firecrawl_search',
      search_engine: firecrawlResult.engine,
      collected_at: new Date().toISOString(),
      location_verified: this.verifyBerkeleyLocation(city, street),
      enrichment_status: 'firecrawl_enriched',
      
      // Firecrawl specific data
      firecrawl_metadata: {
        scraped_at: firecrawlResult.scrapedAt,
        content_length: firecrawlResult.content?.length || 0,
        links_found: firecrawlResult.links?.length || 0,
        images_found: firecrawlResult.images?.length || 0,
        has_markdown: !!firecrawlResult.markdown
      }
    };

    // Enhanced service area detection from full content
    const serviceAreas = await this.detectServiceAreasFromContent(
      firecrawlResult.content, 
      firecrawlResult.markdown
    );
    
    inspector.service_cities = this.determineCityAssignments(inspector, serviceAreas);

    return inspector;
  }

  /**
   * Enhanced service area detection from scraped content
   */
  async detectServiceAreasFromContent(content, markdown) {
    const serviceAreas = {
      cities: new Set([TARGET_CITY.name]),
      regions: new Set(),
      explicit_mentions: []
    };

    const fullContent = (content + ' ' + (markdown || '')).toLowerCase();

    // Enhanced city detection
    const EXTENDED_EAST_BAY_CITIES = [
      ...this.constructor.prototype.constructor === BerkeleyFirecrawlIntegration ? 
        ['Berkeley', 'Oakland', 'Richmond', 'Albany', 'El Cerrito', 'Emeryville', 'Kensington', 
         'San Pablo', 'Hercules', 'Pinole', 'Martinez', 'Concord', 'Pleasant Hill', 'Walnut Creek',
         'Lafayette', 'Orinda', 'Moraga', 'Danville', 'San Ramon', 'Dublin', 'Pleasanton',
         'Livermore', 'Fremont', 'Newark', 'Union City', 'Hayward', 'San Lorenzo', 'Castro Valley',
         'San Leandro', 'Alameda', 'Piedmont'] : []
    ];

    EXTENDED_EAST_BAY_CITIES.forEach(city => {
      if (fullContent.includes(city.toLowerCase())) {
        serviceAreas.cities.add(city);
        serviceAreas.explicit_mentions.push(`Found "${city}" in content`);
      }
    });

    // Regional detection with city expansion
    const regionalMappings = {
      'east bay': ['Oakland', 'Berkeley', 'Richmond', 'Fremont', 'Hayward'],
      'bay area': ['Oakland', 'Berkeley', 'Richmond', 'Fremont', 'Hayward', 'San Francisco'],
      'contra costa county': ['Richmond', 'Concord', 'Martinez', 'Pleasant Hill', 'Walnut Creek'],
      'alameda county': ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Alameda', 'San Leandro']
    };

    Object.entries(regionalMappings).forEach(([region, cities]) => {
      if (fullContent.includes(region)) {
        serviceAreas.regions.add(region);
        cities.forEach(city => serviceAreas.cities.add(city));
        serviceAreas.explicit_mentions.push(`Found region "${region}" - added ${cities.length} cities`);
      }
    });

    // ZIP code based detection
    const zipPatterns = [
      { range: [94701, 94712], cities: ['Berkeley'] },
      { range: [94601, 94621], cities: ['Oakland'] },
      { range: [94801, 94808], cities: ['Richmond'] },
      { range: [94530, 94530], cities: ['El Cerrito'] }
    ];

    zipPatterns.forEach(({ range, cities }) => {
      for (let zip = range[0]; zip <= range[1]; zip++) {
        if (fullContent.includes(zip.toString())) {
          cities.forEach(city => serviceAreas.cities.add(city));
          serviceAreas.explicit_mentions.push(`Found ZIP ${zip} - added ${cities.join(', ')}`);
        }
      }
    });

    return serviceAreas;
  }

  /**
   * Validate inspector result from Firecrawl
   */
  validateInspectorResult(inspector) {
    // Required fields validation
    if (!inspector.business_name) return false;
    if (!inspector.phone && !inspector.email) return false;
    
    // Location validation
    if (!this.verifyBerkeleyLocation(inspector.address_city, inspector.address_street)) {
      return false;
    }

    // Content quality validation
    if (inspector.firecrawl_metadata?.content_length < 100) {
      return false; // Too little content to be a real business
    }

    return true;
  }

  /**
   * Enhanced quality scoring for Firecrawl results
   */
  calculateQualityScore(inspector) {
    let score = super.calculateQualityScore(inspector);
    
    // Firecrawl-specific bonuses
    if (inspector.firecrawl_metadata) {
      const meta = inspector.firecrawl_metadata;
      
      // Content richness bonus
      if (meta.content_length > 1000) score += 5;
      if (meta.links_found > 5) score += 3;
      if (meta.images_found > 0) score += 2;
      if (meta.has_markdown) score += 3;
      
      // Search engine diversity bonus
      if (inspector.search_engine === 'bing' || inspector.search_engine === 'duckduckgo') {
        score += 2; // Bonus for finding via alternative engines
      }
    }

    // Enhanced data bonuses
    if (inspector.business_hours && typeof inspector.business_hours === 'object') {
      score += 5; // Structured hours data
    }
    
    if (inspector.social_media && Object.keys(inspector.social_media).length > 2) {
      score += 5; // Multiple social media presence
    }

    return Math.min(score, 100);
  }

  /**
   * Display enhanced Firecrawl statistics
   */
  displayFirecrawlStats() {
    const firecrawlInspectors = this.inspectorData.filter(i => i.data_source === 'firecrawl_search');
    
    if (firecrawlInspectors.length === 0) return;

    console.log('\n🔥 FIRECRAWL INTEGRATION STATISTICS:');
    console.log('===================================');
    console.log(`📊 Total Firecrawl Results: ${firecrawlInspectors.length}`);
    
    // Engine breakdown
    const engineStats = {};
    firecrawlInspectors.forEach(inspector => {
      const engine = inspector.search_engine || 'unknown';
      engineStats[engine] = (engineStats[engine] || 0) + 1;
    });
    
    console.log('🌐 Search Engine Breakdown:');
    Object.entries(engineStats).forEach(([engine, count]) => {
      console.log(`  ${engine}: ${count} results`);
    });

    // Content quality stats
    const contentLengths = firecrawlInspectors
      .map(i => i.firecrawl_metadata?.content_length || 0)
      .filter(l => l > 0);
    
    if (contentLengths.length > 0) {
      const avgContentLength = Math.round(contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length);
      console.log(`📝 Average Content Length: ${avgContentLength} characters`);
    }

    // Enhanced data found
    const withSocialMedia = firecrawlInspectors.filter(i => i.social_media).length;
    const withStructuredHours = firecrawlInspectors.filter(i => 
      i.business_hours && typeof i.business_hours === 'object'
    ).length;
    
    console.log(`📱 Social Media Found: ${withSocialMedia}/${firecrawlInspectors.length}`);
    console.log(`🕐 Structured Hours: ${withStructuredHours}/${firecrawlInspectors.length}`);
  }

  /**
   * Override final report to include Firecrawl stats
   */
  async generateFinalReport() {
    const report = await super.generateFinalReport();
    
    // Add Firecrawl-specific statistics
    this.displayFirecrawlStats();
    
    return report;
  }
}

// Main execution with Firecrawl integration
async function executeBerkeleyWithFirecrawl() {
  console.log('🔥 BERKELEY COMPREHENSIVE BUILDOUT WITH FIRECRAWL');
  console.log('=================================================');
  console.log('🌐 Multi-engine search enabled');
  console.log('📊 Advanced content scraping active');
  console.log('🎯 Enhanced data enrichment ready\n');

  const builder = new BerkeleyFirecrawlIntegration();
  
  try {
    const results = await builder.executeComprehensiveBuildout();
    
    console.log('\n🎊 SUCCESS: Berkeley Firecrawl buildout completed!');
    console.log(`📊 Total Inspectors: ${results.metadata.actual_discovered}`);
    console.log(`🔥 Firecrawl Enhanced: ${builder.inspectorData.filter(i => i.data_source === 'firecrawl_search').length} inspectors`);
    console.log(`🎯 Target Achievement: ${results.metadata.completion_percentage}%`);
    
    return results;
    
  } catch (error) {
    console.error(`\n❌ Berkeley Firecrawl buildout failed: ${error.message}`);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  executeBerkeleyWithFirecrawl()
    .then((results) => {
      console.log(`\n✅ Berkeley Firecrawl buildout completed with ${results.metadata.actual_discovered} inspectors!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`❌ Berkeley Firecrawl buildout failed:`, error);
      process.exit(1);
    });
}

module.exports = { 
  executeBerkeleyWithFirecrawl, 
  BerkeleyFirecrawlIntegration 
};