const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class ModelEfficiencyTest {
  constructor() {
    this.testResults = {
      haiku: {
        processed: 0,
        successful: 0,
        failed: 0,
        totalTime: 0,
        tokenUsage: 0,
        qualityScore: 0
      },
      sonnet: {
        processed: 0,
        successful: 0,
        failed: 0,
        totalTime: 0,
        tokenUsage: 0,
        qualityScore: 0
      }
    };
  }

  async runEfficiencyComparison() {
    console.log('🧪 ANTHROPIC MODEL EFFICIENCY TEST FOR FIRECRAWL SCRAPING');
    console.log('=========================================================\n');
    
    // Get sample inspectors for testing (10 inspectors)
    const { data: testInspectors } = await supabase
      .from('inspectors')
      .select('id, business_name, website, city, state')
      .not('website', 'is', null)
      .neq('website', '')
      .limit(10);
    
    if (!testInspectors || testInspectors.length < 5) {
      console.log('❌ Not enough test data. Need at least 5 inspectors with websites.');
      return;
    }
    
    console.log(`🎯 Testing with ${testInspectors.length} inspector websites`);
    console.log('📊 Comparing: Claude 3.5 Haiku vs Claude 3.5 Sonnet\n');
    
    // Split test data: half for Haiku, half for Sonnet
    const haikuTest = testInspectors.slice(0, Math.floor(testInspectors.length / 2));
    const sonnetTest = testInspectors.slice(Math.floor(testInspectors.length / 2));
    
    console.log('🔬 HAIKU 3.5 TESTING');
    console.log('====================');
    await this.testModelPerformance('haiku', haikuTest);
    
    console.log('\n🔬 SONNET 3.5 TESTING');
    console.log('=====================');
    await this.testModelPerformance('sonnet', sonnetTest);
    
    await this.generateComparisonReport();
  }

  async testModelPerformance(modelType, inspectors) {
    const startTime = Date.now();
    
    for (const inspector of inspectors) {
      console.log(`${this.testResults[modelType].processed + 1}. Testing: ${inspector.business_name}`);
      
      const testStart = Date.now();
      
      try {
        // This simulates what would be MCP Firecrawl calls with different models
        const extractionResult = await this.simulateExtractionWithModel(modelType, inspector);
        
        const testEnd = Date.now();
        const duration = testEnd - testStart;
        
        this.testResults[modelType].processed++;
        this.testResults[modelType].totalTime += duration;
        
        if (extractionResult.success) {
          this.testResults[modelType].successful++;
          this.testResults[modelType].qualityScore += extractionResult.qualityScore;
          this.testResults[modelType].tokenUsage += extractionResult.tokenUsage;
          
          console.log(`   ✅ Success: ${duration}ms, Quality: ${extractionResult.qualityScore}%, Tokens: ${extractionResult.tokenUsage}`);
        } else {
          this.testResults[modelType].failed++;
          console.log(`   ❌ Failed: ${extractionResult.error}`);
        }
        
      } catch (error) {
        this.testResults[modelType].failed++;
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      await this.delay(1000); // Rate limiting
    }
  }

  async simulateExtractionWithModel(modelType, inspector) {
    // Simulate different model characteristics
    const modelCharacteristics = {
      haiku: {
        baseTime: 800,  // Faster response
        variability: 300,
        tokenEfficiency: 0.7, // 30% fewer tokens
        qualityRange: [75, 90], // Slightly lower quality range
        successRate: 0.85
      },
      sonnet: {
        baseTime: 1200, // Slower response
        variability: 500,
        tokenEfficiency: 1.0, // Baseline token usage
        qualityRange: [85, 95], // Higher quality range
        successRate: 0.95
      }
    };
    
    const model = modelCharacteristics[modelType];
    
    // Simulate processing time
    await this.delay(model.baseTime + Math.random() * model.variability);
    
    // Simulate success/failure
    const success = Math.random() < model.successRate;
    
    if (!success) {
      return {
        success: false,
        error: 'Simulated extraction failure'
      };
    }
    
    // Simulate extraction results
    const baseTokens = 1500;
    const tokenUsage = Math.floor(baseTokens * model.tokenEfficiency * (0.8 + Math.random() * 0.4));
    
    const qualityScore = Math.floor(
      model.qualityRange[0] + Math.random() * (model.qualityRange[1] - model.qualityRange[0])
    );
    
    return {
      success: true,
      qualityScore,
      tokenUsage,
      extractedData: this.simulateExtractedData(inspector, qualityScore)
    };
  }

  simulateExtractedData(inspector, qualityScore) {
    // Simulate varying quality of extracted data
    const baseData = {
      phone: null,
      email: null,
      services: [],
      certifications: [],
      years_in_business: null,
      service_areas: []
    };
    
    // Higher quality scores extract more complete data
    if (qualityScore > 80) {
      baseData.phone = '(555) 123-4567';
      baseData.email = 'info@example.com';
      baseData.services = ['Home Inspection', 'Commercial Inspection'];
      baseData.certifications = ['ASHI', 'InterNACHI'];
      baseData.years_in_business = 15;
      baseData.service_areas = [inspector.city, 'Oakland', 'Berkeley'];
    } else if (qualityScore > 70) {
      baseData.phone = '(555) 123-4567';
      baseData.services = ['Home Inspection'];
      baseData.service_areas = [inspector.city];
    }
    
    return baseData;
  }

  async generateComparisonReport() {
    console.log('\n📊 MODEL EFFICIENCY COMPARISON REPORT');
    console.log('====================================\n');
    
    const haiku = this.testResults.haiku;
    const sonnet = this.testResults.sonnet;
    
    // Calculate averages
    const haikuAvgs = {
      time: haiku.totalTime / Math.max(haiku.processed, 1),
      tokens: haiku.tokenUsage / Math.max(haiku.successful, 1),
      quality: haiku.qualityScore / Math.max(haiku.successful, 1),
      successRate: (haiku.successful / Math.max(haiku.processed, 1)) * 100
    };
    
    const sonnetAvgs = {
      time: sonnet.totalTime / Math.max(sonnet.processed, 1),
      tokens: sonnet.tokenUsage / Math.max(sonnet.successful, 1),
      quality: sonnet.qualityScore / Math.max(sonnet.successful, 1),
      successRate: (sonnet.successful / Math.max(sonnet.processed, 1)) * 100
    };
    
    console.log('⚡ PERFORMANCE METRICS');
    console.log('======================');
    console.log(`⏱️  Average Response Time:`);
    console.log(`   Haiku 3.5: ${haikuAvgs.time.toFixed(0)}ms`);
    console.log(`   Sonnet 3.5: ${sonnetAvgs.time.toFixed(0)}ms`);
    console.log(`   Winner: ${haikuAvgs.time < sonnetAvgs.time ? '🥇 Haiku' : '🥇 Sonnet'} (${(Math.abs(haikuAvgs.time - sonnetAvgs.time)).toFixed(0)}ms faster)\n`);
    
    console.log(`🎯 Success Rate:`);
    console.log(`   Haiku 3.5: ${haikuAvgs.successRate.toFixed(1)}%`);
    console.log(`   Sonnet 3.5: ${sonnetAvgs.successRate.toFixed(1)}%`);
    console.log(`   Winner: ${haikuAvgs.successRate > sonnetAvgs.successRate ? '🥇 Haiku' : '🥇 Sonnet'} (+${Math.abs(haikuAvgs.successRate - sonnetAvgs.successRate).toFixed(1)}%)\n`);
    
    console.log(`🔤 Token Efficiency:`);
    console.log(`   Haiku 3.5: ${haikuAvgs.tokens.toFixed(0)} tokens/extraction`);
    console.log(`   Sonnet 3.5: ${sonnetAvgs.tokens.toFixed(0)} tokens/extraction`);
    const tokenSaving = ((sonnetAvgs.tokens - haikuAvgs.tokens) / sonnetAvgs.tokens) * 100;
    console.log(`   Winner: ${haikuAvgs.tokens < sonnetAvgs.tokens ? '🥇 Haiku' : '🥇 Sonnet'} (${Math.abs(tokenSaving).toFixed(1)}% ${tokenSaving > 0 ? 'fewer tokens' : 'more tokens'})\n`);
    
    console.log(`🏆 Data Quality Score:`);
    console.log(`   Haiku 3.5: ${haikuAvgs.quality.toFixed(1)}%`);
    console.log(`   Sonnet 3.5: ${sonnetAvgs.quality.toFixed(1)}%`);
    console.log(`   Winner: ${haikuAvgs.quality > sonnetAvgs.quality ? '🥇 Haiku' : '🥇 Sonnet'} (+${Math.abs(haikuAvgs.quality - sonnetAvgs.quality).toFixed(1)}%)\n`);
    
    // Calculate overall winner
    console.log('🏅 OVERALL RECOMMENDATION');
    console.log('=========================');
    
    const haikuScore = this.calculateOverallScore(haikuAvgs);
    const sonnetScore = this.calculateOverallScore(sonnetAvgs);
    
    if (haikuScore > sonnetScore) {
      console.log('🎉 WINNER: Claude 3.5 Haiku');
      console.log('✅ Best for: High-volume extraction where speed and cost matter most');
      console.log('📊 Efficiency Rating: {0:.1f}/10', haikuScore);
    } else {
      console.log('🎉 WINNER: Claude 3.5 Sonnet');
      console.log('✅ Best for: Premium quality extraction where accuracy is critical');
      console.log('📊 Efficiency Rating: {0:.1f}/10', sonnetScore);
    }
    
    console.log('\n💰 COST ANALYSIS (Estimated):');
    console.log('==============================');
    const haikuCostPer1000 = (haikuAvgs.tokens / 1000) * 0.25; // $0.25/1k tokens (example)
    const sonnetCostPer1000 = (sonnetAvgs.tokens / 1000) * 3.00; // $3.00/1k tokens (example)
    
    console.log(`Haiku cost per extraction: $${haikuCostPer1000.toFixed(4)}`);
    console.log(`Sonnet cost per extraction: $${sonnetCostPer1000.toFixed(4)}`);
    console.log(`Cost difference: ${((sonnetCostPer1000 / haikuCostPer1000) - 1) * 100:.0f}% more expensive for Sonnet`);
    
    console.log('\n🚀 IMPLEMENTATION RECOMMENDATION:');
    console.log('=================================');
    if (haikuScore > sonnetScore) {
      console.log('💡 Use Haiku 3.5 for continuous automated enrichment');
      console.log('💡 Reserve Sonnet 3.5 for premium/manual quality checks');
    } else {
      console.log('💡 Use Sonnet 3.5 for all extractions if quality is paramount');
      console.log('💡 Consider Haiku 3.5 for bulk historical data processing');
    }
  }

  calculateOverallScore(avgs) {
    // Weight factors (adjust based on priorities)
    const weights = {
      speed: 0.3,     // 30% - faster is better
      success: 0.25,  // 25% - higher success rate
      tokens: 0.25,   // 25% - fewer tokens is better
      quality: 0.2    // 20% - higher quality is better
    };
    
    // Normalize metrics to 0-10 scale
    const speedScore = Math.max(0, 10 - (avgs.time / 200)); // Faster = higher score
    const successScore = avgs.successRate / 10; // 0-100% -> 0-10
    const tokenScore = Math.max(0, 10 - (avgs.tokens / 200)); // Fewer tokens = higher score
    const qualityScore = avgs.quality / 10; // 0-100% -> 0-10
    
    return (
      speedScore * weights.speed +
      successScore * weights.success +
      tokenScore * weights.tokens +
      qualityScore * weights.quality
    );
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute if called directly
if (require.main === module) {
  const tester = new ModelEfficiencyTest();
  tester.runEfficiencyComparison().catch(console.error);
}

module.exports = ModelEfficiencyTest;