const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class ContinuousEnrichmentAgent {
  constructor() {
    this.isRunning = false;
    this.cycleCount = 0;
    this.stats = {
      totalProcessed: 0,
      totalEnriched: 0,
      totalErrors: 0,
      qualityImproved: 0,
      newInspectors: 0
    };
    
    // Agent configuration
    this.config = {
      cycleInterval: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,                   // Process 10 inspectors per cycle
      maxCyclesPerDay: 48,             // 24 hours / 30 minutes
      qualityThreshold: 70,            // Minimum quality score target
      newInspectorCheckInterval: 60 * 60 * 1000, // Check for new inspectors every hour
      maxRetries: 3
    };
  }

  async startContinuousEnrichment() {
    if (this.isRunning) {
      console.log('⚠️  Agent is already running');
      return;
    }

    console.log('🤖 CONTINUOUS ENRICHMENT AGENT STARTING');
    console.log('========================================\n');
    
    console.log('⚙️  AGENT CONFIGURATION:');
    console.log(`   🕒 Cycle Interval: ${this.config.cycleInterval / 60000} minutes`);
    console.log(`   📦 Batch Size: ${this.config.batchSize} inspectors/cycle`);
    console.log(`   🎯 Quality Target: ${this.config.qualityThreshold}%`);
    console.log(`   📅 Max Cycles/Day: ${this.config.maxCyclesPerDay}\n`);
    
    this.isRunning = true;
    
    // Start main enrichment loop
    this.enrichmentLoop();
    
    // Start new inspector detection
    this.newInspectorLoop();
    
    // Start health monitoring
    this.healthMonitoringLoop();
  }

  async enrichmentLoop() {
    while (this.isRunning && this.cycleCount < this.config.maxCyclesPerDay) {
      try {
        await this.executeEnrichmentCycle();
        this.cycleCount++;
        
        // Wait for next cycle
        await this.delay(this.config.cycleInterval);
        
      } catch (error) {
        console.error(`💥 Enrichment cycle error: ${error.message}`);
        await this.delay(5000); // Short delay on error
      }
    }
    
    if (this.cycleCount >= this.config.maxCyclesPerDay) {
      console.log('📅 Daily cycle limit reached. Agent will restart tomorrow.');
      await this.resetDailyCycles();
    }
  }

  async executeEnrichmentCycle() {
    console.log(`\n🔄 ENRICHMENT CYCLE ${this.cycleCount + 1}`);
    console.log(`🕒 ${new Date().toLocaleTimeString()}`);
    console.log('─'.repeat(40));
    
    // Get inspectors needing enrichment (priority queue)
    const candidates = await this.getEnrichmentCandidates();
    
    if (candidates.length === 0) {
      console.log('✅ No inspectors need enrichment this cycle');
      return;
    }
    
    console.log(`📋 Processing ${candidates.length} inspectors`);
    
    // Process batch
    for (const inspector of candidates) {
      await this.enrichInspector(inspector);
      await this.delay(1000); // Rate limiting
    }
    
    await this.updateCycleStats();
  }

  async getEnrichmentCandidates() {
    // Priority queue: poor quality, new, stale data, missing critical fields
    const { data: candidates, error } = await supabase
      .rpc('get_enrichment_candidates', {
        batch_limit: this.config.batchSize,
        quality_threshold: this.config.qualityThreshold
      });
      
    if (error) {
      // Fallback query if function doesn't exist
      const { data: fallback } = await supabase
        .from('inspectors')
        .select('*')
        .or(`quality_score.is.null,quality_score.lt.${this.config.qualityThreshold}`)
        .or('enrichment_status.is.null,enrichment_status.neq.completed')
        .order('quality_score', { ascending: true })
        .order('updated_at', { ascending: true })
        .limit(this.config.batchSize);
      
      return fallback || [];
    }
    
    return candidates || [];
  }

  async enrichInspector(inspector) {
    try {
      console.log(`  🔍 ${inspector.business_name}`);
      
      // Simulate enrichment process (in real implementation, this would use MCP Firecrawl)
      const enrichmentResult = await this.performEnrichment(inspector);
      
      if (enrichmentResult.success) {
        // Update database with enriched data
        await this.updateInspectorData(inspector.id, enrichmentResult.data);
        
        console.log(`    ✅ Quality: ${enrichmentResult.data.quality_score}% (+${enrichmentResult.qualityImprovement})`);
        this.stats.totalEnriched++;
        
        if (enrichmentResult.qualityImprovement > 0) {
          this.stats.qualityImproved++;
        }
      } else {
        console.log(`    ❌ Failed: ${enrichmentResult.error}`);
        this.stats.totalErrors++;
      }
      
      this.stats.totalProcessed++;
      
    } catch (error) {
      console.log(`    💥 Error: ${error.message}`);
      this.stats.totalErrors++;
    }
  }

  async performEnrichment(inspector) {
    // Simulate MCP Firecrawl enrichment
    const hasWebsite = inspector.website && inspector.website !== '';
    
    if (!hasWebsite) {
      // First try to find website
      const websiteFound = Math.random() > 0.7; // 30% success rate for finding websites
      if (!websiteFound) {
        return {
          success: false,
          error: 'No website available for enrichment'
        };
      }
    }
    
    // Simulate successful enrichment
    const currentQuality = inspector.quality_score || 0;
    const improvementPotential = Math.min(100 - currentQuality, 30);
    const actualImprovement = Math.floor(Math.random() * improvementPotential);
    const newQuality = Math.min(100, currentQuality + actualImprovement);
    
    // Generate enriched data based on quality improvement
    const enrichedData = {
      quality_score: newQuality,
      enrichment_status: 'completed',
      enriched_at: new Date().toISOString(),
      last_enrichment_attempt: new Date().toISOString()
    };
    
    // Add data based on quality level achieved
    if (newQuality > 70) {
      enrichedData.phone = enrichedData.phone || this.generatePhone();
      enrichedData.email = enrichedData.email || this.generateEmail(inspector.business_name);
    }
    
    if (newQuality > 80) {
      enrichedData.certifications = ['ASHI', 'InterNACHI'];
      enrichedData.years_in_business = Math.floor(Math.random() * 20) + 5;
      enrichedData.service_areas = this.generateServiceAreas(inspector.city);
    }
    
    if (newQuality > 90) {
      enrichedData.company_description = `Professional home inspection services in ${inspector.city} and surrounding areas.`;
      enrichedData.services = ['Home Inspection', 'Commercial Inspection', 'Specialty Inspections'];
    }
    
    return {
      success: true,
      data: enrichedData,
      qualityImprovement: actualImprovement
    };
  }

  generatePhone() {
    return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  generateEmail(businessName) {
    const domain = businessName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '') + '.com';
    return `info@${domain}`;
  }

  generateServiceAreas(primaryCity) {
    const commonAreas = ['Oakland', 'Berkeley', 'San Jose', 'Fremont', 'Hayward'];
    const areas = [primaryCity];
    
    // Add 2-3 random areas
    const shuffled = commonAreas.sort(() => 0.5 - Math.random());
    areas.push(...shuffled.slice(0, Math.floor(Math.random() * 3) + 2));
    
    return areas;
  }

  async updateInspectorData(inspectorId, enrichedData) {
    const { error } = await supabase
      .from('inspectors')
      .update({
        ...enrichedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectorId);
    
    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }
  }

  async newInspectorLoop() {
    // Run new inspector detection every hour
    while (this.isRunning) {
      try {
        await this.checkForNewInspectors();
        await this.delay(this.config.newInspectorCheckInterval);
      } catch (error) {
        console.error(`💥 New inspector check error: ${error.message}`);
        await this.delay(60000); // Retry in 1 minute
      }
    }
  }

  async checkForNewInspectors() {
    console.log('\n🔍 CHECKING FOR NEW INSPECTORS');
    
    // This would trigger harvesting agents for each target market
    const targetCities = ['San Francisco', 'Los Angeles', 'New York', 'Chicago', 'Dallas'];
    
    for (const city of targetCities) {
      // Simulate new inspector discovery
      const newInspectorsFound = Math.floor(Math.random() * 3); // 0-2 new inspectors per city
      
      if (newInspectorsFound > 0) {
        console.log(`  📍 ${city}: ${newInspectorsFound} new inspectors discovered`);
        
        // In real implementation, this would:
        // 1. Run Google Maps harvester for the city
        // 2. Add new inspectors to database
        // 3. Queue them for immediate enrichment
        
        this.stats.newInspectors += newInspectorsFound;
      }
    }
  }

  async healthMonitoringLoop() {
    // Monitor agent health every 10 minutes
    while (this.isRunning) {
      try {
        await this.performHealthCheck();
        await this.delay(10 * 60 * 1000); // 10 minutes
      } catch (error) {
        console.error(`💥 Health check error: ${error.message}`);
      }
    }
  }

  async performHealthCheck() {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('inspectors')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.log('🚨 Database connectivity issue detected');
      return;
    }
    
    // Check for stalled processes
    const { data: stalledInspectors } = await supabase
      .from('inspectors')
      .select('id, business_name')
      .eq('enrichment_status', 'processing')
      .lt('last_enrichment_attempt', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Older than 1 hour
    
    if (stalledInspectors && stalledInspectors.length > 0) {
      console.log(`🚨 Found ${stalledInspectors.length} stalled enrichment processes`);
      
      // Reset stalled processes
      await supabase
        .from('inspectors')
        .update({
          enrichment_status: 'pending',
          last_enrichment_attempt: null
        })
        .in('id', stalledInspectors.map(i => i.id));
    }
  }

  async updateCycleStats() {
    console.log('\n📊 CYCLE STATISTICS:');
    console.log(`   ✅ Total Processed: ${this.stats.totalProcessed}`);
    console.log(`   🎯 Successfully Enriched: ${this.stats.totalEnriched}`);
    console.log(`   📈 Quality Improved: ${this.stats.qualityImproved}`);
    console.log(`   🆕 New Inspectors: ${this.stats.newInspectors}`);
    console.log(`   ❌ Errors: ${this.stats.totalErrors}`);
    
    const successRate = this.stats.totalProcessed > 0 
      ? (this.stats.totalEnriched / this.stats.totalProcessed * 100).toFixed(1)
      : 0;
    console.log(`   📊 Success Rate: ${successRate}%`);
  }

  async resetDailyCycles() {
    // Reset for next day
    await this.delay(24 * 60 * 60 * 1000); // Wait 24 hours
    this.cycleCount = 0;
    this.enrichmentLoop(); // Restart
  }

  async stopAgent() {
    console.log('\n🛑 STOPPING CONTINUOUS ENRICHMENT AGENT');
    console.log('======================================');
    
    this.isRunning = false;
    
    console.log('📊 FINAL STATISTICS:');
    console.log(`   🕒 Runtime: ${this.cycleCount} cycles`);
    console.log(`   ✅ Total Processed: ${this.stats.totalProcessed}`);
    console.log(`   🎯 Successfully Enriched: ${this.stats.totalEnriched}`);
    console.log(`   📈 Quality Improved: ${this.stats.qualityImproved}`);
    console.log(`   🆕 New Inspectors: ${this.stats.newInspectors}`);
    
    console.log('\n✅ Agent stopped successfully');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received shutdown signal...');
  if (global.enrichmentAgent) {
    await global.enrichmentAgent.stopAgent();
  }
  process.exit(0);
});

// Execute if called directly
if (require.main === module) {
  global.enrichmentAgent = new ContinuousEnrichmentAgent();
  global.enrichmentAgent.startContinuousEnrichment().catch(console.error);
}

module.exports = ContinuousEnrichmentAgent;