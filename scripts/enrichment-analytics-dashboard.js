#!/usr/bin/env node

/**
 * Enrichment Analytics Dashboard
 * 
 * Provides comprehensive analytics and quality control for the enhanced enrichment:
 * - Quality scoring analysis
 * - Multi-city coverage mapping
 * - Feature extraction success rates
 * - Data completeness metrics
 * - Performance benchmarking
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class EnrichmentAnalytics {
  constructor() {
    this.analytics = {
      overview: {},
      quality_distribution: {},
      feature_analysis: {},
      multi_city_coverage: {},
      data_completeness: {},
      performance_metrics: {},
      recommendations: []
    };
  }

  async generateComprehensiveReport() {
    console.log('📊 ENRICHMENT ANALYTICS DASHBOARD');
    console.log('==================================\n');

    try {
      await this.analyzeOverview();
      await this.analyzeQualityDistribution();
      await this.analyzeFeatureExtraction();
      await this.analyzeMultiCityCoverage();
      await this.analyzeDataCompleteness();
      await this.generateRecommendations();
      
      return await this.saveReport();
      
    } catch (error) {
      console.error('Analytics generation failed:', error.message);
      throw error;
    }
  }

  async analyzeOverview() {
    console.log('📋 Analyzing Overview Metrics...');

    const { data: allInspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .eq('address_city', 'Palo Alto');

    if (error) throw error;

    const enrichedInspectors = allInspectors.filter(i => i.enrichment_status === 'completed');
    const withWebsites = allInspectors.filter(i => i.website);
    const multiCityAssignments = allInspectors.filter(i => i.is_multi_city_assignment);

    this.analytics.overview = {
      total_palo_alto_inspectors: allInspectors.length,
      inspectors_with_websites: withWebsites.length,
      enriched_inspectors: enrichedInspectors.length,
      multi_city_assignments: multiCityAssignments.length,
      enrichment_rate: ((enrichedInspectors.length / withWebsites.length) * 100).toFixed(1) + '%',
      average_quality_score: enrichedInspectors.length > 0 
        ? Math.round(enrichedInspectors.reduce((sum, i) => sum + (i.quality_score || 0), 0) / enrichedInspectors.length)
        : 0
    };

    console.log(`  ✓ Total Palo Alto inspectors: ${this.analytics.overview.total_palo_alto_inspectors}`);
    console.log(`  ✓ With websites: ${this.analytics.overview.inspectors_with_websites}`);
    console.log(`  ✓ Successfully enriched: ${this.analytics.overview.enriched_inspectors}`);
    console.log(`  ✓ Multi-city assignments: ${this.analytics.overview.multi_city_assignments}`);
  }

  async analyzeQualityDistribution() {
    console.log('\n⭐ Analyzing Quality Score Distribution...');

    const { data: enrichedInspectors, error } = await supabase
      .from('inspectors')
      .select('quality_score, business_name, enrichment_data')
      .eq('address_city', 'Palo Alto')
      .eq('enrichment_status', 'completed')
      .not('quality_score', 'is', null);

    if (error) throw error;

    const qualityRanges = {
      'excellent': { min: 80, max: 100, count: 0, inspectors: [] },
      'good': { min: 60, max: 79, count: 0, inspectors: [] },
      'fair': { min: 40, max: 59, count: 0, inspectors: [] },
      'poor': { min: 0, max: 39, count: 0, inspectors: [] }
    };

    enrichedInspectors.forEach(inspector => {
      const score = inspector.quality_score || 0;
      
      Object.entries(qualityRanges).forEach(([range, config]) => {
        if (score >= config.min && score <= config.max) {
          config.count++;
          config.inspectors.push({
            name: inspector.business_name,
            score: score
          });
        }
      });
    });

    this.analytics.quality_distribution = {
      total_scored: enrichedInspectors.length,
      ranges: qualityRanges,
      highest_score: Math.max(...enrichedInspectors.map(i => i.quality_score || 0)),
      lowest_score: Math.min(...enrichedInspectors.map(i => i.quality_score || 0)),
      average_score: enrichedInspectors.length > 0 
        ? Math.round(enrichedInspectors.reduce((sum, i) => sum + (i.quality_score || 0), 0) / enrichedInspectors.length)
        : 0
    };

    console.log(`  ✓ Excellent (80-100): ${qualityRanges.excellent.count} inspectors`);
    console.log(`  ✓ Good (60-79): ${qualityRanges.good.count} inspectors`);
    console.log(`  ✓ Fair (40-59): ${qualityRanges.fair.count} inspectors`);
    console.log(`  ✓ Poor (0-39): ${qualityRanges.poor.count} inspectors`);
  }

  async analyzeFeatureExtraction() {
    console.log('\n🔍 Analyzing Feature Extraction Success...');

    const { data: enrichedInspectors, error } = await supabase
      .from('inspectors')
      .select('enrichment_data, business_name')
      .eq('address_city', 'Palo Alto')
      .eq('enrichment_status', 'completed')
      .not('enrichment_data', 'is', null);

    if (error) throw error;

    const featureStats = {
      business_hours: 0,
      contact_info: 0,
      social_media: 0,
      credentials: 0,
      services: 0,
      tech_features: 0,
      about_info: 0,
      media: 0,
      reviews_info: 0,
      awards: 0,
      insurance_licensing: 0,
      equipment: 0,
      educational_content: 0
    };

    const socialPlatforms = {
      facebook: 0,
      linkedin: 0,
      instagram: 0,
      youtube: 0,
      twitter: 0,
      yelp: 0
    };

    const commonCredentials = {};
    const commonServices = {};

    enrichedInspectors.forEach(inspector => {
      const data = inspector.enrichment_data || {};
      
      // Count feature presence
      Object.keys(featureStats).forEach(feature => {
        if (data[feature]) {
          featureStats[feature]++;
        }
      });

      // Count social media platforms
      if (data.social_media) {
        Object.keys(socialPlatforms).forEach(platform => {
          if (data.social_media[platform]) {
            socialPlatforms[platform]++;
          }
        });
      }

      // Track common credentials
      if (data.credentials && Array.isArray(data.credentials)) {
        data.credentials.forEach(cred => {
          commonCredentials[cred] = (commonCredentials[cred] || 0) + 1;
        });
      }

      // Track common services
      if (data.services && Array.isArray(data.services)) {
        data.services.forEach(service => {
          commonServices[service] = (commonServices[service] || 0) + 1;
        });
      }
    });

    const total = enrichedInspectors.length;

    this.analytics.feature_analysis = {
      total_analyzed: total,
      feature_success_rates: Object.fromEntries(
        Object.entries(featureStats).map(([feature, count]) => [
          feature,
          {
            count,
            percentage: ((count / total) * 100).toFixed(1) + '%'
          }
        ])
      ),
      social_media_breakdown: Object.fromEntries(
        Object.entries(socialPlatforms).map(([platform, count]) => [
          platform,
          {
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%'
          }
        ])
      ),
      top_credentials: Object.entries(commonCredentials)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([cred, count]) => ({ credential: cred, count })),
      top_services: Object.entries(commonServices)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([service, count]) => ({ service, count }))
    };

    console.log(`  ✓ Business hours found: ${featureStats.business_hours} (${this.analytics.feature_analysis.feature_success_rates.business_hours.percentage})`);
    console.log(`  ✓ Social media found: ${featureStats.social_media} (${this.analytics.feature_analysis.feature_success_rates.social_media.percentage})`);
    console.log(`  ✓ Credentials found: ${featureStats.credentials} (${this.analytics.feature_analysis.feature_success_rates.credentials.percentage})`);
    console.log(`  ✓ Tech features found: ${featureStats.tech_features} (${this.analytics.feature_analysis.feature_success_rates.tech_features.percentage})`);
  }

  async analyzeMultiCityCoverage() {
    console.log('\n🏙️  Analyzing Multi-City Coverage...');

    const { data: allAssignments, error } = await supabase
      .from('inspectors')
      .select('address_city, service_cities, is_multi_city_assignment, original_inspector_id, business_name')
      .or('address_city.eq.Palo Alto,is_multi_city_assignment.eq.true');

    if (error) throw error;

    const originalInspectors = allAssignments.filter(i => !i.is_multi_city_assignment && i.address_city === 'Palo Alto');
    const multiCityAssignments = allAssignments.filter(i => i.is_multi_city_assignment);

    const cityCoverage = {};
    const serviceCitiesCount = {};

    // Analyze service cities from original inspectors
    originalInspectors.forEach(inspector => {
      if (inspector.service_cities && Array.isArray(inspector.service_cities)) {
        inspector.service_cities.forEach(city => {
          cityCoverage[city] = (cityCoverage[city] || 0) + 1;
        });
        
        const cityCount = inspector.service_cities.length;
        serviceCitiesCount[cityCount] = (serviceCitiesCount[cityCount] || 0) + 1;
      }
    });

    // Count assignments by city
    const assignmentsByCity = {};
    multiCityAssignments.forEach(assignment => {
      const city = assignment.address_city;
      assignmentsByCity[city] = (assignmentsByCity[city] || 0) + 1;
    });

    this.analytics.multi_city_coverage = {
      original_palo_alto_inspectors: originalInspectors.length,
      multi_city_assignments_created: multiCityAssignments.length,
      cities_with_assignments: Object.keys(assignmentsByCity).length,
      assignments_by_city: Object.entries(assignmentsByCity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([city, count]) => ({ city, count })),
      service_cities_distribution: Object.entries(serviceCitiesCount)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([count, inspectors]) => ({
          cities_served: parseInt(count),
          inspector_count: inspectors
        }))
    };

    console.log(`  ✓ Original Palo Alto inspectors: ${originalInspectors.length}`);
    console.log(`  ✓ Multi-city assignments created: ${multiCityAssignments.length}`);
    console.log(`  ✓ Cities now covered: ${Object.keys(assignmentsByCity).length}`);
    
    const topCities = this.analytics.multi_city_coverage.assignments_by_city.slice(0, 5);
    topCities.forEach(({ city, count }) => {
      console.log(`    - ${city}: ${count} inspectors`);
    });
  }

  async analyzeDataCompleteness() {
    console.log('\n📊 Analyzing Data Completeness...');

    const { data: allInspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .eq('address_city', 'Palo Alto');

    if (error) throw error;

    const completenessMetrics = {
      basic_info: {
        business_name: 0,
        phone: 0,
        website: 0,
        address: 0
      },
      contact_info: {
        email: 0,
        verified_phone: 0,
        multiple_contact_methods: 0
      },
      professional_info: {
        certifications: 0,
        insurance_verified: 0,
        years_in_business: 0,
        services_listed: 0
      },
      digital_presence: {
        website_working: 0,
        social_media: 0,
        online_booking: 0,
        digital_reports: 0
      }
    };

    allInspectors.forEach(inspector => {
      // Basic info
      if (inspector.business_name) completenessMetrics.basic_info.business_name++;
      if (inspector.phone) completenessMetrics.basic_info.phone++;
      if (inspector.website) completenessMetrics.basic_info.website++;
      if (inspector.address_street) completenessMetrics.basic_info.address++;

      // Contact info
      if (inspector.email) completenessMetrics.contact_info.email++;
      if (inspector.phone && inspector.phone.length >= 10) completenessMetrics.contact_info.verified_phone++;

      // Professional info
      if (inspector.certifications && inspector.certifications.length > 0) completenessMetrics.professional_info.certifications++;
      if (inspector.insurance_verified) completenessMetrics.professional_info.insurance_verified++;
      if (inspector.years_in_business) completenessMetrics.professional_info.years_in_business++;
      if (inspector.services && inspector.services.length > 0) completenessMetrics.professional_info.services_listed++;

      // Digital presence (from enrichment data)
      if (inspector.enrichment_data) {
        const data = inspector.enrichment_data;
        if (data.social_media) completenessMetrics.digital_presence.social_media++;
        if (data.tech_features && data.tech_features.includes('online_booking')) completenessMetrics.digital_presence.online_booking++;
        if (data.tech_features && data.tech_features.includes('digital_reports')) completenessMetrics.digital_presence.digital_reports++;
      }
    });

    const total = allInspectors.length;

    this.analytics.data_completeness = {
      total_inspectors: total,
      completeness_percentages: {}
    };

    // Calculate percentages for each category
    Object.entries(completenessMetrics).forEach(([category, metrics]) => {
      this.analytics.data_completeness.completeness_percentages[category] = {};
      Object.entries(metrics).forEach(([metric, count]) => {
        this.analytics.data_completeness.completeness_percentages[category][metric] = {
          count,
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%'
        };
      });
    });

    console.log(`  ✓ Business names: ${completenessMetrics.basic_info.business_name}/${total}`);
    console.log(`  ✓ Phone numbers: ${completenessMetrics.basic_info.phone}/${total}`);
    console.log(`  ✓ Websites: ${completenessMetrics.basic_info.website}/${total}`);
    console.log(`  ✓ Email addresses: ${completenessMetrics.contact_info.email}/${total}`);
    console.log(`  ✓ Certifications: ${completenessMetrics.professional_info.certifications}/${total}`);
  }

  generateRecommendations() {
    console.log('\n💡 Generating Recommendations...');

    const recommendations = [];

    // Quality score recommendations
    const poorQuality = this.analytics.quality_distribution.ranges?.poor?.count || 0;
    if (poorQuality > 0) {
      recommendations.push({
        priority: 'high',
        category: 'quality_improvement',
        title: 'Improve Low-Quality Listings',
        description: `${poorQuality} inspectors have quality scores below 40. Focus on enriching these profiles with missing contact information, credentials, and service details.`,
        action_items: [
          'Review and update contact information',
          'Add missing certifications and credentials',
          'Enhance service descriptions',
          'Verify insurance and licensing status'
        ]
      });
    }

    // Multi-city coverage recommendations
    const multiCityCount = this.analytics.multi_city_coverage?.multi_city_assignments_created || 0;
    const originalCount = this.analytics.multi_city_coverage?.original_palo_alto_inspectors || 0;
    
    if (multiCityCount < originalCount * 2) {
      recommendations.push({
        priority: 'medium',
        category: 'expansion_opportunity',
        title: 'Expand Multi-City Coverage',
        description: 'Many inspectors likely serve additional Bay Area cities that haven\'t been detected. Enhanced service area mapping could increase coverage.',
        action_items: [
          'Review inspector websites for additional service areas',
          'Contact inspectors directly to confirm service cities',
          'Implement geo-radius based service area estimation',
          'Add manual city assignment capabilities'
        ]
      });
    }

    // Feature extraction recommendations
    const socialMediaRate = parseFloat(this.analytics.feature_analysis?.feature_success_rates?.social_media?.percentage) || 0;
    if (socialMediaRate < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'data_enrichment',
        title: 'Improve Social Media Detection',
        description: `Only ${socialMediaRate}% of inspectors have social media links detected. Enhanced extraction could improve digital presence tracking.`,
        action_items: [
          'Implement deeper social media link detection',
          'Search for social profiles using business names',
          'Add manual social media verification process',
          'Create social media presence scoring'
        ]
      });
    }

    // Data completeness recommendations
    const emailRate = parseFloat(this.analytics.data_completeness?.completeness_percentages?.contact_info?.email?.percentage) || 0;
    if (emailRate < 70) {
      recommendations.push({
        priority: 'high',
        category: 'contact_improvement',
        title: 'Increase Email Address Collection',
        description: `Only ${emailRate}% of inspectors have email addresses. This is critical for lead delivery and communication.`,
        action_items: [
          'Enhance email extraction from websites',
          'Implement contact form detection',
          'Add email verification prompts for inspectors',
          'Create email collection incentives'
        ]
      });
    }

    this.analytics.recommendations = recommendations;

    console.log(`  ✓ Generated ${recommendations.length} recommendations`);
    recommendations.forEach((rec, index) => {
      console.log(`    ${index + 1}. ${rec.title} (${rec.priority} priority)`);
    });
  }

  async saveReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `logs/enrichment-analytics-${timestamp}.json`;
    
    const fullReport = {
      generated_at: new Date().toISOString(),
      report_version: '1.0',
      ...this.analytics
    };

    await fs.ensureDir('logs');
    await fs.writeJson(reportFile, fullReport, { spaces: 2 });

    console.log(`\n📁 Analytics report saved: ${reportFile}`);
    return { reportFile, analytics: fullReport };
  }
}

// Main execution
async function runAnalytics() {
  const analytics = new EnrichmentAnalytics();
  
  try {
    const result = await analytics.generateComprehensiveReport();
    
    console.log('\n🎉 ANALYTICS COMPLETE');
    console.log('====================');
    console.log('📊 Key Metrics:');
    console.log(`  • Enrichment Rate: ${result.analytics.overview.enrichment_rate}`);
    console.log(`  • Average Quality Score: ${result.analytics.overview.average_quality_score}/100`);
    console.log(`  • Multi-City Assignments: ${result.analytics.overview.multi_city_assignments}`);
    console.log(`  • Recommendations Generated: ${result.analytics.recommendations.length}`);
    
    return result;
    
  } catch (error) {
    console.error('Analytics failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runAnalytics()
    .then(() => {
      console.log('\n✅ Analytics completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Analytics failed:', error);
      process.exit(1);
    });
}

module.exports = { EnrichmentAnalytics, runAnalytics };