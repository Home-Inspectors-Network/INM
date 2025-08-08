#!/usr/bin/env node

/**
 * Enrichment Progress Monitor
 * Real-time monitoring of enrichment system performance
 * Tracks quality score improvements and success rates
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class EnrichmentProgressMonitor {
  constructor() {
    this.reportPath = path.join(__dirname, '..', 'logs', 'enrichment-progress.json');
  }

  async generateProgressReport() {
    console.log('📊 Generating enrichment progress report...\n');

    try {
      // Get current enrichment statistics
      const { data: allInspectors, error } = await supabase
        .from('inspectors')
        .select('*')
        .not('website', 'is', null);

      if (error) {
        console.error('Database error:', error.message);
        return null;
      }

      const report = {
        timestamp: new Date().toISOString(),
        total_inspectors_with_websites: allInspectors.length,
        enrichment_status: {
          completed: 0,
          in_progress: 0,
          pending: 0,
          failed: 0,
          not_started: 0
        },
        quality_distribution: {
          excellent: 0,    // 85-100
          good: 0,         // 70-84
          average: 0,      // 50-69
          poor: 0,         // 25-49
          very_poor: 0     // 0-24
        },
        enrichment_features: {
          with_logos: 0,
          with_detailed_services: 0,
          with_photos: 0,
          with_social_media: 0,
          with_business_hours: 0,
          with_certifications: 0,
          multi_city_assignments: 0
        },
        quality_scores: [],
        top_performers: [],
        improvement_needed: [],
        success_rate: 0,
        average_quality_score: 0
      };

      // Process each inspector
      let totalScore = 0;
      let completedEnrichments = 0;

      allInspectors.forEach(inspector => {
        // Enrichment status tracking
        const status = inspector.enrichment_status || 'not_started';
        report.enrichment_status[status]++;

        // Quality score analysis
        const qualityScore = inspector.quality_score || 0;
        report.quality_scores.push(qualityScore);
        totalScore += qualityScore;

        // Quality distribution
        if (qualityScore >= 85) report.quality_distribution.excellent++;
        else if (qualityScore >= 70) report.quality_distribution.good++;
        else if (qualityScore >= 50) report.quality_distribution.average++;
        else if (qualityScore >= 25) report.quality_distribution.poor++;
        else report.quality_distribution.very_poor++;

        // Feature completeness tracking
        if (inspector.logo_url) report.enrichment_features.with_logos++;
        if (inspector.detailed_services && inspector.detailed_services.length > 0) {
          report.enrichment_features.with_detailed_services++;
        }
        if (inspector.photo_gallery && inspector.photo_gallery.length > 0) {
          report.enrichment_features.with_photos++;
        }
        if (inspector.social_media && Object.keys(inspector.social_media).length > 0) {
          report.enrichment_features.with_social_media++;
        }
        if (inspector.business_hours) report.enrichment_features.with_business_hours++;
        if (inspector.certifications && inspector.certifications.length > 0) {
          report.enrichment_features.with_certifications++;
        }
        if (inspector.service_cities && inspector.service_cities.length > 1) {
          report.enrichment_features.multi_city_assignments++;
        }

        // Track completed enrichments
        if (status === 'completed') completedEnrichments++;

        // Top performers (quality score >= 90)
        if (qualityScore >= 90 && report.top_performers.length < 10) {
          report.top_performers.push({
            business_name: inspector.business_name,
            quality_score: qualityScore,
            city: inspector.address_city || inspector.city,
            website: inspector.website,
            features: {
              logo: !!inspector.logo_url,
              services: inspector.detailed_services?.length || 0,
              photos: inspector.photo_gallery?.length || 0,
              social_media: Object.keys(inspector.social_media || {}).length,
              certifications: inspector.certifications?.length || 0
            }
          });
        }

        // Improvement needed (quality score < 50)
        if (qualityScore < 50 && report.improvement_needed.length < 20) {
          const issues = [];
          if (!inspector.phone) issues.push('No phone');
          if (!inspector.website) issues.push('No website');
          if (!inspector.logo_url && inspector.website) issues.push('No logo');
          if (!inspector.detailed_services || inspector.detailed_services.length === 0) {
            issues.push('No services');
          }
          if (!inspector.certifications || inspector.certifications.length === 0) {
            issues.push('No certifications');
          }

          report.improvement_needed.push({
            business_name: inspector.business_name,
            quality_score: qualityScore,
            city: inspector.address_city || inspector.city,
            enrichment_status: status,
            main_issues: issues
          });
        }
      });

      // Calculate summary metrics
      report.success_rate = ((completedEnrichments / allInspectors.length) * 100).toFixed(1);
      report.average_quality_score = (totalScore / allInspectors.length).toFixed(1);

      // Calculate feature completeness percentages
      Object.keys(report.enrichment_features).forEach(feature => {
        const count = report.enrichment_features[feature];
        report.enrichment_features[`${feature}_percentage`] = 
          ((count / allInspectors.length) * 100).toFixed(1);
      });

      return report;

    } catch (error) {
      console.error('Error generating progress report:', error.message);
      return null;
    }
  }

  displayProgressReport(report) {
    console.log('🎯 ENRICHMENT PROGRESS REPORT');
    console.log('============================');
    console.log(`📅 Generated: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`📋 Total Inspectors with Websites: ${report.total_inspectors_with_websites}`);
    console.log();

    console.log('📊 ENRICHMENT STATUS:');
    console.log(`  ✅ Completed: ${report.enrichment_status.completed}`);
    console.log(`  🔄 In Progress: ${report.enrichment_status.in_progress}`);
    console.log(`  ⏳ Pending: ${report.enrichment_status.pending}`);
    console.log(`  ❌ Failed: ${report.enrichment_status.failed}`);
    console.log(`  📝 Not Started: ${report.enrichment_status.not_started}`);
    console.log(`  📈 Success Rate: ${report.success_rate}%`);
    console.log();

    console.log('🏆 QUALITY DISTRIBUTION:');
    console.log(`  🥇 Excellent (85-100): ${report.quality_distribution.excellent}`);
    console.log(`  🥈 Good (70-84): ${report.quality_distribution.good}`);
    console.log(`  🥉 Average (50-69): ${report.quality_distribution.average}`);
    console.log(`  ⚠️  Poor (25-49): ${report.quality_distribution.poor}`);
    console.log(`  🔴 Very Poor (0-24): ${report.quality_distribution.very_poor}`);
    console.log(`  📊 Average Score: ${report.average_quality_score}/100`);
    console.log();

    console.log('🚀 FEATURE COMPLETENESS:');
    console.log(`  🎨 Logos: ${report.enrichment_features.with_logos} (${report.enrichment_features.with_logos_percentage}%)`);
    console.log(`  📋 Detailed Services: ${report.enrichment_features.with_detailed_services} (${report.enrichment_features.with_detailed_services_percentage}%)`);
    console.log(`  📸 Photos: ${report.enrichment_features.with_photos} (${report.enrichment_features.with_photos_percentage}%)`);
    console.log(`  📱 Social Media: ${report.enrichment_features.with_social_media} (${report.enrichment_features.with_social_media_percentage}%)`);
    console.log(`  🕒 Business Hours: ${report.enrichment_features.with_business_hours} (${report.enrichment_features.with_business_hours_percentage}%)`);
    console.log(`  🏅 Certifications: ${report.enrichment_features.with_certifications} (${report.enrichment_features.with_certifications_percentage}%)`);
    console.log(`  🏙️  Multi-city: ${report.enrichment_features.multi_city_assignments} (${report.enrichment_features.multi_city_assignments_percentage}%)`);
    console.log();

    if (report.top_performers.length > 0) {
      console.log('🌟 TOP PERFORMERS:');
      report.top_performers.forEach((performer, index) => {
        console.log(`  ${index + 1}. ${performer.business_name} (${performer.city})`);
        console.log(`     Score: ${performer.quality_score}/100 | Services: ${performer.features.services} | Photos: ${performer.features.photos}`);
      });
      console.log();
    }

    if (report.improvement_needed.length > 0) {
      console.log('🔧 NEEDS IMPROVEMENT:');
      report.improvement_needed.slice(0, 10).forEach((inspector, index) => {
        console.log(`  ${index + 1}. ${inspector.business_name} (${inspector.city}) - Score: ${inspector.quality_score}`);
        console.log(`     Issues: ${inspector.main_issues.join(', ')}`);
      });
      console.log();
    }

    // Target progress
    const targetExcellent = 80;
    const currentExcellent = report.quality_distribution.excellent;
    const progressPercent = ((currentExcellent / targetExcellent) * 100).toFixed(1);

    console.log('🎯 TARGET PROGRESS:');
    console.log(`  Goal: ${targetExcellent} inspectors with excellent scores (85+)`);
    console.log(`  Current: ${currentExcellent} inspectors`);
    console.log(`  Progress: ${progressPercent}%`);
    
    if (currentExcellent >= targetExcellent) {
      console.log('  🎉 TARGET ACHIEVED!');
    } else {
      console.log(`  📈 Need ${targetExcellent - currentExcellent} more excellent scores`);
    }
  }

  async saveReport(report) {
    try {
      await fs.ensureDir(path.dirname(this.reportPath));
      await fs.writeJson(this.reportPath, report, { spaces: 2 });
      console.log(`\n💾 Progress report saved: ${this.reportPath}`);
    } catch (error) {
      console.error(`Error saving report: ${error.message}`);
    }
  }

  async compareWithPrevious(currentReport) {
    try {
      const previousReport = await fs.readJson(this.reportPath);
      
      console.log('\n📈 PROGRESS COMPARISON:');
      console.log('=======================');
      
      const completedDiff = currentReport.enrichment_status.completed - previousReport.enrichment_status.completed;
      const excellentDiff = currentReport.quality_distribution.excellent - previousReport.quality_distribution.excellent;
      const avgScoreDiff = (parseFloat(currentReport.average_quality_score) - parseFloat(previousReport.average_quality_score)).toFixed(1);
      
      console.log(`✅ New Completions: ${completedDiff > 0 ? '+' : ''}${completedDiff}`);
      console.log(`🏆 New Excellent Scores: ${excellentDiff > 0 ? '+' : ''}${excellentDiff}`);
      console.log(`📊 Average Score Change: ${avgScoreDiff > 0 ? '+' : ''}${avgScoreDiff}`);
      
    } catch (error) {
      console.log('\n📝 No previous report found for comparison');
    }
  }

  async monitor() {
    try {
      const report = await this.generateProgressReport();
      
      if (report) {
        this.displayProgressReport(report);
        await this.compareWithPrevious(report);
        await this.saveReport(report);
      }
      
    } catch (error) {
      console.error('Monitoring failed:', error.message);
    }
  }

  // Continuous monitoring mode
  async startContinuousMonitoring(intervalMinutes = 10) {
    console.log(`🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)...`);
    
    // Initial report
    await this.monitor();
    
    // Set up interval
    setInterval(async () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🔄 Automated monitoring check - ${new Date().toLocaleString()}`);
      await this.monitor();
    }, intervalMinutes * 60 * 1000);
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new EnrichmentProgressMonitor();
  const args = process.argv.slice(2);
  
  if (args[0] === 'continuous') {
    const interval = parseInt(args[1]) || 10;
    monitor.startContinuousMonitoring(interval)
      .catch(error => {
        console.error('Continuous monitoring failed:', error);
        process.exit(1);
      });
  } else {
    monitor.monitor()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Monitoring failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { EnrichmentProgressMonitor };