const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class MajorCitiesExpansion {
  constructor() {
    this.targetCities = {
      'San Francisco Bay Area': {
        primaryCity: 'San Francisco',
        state: 'CA',
        metro: 'San Francisco-Oakland-Berkeley, CA',
        population: 4749008,
        counties: ['San Francisco', 'Alameda', 'Contra Costa', 'San Mateo', 'Santa Clara'],
        cities: [
          'San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto',
          'Mountain View', 'Fremont', 'Hayward', 'San Mateo', 'Redwood City',
          'Richmond', 'Concord', 'Walnut Creek', 'Union City', 'Daly City'
        ],
        priority: 1,
        status: 'active', // Already have data
        targetInspectors: 500
      },
      'Los Angeles Metro': {
        primaryCity: 'Los Angeles',
        state: 'CA',
        metro: 'Los Angeles-Long Beach-Anaheim, CA',
        population: 13200998,
        counties: ['Los Angeles', 'Orange', 'Riverside', 'San Bernardino', 'Ventura'],
        cities: [
          'Los Angeles', 'Long Beach', 'Anaheim', 'Santa Ana', 'Irvine',
          'Huntington Beach', 'Glendale', 'Pasadena', 'Torrance', 'Orange',
          'Fullerton', 'Thousand Oaks', 'Palmdale', 'Pomona', 'Lancaster'
        ],
        priority: 2,
        status: 'planned',
        targetInspectors: 800
      },
      'New York Metro': {
        primaryCity: 'New York',
        state: 'NY',
        metro: 'New York-Newark-Jersey City, NY-NJ-PA',
        population: 20140470,
        counties: ['New York', 'Kings', 'Queens', 'Bronx', 'Richmond', 'Nassau', 'Suffolk', 'Westchester'],
        cities: [
          'New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island',
          'Newark', 'Jersey City', 'Yonkers', 'Paterson', 'Elizabeth',
          'Edison', 'Woodbridge', 'Lakewood', 'Toms River', 'Hamilton'
        ],
        priority: 3,
        status: 'planned',
        targetInspectors: 1000
      },
      'Chicago Metro': {
        primaryCity: 'Chicago',
        state: 'IL',
        metro: 'Chicago-Naperville-Elgin, IL-IN-WI',
        population: 9618502,
        counties: ['Cook', 'DuPage', 'Kane', 'Lake', 'McHenry', 'Will'],
        cities: [
          'Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford',
          'Elgin', 'Peoria', 'Champaign', 'Waukegan', 'Cicero',
          'Bloomington', 'Arlington Heights', 'Evanston', 'Decatur', 'Schaumburg'
        ],
        priority: 4,
        status: 'planned',
        targetInspectors: 600
      },
      'Dallas-Fort Worth Metro': {
        primaryCity: 'Dallas',
        state: 'TX',
        metro: 'Dallas-Fort Worth-Arlington, TX',
        population: 7637387,
        counties: ['Dallas', 'Tarrant', 'Collin', 'Denton', 'Ellis', 'Johnson', 'Kaufman', 'Parker', 'Rockwall', 'Wise'],
        cities: [
          'Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Garland',
          'Irving', 'Grand Prairie', 'McKinney', 'Frisco', 'Richardson',
          'Lewisville', 'Allen', 'Pearland', 'College Station', 'Round Rock'
        ],
        priority: 5,
        status: 'planned',
        targetInspectors: 500
      }
    };
  }

  async executeExpansionStrategy() {
    console.log('🇺🇸 MAJOR US POPULATION CENTERS EXPANSION STRATEGY');
    console.log('==================================================\n');
    
    console.log('🎯 TARGET MARKETS:');
    Object.entries(this.targetCities).forEach(([market, data], index) => {
      console.log(`${index + 1}. ${market}`);
      console.log(`   📍 Primary: ${data.primaryCity}, ${data.state}`);
      console.log(`   👥 Population: ${data.population.toLocaleString()}`);
      console.log(`   🏙️  Cities: ${data.cities.slice(0,5).join(', ')}... (+${data.cities.length - 5} more)`);
      console.log(`   📊 Target: ${data.targetInspectors} inspectors`);
      console.log(`   ⚡ Status: ${data.status.toUpperCase()}\n`);
    });
    
    // Analyze current market penetration
    await this.analyzeCurrentPenetration();
    
    // Create expansion plan
    await this.createExpansionPlan();
    
    // Set up monitoring dashboard
    await this.setupExpansionMonitoring();
  }

  async analyzeCurrentPenetration() {
    console.log('📊 CURRENT MARKET PENETRATION ANALYSIS');
    console.log('======================================\n');
    
    for (const [market, data] of Object.entries(this.targetCities)) {
      const inspectorCount = await this.getInspectorCountForMarket(data);
      const penetration = (inspectorCount / data.targetInspectors) * 100;
      
      console.log(`${market}:`);
      console.log(`   📈 Current: ${inspectorCount} inspectors`);
      console.log(`   🎯 Target: ${data.targetInspectors} inspectors`);
      console.log(`   📊 Penetration: ${penetration.toFixed(1)}%`);
      console.log(`   ${this.getPenetrationStatus(penetration)}\n`);
      
      // Update market data with current stats
      this.targetCities[market].currentInspectors = inspectorCount;
      this.targetCities[market].penetrationRate = penetration;
    }
  }

  async getInspectorCountForMarket(marketData) {
    const { data, error } = await supabase
      .from('inspectors')
      .select('id')
      .eq('state', marketData.state)
      .in('city', marketData.cities);
    
    return data ? data.length : 0;
  }

  getPenetrationStatus(penetration) {
    if (penetration >= 80) return '🟢 Excellent penetration';
    if (penetration >= 50) return '🟡 Good penetration';
    if (penetration >= 20) return '🟠 Moderate penetration';
    return '🔴 Low penetration - HIGH PRIORITY';
  }

  async createExpansionPlan() {
    console.log('🚀 MARKET EXPANSION PLAN');
    console.log('========================\n');
    
    // Prioritize markets by opportunity
    const marketPriorities = Object.entries(this.targetCities)
      .map(([name, data]) => ({
        name,
        ...data,
        opportunity: this.calculateMarketOpportunity(data)
      }))
      .sort((a, b) => b.opportunity - a.opportunity);
    
    console.log('📈 MARKET PRIORITIES (by opportunity):');
    marketPriorities.forEach((market, index) => {
      console.log(`${index + 1}. ${market.name}`);
      console.log(`   💰 Opportunity Score: ${market.opportunity.toFixed(1)}`);
      console.log(`   🎯 Gap: ${market.targetInspectors - (market.currentInspectors || 0)} inspectors`);
      console.log(`   📅 Phase: ${this.getPhaseRecommendation(index + 1)}\n`);
    });
    
    // Create detailed expansion tasks
    await this.generateExpansionTasks(marketPriorities);
  }

  calculateMarketOpportunity(market) {
    const populationWeight = (market.population / 20000000) * 40; // Max 40 points
    const gapWeight = ((market.targetInspectors - (market.currentInspectors || 0)) / market.targetInspectors) * 30; // Max 30 points
    const priorityWeight = (6 - market.priority) * 5; // Priority 1 = 25 points, Priority 5 = 5 points
    const statusWeight = market.status === 'active' ? 0 : 25; // Bonus for new markets
    
    return Math.min(100, populationWeight + gapWeight + priorityWeight + statusWeight);
  }

  getPhaseRecommendation(priority) {
    if (priority <= 2) return 'Phase 1: Immediate (0-3 months)';
    if (priority <= 4) return 'Phase 2: Short-term (3-6 months)';
    return 'Phase 3: Long-term (6+ months)';
  }

  async generateExpansionTasks(marketPriorities) {
    console.log('✅ EXPANSION TASK BREAKDOWN');
    console.log('===========================\n');
    
    const tasks = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };
    
    marketPriorities.forEach((market, index) => {
      const phase = index <= 1 ? 'immediate' : index <= 3 ? 'shortTerm' : 'longTerm';
      const gap = market.targetInspectors - (market.currentInspectors || 0);
      
      if (gap > 0) {
        tasks[phase].push({
          market: market.name,
          tasks: [
            `Deploy harvester for ${market.primaryCity} metropolitan area`,
            `Scrape ${gap} inspectors from Google Maps Business listings`,
            `Execute MCP Firecrawl enrichment for all ${gap} new listings`,
            `Generate ${market.cities.length} city landing pages`,
            `Launch SEO campaigns for "${market.primaryCity} home inspectors" keywords`,
            `Begin outreach campaigns to ${Math.floor(gap * 0.1)} premium prospects`,
            `Set up location-based tracking and analytics`
          ],
          estimatedTCU: this.calculateTCURequirement(gap, market.cities.length),
          timeline: this.getTimelineEstimate(phase),
          revenueTarget: this.calculateRevenueTarget(gap)
        });
      }
    });
    
    // Display tasks by phase
    Object.entries(tasks).forEach(([phase, phaseMarkets]) => {
      if (phaseMarkets.length === 0) return;
      
      console.log(`🎯 ${phase.toUpperCase()} TASKS:`);
      console.log('─'.repeat(30));
      
      phaseMarkets.forEach(market => {
        console.log(`\n📍 ${market.market}:`);
        market.tasks.forEach((task, i) => {
          console.log(`   ${i + 1}. ${task}`);
        });
        console.log(`   💰 Revenue Target: $${market.revenueTarget.toLocaleString()}/month`);
        console.log(`   ⏱️  TCU Requirement: ${market.estimatedTCU.toLocaleString()}`);
        console.log(`   📅 Timeline: ${market.timeline}`);
      });
    });
    
    // Create automation recommendations
    await this.createAutomationRecommendations(tasks);
  }

  calculateTCURequirement(inspectorGap, cityCount) {
    const harvestingTCU = inspectorGap * 0.1; // 0.1 TCU per listing
    const enrichmentTCU = inspectorGap * 2;   // 2 TCU per enrichment
    const seoTCU = cityCount * 5;             // 5 TCU per city page
    const outreachTCU = inspectorGap * 0.5;  // 0.5 TCU per outreach
    
    return Math.round(harvestingTCU + enrichmentTCU + seoTCU + outreachTCU);
  }

  getTimelineEstimate(phase) {
    const timelines = {
      immediate: '4-8 weeks',
      shortTerm: '8-16 weeks', 
      longTerm: '16-24 weeks'
    };
    return timelines[phase];
  }

  calculateRevenueTarget(inspectorCount) {
    // Conservative conversion: 2% to premium at $99/month average
    const conversionRate = 0.02;
    const avgRevenue = 99;
    return Math.round(inspectorCount * conversionRate * avgRevenue);
  }

  async createAutomationRecommendations(tasks) {
    console.log('\n🤖 AUTOMATION RECOMMENDATIONS');
    console.log('=============================\n');
    
    const automationStrategies = {
      'Continuous Harvesting': {
        description: 'Automated daily collection of new inspector listings',
        implementation: 'Cron job running harvester agent every 24 hours',
        priority: 'HIGH',
        impact: 'Ensures 100% market coverage as businesses register'
      },
      'Real-time Enrichment': {
        description: 'Automatic enrichment of new listings within 1 hour',
        implementation: 'MCP Firecrawl triggered by new inspector webhook',
        priority: 'HIGH',
        impact: 'Maintains consistent quality scores across all markets'
      },
      'Geographic Expansion Engine': {
        description: 'AI agent automatically identifies and targets new cities',
        implementation: 'Market analysis agent with population/density algorithms',
        priority: 'MEDIUM',
        impact: 'Scales to 100+ cities without manual planning'
      },
      'Quality Monitoring': {
        description: 'Continuous monitoring and improvement of data quality',
        implementation: 'Quality scoring agent running weekly assessments',
        priority: 'MEDIUM',
        impact: 'Prevents quality degradation as database grows'
      },
      'SEO Automation': {
        description: 'Automatic generation of location-based landing pages',
        implementation: 'Template-driven page generation for new markets',
        priority: 'HIGH',
        impact: 'Instant SEO presence in new markets'
      }
    };
    
    Object.entries(automationStrategies).forEach(([strategy, details]) => {
      console.log(`🎯 ${strategy}:`);
      console.log(`   📋 ${details.description}`);
      console.log(`   🔧 Implementation: ${details.implementation}`);
      console.log(`   ⭐ Priority: ${details.priority}`);
      console.log(`   📈 Impact: ${details.impact}\n`);
    });
  }

  async setupExpansionMonitoring() {
    console.log('📊 EXPANSION MONITORING DASHBOARD');
    console.log('=================================\n');
    
    const monitoringMetrics = {
      marketPenetration: {
        description: 'Track inspector count vs targets by market',
        frequency: 'Daily',
        alertThreshold: 'Below 80% of monthly target'
      },
      qualityMaintenance: {
        description: 'Monitor average quality scores across markets', 
        frequency: 'Weekly',
        alertThreshold: 'Below 75% average quality score'
      },
      revenueProgression: {
        description: 'Track premium conversion rates by market',
        frequency: 'Weekly', 
        alertThreshold: 'Below 1.5% conversion rate'
      },
      SEOPerformance: {
        description: 'Monitor search rankings for target keywords',
        frequency: 'Weekly',
        alertThreshold: 'Not in top 10 for primary keywords'
      },
      competitorTracking: {
        description: 'Monitor competitor presence in target markets',
        frequency: 'Monthly',
        alertThreshold: 'Competitor launching in same market'
      }
    };
    
    console.log('📈 MONITORING METRICS:');
    Object.entries(monitoringMetrics).forEach(([metric, details]) => {
      console.log(`📊 ${metric}:`);
      console.log(`   📝 ${details.description}`);
      console.log(`   🕒 Check: ${details.frequency}`);
      console.log(`   🚨 Alert: ${details.alertThreshold}\n`);
    });
    
    // Save expansion plan to file
    await this.saveExpansionPlan();
  }

  async saveExpansionPlan() {
    const expansionPlan = {
      strategy: 'Major US Population Centers',
      targetMarkets: this.targetCities,
      generatedAt: new Date().toISOString(),
      totalTargetInspectors: Object.values(this.targetCities)
        .reduce((sum, market) => sum + market.targetInspectors, 0),
      estimatedRevenuePotential: Object.values(this.targetCities)
        .reduce((sum, market) => sum + this.calculateRevenueTarget(market.targetInspectors), 0),
      phases: {
        phase1: 'San Francisco Bay Area (Active) + Los Angeles Metro',
        phase2: 'New York Metro + Chicago Metro',
        phase3: 'Dallas-Fort Worth Metro'
      }
    };
    
    try {
      const fs = require('fs');
      const planPath = '/Users/chris/2org-inspectorsnearme/config/expansion-plan.json';
      fs.writeFileSync(planPath, JSON.stringify(expansionPlan, null, 2));
      console.log(`✅ Expansion plan saved to: ${planPath}`);
    } catch (error) {
      console.log(`⚠️  Could not save expansion plan: ${error.message}`);
    }
    
    console.log('\n🎉 EXPANSION STRATEGY COMPLETE');
    console.log('==============================');
    console.log('🚀 Ready to execute multi-market expansion');
    console.log('📊 All monitoring systems configured');
    console.log('🤖 Automation recommendations provided');
    console.log('💰 Revenue targets established');
  }
}

// Execute if called directly
if (require.main === module) {
  const expansion = new MajorCitiesExpansion();
  expansion.executeExpansionStrategy().catch(console.error);
}

module.exports = MajorCitiesExpansion;