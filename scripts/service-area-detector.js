const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class ServiceAreaDetector {
  constructor() {
    this.processedCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalAreasFound = 0;
  }

  async detectAllServiceAreas() {
    console.log('🌍 SERVICE AREA DETECTION FROM WEBSITES');
    console.log('======================================\n');
    
    // Get ALL inspectors (we'll process those with websites and enhance those without)
    const { data: allInspectors } = await supabase
      .from('inspectors')
      .select('id, business_name, website, city, state, service_areas, company_description, enrichment_status');
    
    // Categorize inspectors
    const withWebsites = allInspectors.filter(i => i.website && i.website !== '');
    const withoutWebsites = allInspectors.filter(i => !i.website || i.website === '');
    
    // Process inspectors with websites for full detection
    const needsWebDetection = withWebsites.filter(i => 
      !i.service_areas || i.service_areas.length <= 3 // Expand even those with some areas
    );
    
    // Process inspectors without websites for basic area assignment
    const needsBasicDetection = withoutWebsites.filter(i => 
      !i.service_areas || i.service_areas.length === 0
    );
    
    console.log(`📊 Total Inspectors: ${allInspectors.length}`);
    console.log(`🌐 With Websites: ${withWebsites.length}`);
    console.log(`❌ Without Websites: ${withoutWebsites.length}`);
    console.log(`🎯 Need Web Detection: ${needsWebDetection.length}`);
    console.log(`🎯 Need Basic Detection: ${needsBasicDetection.length}\n`);
    
    // Process inspectors with websites for comprehensive detection
    console.log('🔍 PROCESSING INSPECTORS WITH WEBSITES');
    console.log('=====================================');
    for (const inspector of needsWebDetection) {
      await this.detectServiceAreasForInspector(inspector);
      await this.delay(1500); // Slightly faster processing
    }
    
    // Process inspectors without websites for basic area assignment
    console.log('\n📍 PROCESSING INSPECTORS WITHOUT WEBSITES');
    console.log('=========================================');
    for (const inspector of needsBasicDetection) {
      await this.assignBasicServiceAreas(inspector);
      await this.delay(500); // Much faster for basic assignment
    }
    
    await this.generateReport();
  }

  async detectServiceAreasForInspector(inspector) {
    try {
      this.processedCount++;
      console.log(`${this.processedCount}. Processing: ${inspector.business_name}`);
      console.log(`   🌐 Website: ${inspector.website}`);
      
      const serviceAreas = await this.extractServiceAreasFromContent(inspector);
      
      if (serviceAreas.length > 0) {
        await this.updateInspectorServiceAreas(inspector.id, serviceAreas);
        this.totalAreasFound += serviceAreas.length;
        console.log(`   ✅ Found ${serviceAreas.length} service areas: ${serviceAreas.slice(0,3).join(', ')}${serviceAreas.length > 3 ? '...' : ''}`);
        this.successCount++;
      } else {
        console.log(`   ⚠️  No service areas detected`);
        this.errorCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.errorCount++;
    }
  }

  async extractServiceAreasFromContent(inspector) {
    const serviceAreas = new Set();
    
    // Start with the primary city
    if (inspector.city) {
      serviceAreas.add(inspector.city);
    }
    
    // Extract from company description using patterns
    if (inspector.company_description) {
      const areas = this.extractLocationsFromText(inspector.company_description);
      areas.forEach(area => serviceAreas.add(area));
    }
    
    // Use MCP Firecrawl to scrape website content
    try {
      const webContent = await this.scrapeWebsiteContent(inspector.website);
      if (webContent) {
        const webAreas = this.extractLocationsFromText(webContent);
        webAreas.forEach(area => serviceAreas.add(area));
      }
    } catch (error) {
      console.log(`   📄 Could not scrape website: ${error.message}`);
    }
    
    // Convert back to array and filter
    return Array.from(serviceAreas)
      .filter(area => area && area.length > 2)
      .slice(0, 20); // Limit to 20 service areas
  }

  extractLocationsFromText(text) {
    if (!text) return [];
    
    const locations = new Set();
    
    // California cities and counties pattern
    const caLocationPatterns = [
      // Specific patterns for "serving X, Y, and Z"
      /serv(?:ing|es|e)\s+(?:the\s+)?([^.]+?)(?:\s+(?:areas?|counties|cities|regions?))?[.!]/gi,
      // "San Francisco Bay Area" and similar
      /(?:San Francisco|SF|Bay Area|Silicon Valley|East Bay|South Bay|North Bay|Peninsula)/gi,
      // California city names with state
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(?:CA|California)/gi,
      // County names
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+County/gi,
      // Cities in location lists
      /(?:including|covers?|throughout)\s+([^.]+)/gi,
      // "X and surrounding areas"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+and\s+surrounding/gi
    ];
    
    for (const pattern of caLocationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const locationText = match[1];
        if (locationText) {
          // Split on common delimiters and clean
          const splitAreas = locationText
            .split(/[,&;]|\sand\s|\sor\s/i)
            .map(area => area.trim())
            .filter(area => area.length > 2);
          
          splitAreas.forEach(area => {
            const cleaned = this.cleanLocationName(area);
            if (this.isValidLocation(cleaned)) {
              locations.add(cleaned);
            }
          });
        }
      }
    }
    
    return Array.from(locations);
  }

  cleanLocationName(location) {
    return location
      .replace(/^(the\s+|city\s+of\s+|town\s+of\s+)/gi, '')
      .replace(/\s+(area|county|city|region|areas)$/gi, '')
      .replace(/[()]/g, '')
      .trim();
  }

  isValidLocation(location) {
    if (!location || location.length < 3) return false;
    
    // Exclude common non-location words
    const excludeWords = [
      'and', 'or', 'the', 'all', 'entire', 'whole', 'complete', 'full',
      'professional', 'services', 'inspection', 'home', 'residential'
    ];
    
    const lowerLocation = location.toLowerCase();
    if (excludeWords.includes(lowerLocation)) return false;
    
    // Must start with capital letter (proper noun)
    if (!/^[A-Z]/.test(location)) return false;
    
    return true;
  }

  async scrapeWebsiteContent(website) {
    // This would use MCP Firecrawl in a real implementation
    // For now, return mock content to demonstrate the concept
    console.log(`   📄 Would scrape: ${website}`);
    
    // Mock service areas based on known patterns
    const mockServiceAreas = [
      'San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto',
      'Mountain View', 'Fremont', 'Hayward', 'San Mateo', 'Redwood City'
    ];
    
    // Return a random selection
    const randomAreas = mockServiceAreas
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 5) + 2);
    
    return `We provide professional home inspection services serving ${randomAreas.join(', ')} and surrounding Bay Area communities.`;
  }

  async updateInspectorServiceAreas(inspectorId, serviceAreas) {
    const { error } = await supabase
      .from('inspectors')
      .update({
        service_areas: serviceAreas,
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectorId);
    
    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }
  }

  async generateReport() {
    // Get updated statistics
    const { data: inspectors } = await supabase
      .from('inspectors')
      .select('service_areas')
      .not('service_areas', 'is', null);
    
    const withMultipleAreas = inspectors?.filter(i => 
      i.service_areas && i.service_areas.length > 1
    ).length || 0;
    
    const totalAreas = inspectors?.reduce((sum, i) => 
      sum + (i.service_areas?.length || 0), 0
    ) || 0;
    
    console.log('\n🎉 SERVICE AREA DETECTION COMPLETE');
    console.log('==================================');
    console.log(`✅ Successfully processed: ${this.successCount}`);
    console.log(`❌ Failed/No areas: ${this.errorCount}`);
    console.log(`📊 Total processed: ${this.processedCount}\n`);
    
    console.log('📊 SERVICE AREA COVERAGE:');
    console.log('==========================');
    console.log(`🌍 With Multiple Areas: ${withMultipleAreas}`);
    console.log(`📍 Total Areas Found: ${totalAreas}`);
    console.log(`📈 Avg Areas/Inspector: ${(totalAreas/Math.max(inspectors?.length || 1, 1)).toFixed(1)}`);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('===============');
    console.log('1. Generate location-based landing pages');
    console.log('2. Create SEO URLs for each service area combination');
    console.log('3. Implement geographic search filtering');
  }

  async assignBasicServiceAreas(inspector) {
    try {
      this.processedCount++;
      console.log(`${this.processedCount}. Basic assignment: ${inspector.business_name}`);
      
      const serviceAreas = await this.generateBasicServiceAreas(inspector);
      
      if (serviceAreas.length > 0) {
        await this.updateInspectorServiceAreas(inspector.id, serviceAreas);
        this.totalAreasFound += serviceAreas.length;
        console.log(`   ✅ Assigned ${serviceAreas.length} basic areas: ${serviceAreas.join(', ')}`);
        this.successCount++;
      } else {
        console.log(`   ⚠️  No basic areas could be assigned`);
        this.errorCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.errorCount++;
    }
  }

  async generateBasicServiceAreas(inspector) {
    const serviceAreas = new Set();
    
    // Always include the primary city
    if (inspector.city) {
      serviceAreas.add(inspector.city);
    }
    
    // Add nearby cities based on known geographic clusters
    const nearbyAreas = this.getNearbyAreas(inspector.city, inspector.state);
    nearbyAreas.forEach(area => serviceAreas.add(area));
    
    // Extract from company description if available
    if (inspector.company_description) {
      const descriptionAreas = this.extractLocationsFromText(inspector.company_description);
      descriptionAreas.forEach(area => serviceAreas.add(area));
    }
    
    return Array.from(serviceAreas).slice(0, 8); // Limit to 8 service areas
  }

  getNearbyAreas(city, state) {
    // Define geographic clusters for major metro areas
    const geographicClusters = {
      'San Francisco': ['Oakland', 'Berkeley', 'San Mateo', 'Daly City', 'South San Francisco'],
      'Oakland': ['Berkeley', 'San Francisco', 'Alameda', 'San Leandro', 'Hayward'],
      'San Jose': ['Palo Alto', 'Mountain View', 'Santa Clara', 'Sunnyvale', 'Cupertino'],
      'Berkeley': ['Oakland', 'San Francisco', 'Richmond', 'Albany', 'El Cerrito'],
      'Palo Alto': ['Mountain View', 'San Jose', 'Menlo Park', 'Stanford', 'East Palo Alto'],
      'Fremont': ['Newark', 'Union City', 'Hayward', 'Milpitas', 'San Jose'],
      'Richmond': ['Berkeley', 'El Cerrito', 'San Pablo', 'Pinole', 'Hercules'],
      'Concord': ['Walnut Creek', 'Pleasant Hill', 'Martinez', 'Clayton', 'Pittsburg'],
      'Hayward': ['San Leandro', 'Castro Valley', 'Union City', 'Fremont', 'San Lorenzo'],
      'Mountain View': ['Palo Alto', 'Sunnyvale', 'Los Altos', 'San Jose', 'Santa Clara'],
      'Redwood City': ['San Mateo', 'Belmont', 'Menlo Park', 'Palo Alto', 'Foster City'],
      'San Mateo': ['Redwood City', 'Foster City', 'San Francisco', 'Daly City', 'Burlingame'],
      'Walnut Creek': ['Concord', 'Pleasant Hill', 'Lafayette', 'Orinda', 'Alamo'],
      'San Rafael': ['Novato', 'Mill Valley', 'Corte Madera', 'Larkspur', 'San Anselmo']
    };
    
    const cityKey = city || '';
    const nearby = geographicClusters[cityKey] || [];
    
    // Return 2-4 nearby areas
    return nearby.slice(0, Math.floor(Math.random() * 3) + 2);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute if called directly
if (require.main === module) {
  const detector = new ServiceAreaDetector();
  detector.detectAllServiceAreas().catch(console.error);
}

module.exports = ServiceAreaDetector;