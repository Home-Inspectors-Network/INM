#!/usr/bin/env node

/**
 * PALO ALTO ENHANCED ENRICHMENT EXECUTOR
 * 
 * Main orchestration script for comprehensive multi-city enrichment:
 * 1. Schema validation and updates
 * 2. Enhanced enrichment execution
 * 3. Quality control and analytics
 * 4. Performance reporting
 */

require('dotenv').config({ path: '.env.local' });
const { updateSchema, testSchema } = require('./update-schema-for-enrichment');
const { runPaloAltoEnrichment } = require('./palo-alto-enhanced-enrichment');
const { runAnalytics } = require('./enrichment-analytics-dashboard');
const fs = require('fs-extra');

class EnrichmentOrchestrator {
  constructor() {
    this.execution_log = {
      started_at: new Date().toISOString(),
      phases: [],
      metrics: {},
      errors: [],
      completed_at: null
    };
  }

  async executeComprehensiveEnrichment() {
    console.log('🚀 PALO ALTO COMPREHENSIVE ENRICHMENT EXECUTION');
    console.log('===============================================');
    console.log('Target: 72 Palo Alto inspectors with 55 websites');
    console.log('Scope: Multi-city assignments + enhanced data extraction\n');

    try {
      // Phase 1: Schema Preparation
      await this.executePhase('Schema Validation', async () => {
        console.log('📋 Phase 1: Schema Validation & Updates');
        console.log('=====================================\n');
        
        const schemaReady = await this.validateAndUpdateSchema();
        
        if (!schemaReady) {
          throw new Error('Schema validation failed. Manual intervention required.');
        }
        
        return { schema_ready: true };
      });

      // Phase 2: Enhanced Enrichment
      await this.executePhase('Enhanced Enrichment', async () => {
        console.log('\n🔍 Phase 2: Enhanced Multi-City Enrichment');
        console.log('=========================================\n');
        
        const enrichmentResults = await runPaloAltoEnrichment();
        
        return { 
          enrichment_completed: true,
          results: enrichmentResults 
        };
      });

      // Phase 3: Quality Analysis
      await this.executePhase('Quality Analysis', async () => {
        console.log('\n📊 Phase 3: Quality Analysis & Reporting');
        console.log('======================================\n');
        
        const analyticsResults = await runAnalytics();
        
        return {
          analytics_completed: true,
          report_file: analyticsResults.reportFile,
          key_metrics: analyticsResults.analytics.overview
        };
      });

      // Phase 4: Final Validation
      await this.executePhase('Final Validation', async () => {
        console.log('\n✅ Phase 4: Final Validation & Summary');
        console.log('====================================\n');
        
        const validation = await this.performFinalValidation();
        
        return validation;
      });

      this.execution_log.completed_at = new Date().toISOString();
      await this.generateExecutionReport();

      console.log('\n🎉 COMPREHENSIVE ENRICHMENT COMPLETE');
      console.log('===================================');
      this.displayFinalSummary();

    } catch (error) {
      console.error('\n❌ ENRICHMENT EXECUTION FAILED');
      console.error('==============================');
      console.error(`Error: ${error.message}`);
      
      this.execution_log.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      
      await this.generateExecutionReport();
      throw error;
    }
  }

  async executePhase(phaseName, phaseFunction) {
    const phase = {
      name: phaseName,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      success: false,
      results: null,
      error: null
    };

    try {
      const startTime = Date.now();
      phase.results = await phaseFunction();
      phase.duration_seconds = Math.round((Date.now() - startTime) / 1000);
      phase.success = true;
      
      console.log(`✅ ${phaseName} completed in ${phase.duration_seconds}s`);
      
    } catch (error) {
      phase.error = error.message;
      phase.duration_seconds = Math.round((Date.now() - Date.now()) / 1000);
      
      console.error(`❌ ${phaseName} failed: ${error.message}`);
      throw error;
    } finally {
      phase.completed_at = new Date().toISOString();
      this.execution_log.phases.push(phase);
    }
  }

  async validateAndUpdateSchema() {
    try {
      console.log('🔧 Checking database schema...');
      
      // Test current schema
      const schemaValid = await testSchema();
      
      if (!schemaValid) {
        console.log('⚠️  Schema updates needed. Attempting automatic update...');
        
        const updateSuccess = await updateSchema();
        
        if (!updateSuccess) {
          console.log('\n📋 MANUAL SCHEMA UPDATE REQUIRED');
          console.log('================================');
          console.log('Please run the following SQL in your Supabase dashboard:');
          console.log('\n-- Add enrichment columns');
          console.log(`ALTER TABLE inspectors 
ADD COLUMN IF NOT EXISTS enrichment_data JSONB,
ADD COLUMN IF NOT EXISTS service_cities TEXT[],
ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_multi_city_assignment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_inspector_id UUID REFERENCES inspectors(id);`);

          console.log('\n-- Add performance indexes');
          console.log(`CREATE INDEX IF NOT EXISTS idx_inspectors_enrichment_status ON inspectors(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_inspectors_quality_score ON inspectors(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_inspectors_service_cities ON inspectors USING GIN(service_cities);
CREATE INDEX IF NOT EXISTS idx_inspectors_multi_city ON inspectors(is_multi_city_assignment);
CREATE INDEX IF NOT EXISTS idx_inspectors_enrichment_data ON inspectors USING GIN(enrichment_data);`);
          
          return false;
        }
        
        // Re-test after update
        return await testSchema();
      }
      
      console.log('✅ Schema validation passed');
      return true;
      
    } catch (error) {
      console.error('Schema validation error:', error.message);
      return false;
    }
  }

  async performFinalValidation() {
    console.log('🔍 Performing final validation...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      // Check enriched inspectors
      const { data: enrichedInspectors, error: enrichedError } = await supabase
        .from('inspectors')
        .select('*')
        .eq('address_city', 'Palo Alto')
        .eq('enrichment_status', 'completed');

      if (enrichedError) throw enrichedError;

      // Check multi-city assignments
      const { data: multiCityAssignments, error: multiCityError } = await supabase
        .from('inspectors')
        .select('*')
        .eq('is_multi_city_assignment', true);

      if (multiCityError) throw multiCityError;

      // Check quality scores
      const qualityScores = enrichedInspectors
        .map(i => i.quality_score || 0)
        .filter(score => score > 0);

      const validation = {
        enriched_count: enrichedInspectors.length,
        multi_city_assignments: multiCityAssignments.length,
        average_quality_score: qualityScores.length > 0 
          ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
          : 0,
        high_quality_count: qualityScores.filter(score => score >= 80).length,
        cities_covered: [...new Set(multiCityAssignments.map(i => i.address_city))].length,
        validation_passed: enrichedInspectors.length > 0 && qualityScores.length > 0
      };

      console.log(`  ✓ Enriched inspectors: ${validation.enriched_count}`);
      console.log(`  ✓ Multi-city assignments: ${validation.multi_city_assignments}`);
      console.log(`  ✓ Average quality score: ${validation.average_quality_score}/100`);
      console.log(`  ✓ High-quality listings: ${validation.high_quality_count}`);
      console.log(`  ✓ Cities covered: ${validation.cities_covered}`);

      if (!validation.validation_passed) {
        console.log('  ⚠️  Validation concerns detected');
      }

      return validation;

    } catch (error) {
      console.error('Final validation error:', error.message);
      return {
        validation_passed: false,
        error: error.message
      };
    }
  }

  async generateExecutionReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `logs/enrichment-execution-${timestamp}.json`;
    
    const totalDuration = this.execution_log.phases.reduce((sum, phase) => sum + phase.duration_seconds, 0);
    const successfulPhases = this.execution_log.phases.filter(p => p.success).length;
    
    const executionReport = {
      ...this.execution_log,
      summary: {
        total_duration_seconds: totalDuration,
        total_duration_minutes: Math.round(totalDuration / 60 * 100) / 100,
        successful_phases: successfulPhases,
        total_phases: this.execution_log.phases.length,
        success_rate: `${Math.round((successfulPhases / this.execution_log.phases.length) * 100)}%`,
        overall_success: successfulPhases === this.execution_log.phases.length && this.execution_log.errors.length === 0
      }
    };

    await fs.ensureDir('logs');
    await fs.writeJson(reportFile, executionReport, { spaces: 2 });
    
    console.log(`\n📁 Execution report saved: ${reportFile}`);
    return reportFile;
  }

  displayFinalSummary() {
    const summary = this.execution_log.phases[this.execution_log.phases.length - 1]?.results;
    const enrichmentPhase = this.execution_log.phases.find(p => p.name === 'Enhanced Enrichment');
    const analyticsPhase = this.execution_log.phases.find(p => p.name === 'Quality Analysis');

    console.log('\n📊 FINAL SUMMARY');
    console.log('===============');
    
    if (summary) {
      console.log(`✅ Enriched Inspectors: ${summary.enriched_count || 'N/A'}`);
      console.log(`🏙️  Multi-City Assignments: ${summary.multi_city_assignments || 'N/A'}`);
      console.log(`⭐ Average Quality Score: ${summary.average_quality_score || 'N/A'}/100`);
      console.log(`🏆 High-Quality Listings: ${summary.high_quality_count || 'N/A'}`);
      console.log(`🌍 Cities Covered: ${summary.cities_covered || 'N/A'}`);
    }

    if (analyticsPhase?.results?.report_file) {
      console.log(`📋 Analytics Report: ${analyticsPhase.results.report_file}`);
    }

    const totalTime = this.execution_log.phases.reduce((sum, p) => sum + p.duration_seconds, 0);
    console.log(`⏱️  Total Execution Time: ${Math.round(totalTime / 60 * 100) / 100} minutes`);

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review analytics report for optimization opportunities');
    console.log('2. Implement recommendations for quality improvements');
    console.log('3. Monitor multi-city assignment performance');
    console.log('4. Consider expanding to additional Bay Area cities');
  }
}

// Main execution
async function main() {
  const orchestrator = new EnrichmentOrchestrator();
  
  try {
    await orchestrator.executeComprehensiveEnrichment();
    console.log('\n✅ All phases completed successfully');
    
  } catch (error) {
    console.error('\n❌ Execution failed:', error.message);
    console.log('\n📋 Check the execution log for detailed error information');
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { EnrichmentOrchestrator };