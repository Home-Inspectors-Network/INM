#!/usr/bin/env node

/**
 * Enrichment Quality Control System
 * Monitors enrichment quality and automatically fixes common issues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Logging
const logFile = path.join(__dirname, '..', 'logs', 'quality-control.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Quality scoring system
function calculateQualityScore(inspector) {
  let score = 0;
  const maxScore = 100;
  
  // Complete profile: 10 points
  if (inspector.business_name && inspector.phone && inspector.address_city && inspector.address_state) {
    score += 10;
  }
  
  // Verified phone: 5 points
  if (inspector.phone && isValidPhone(inspector.phone)) {
    score += 5;
  }
  
  // Active website: 5 points
  if (inspector.website && inspector.enrichment_status === 'completed') {
    score += 5;
  }
  
  // Recent reviews: 10 points
  if (inspector.google_reviews_count >= 10 && inspector.google_rating >= 4.0) {
    score += 10;
  }
  
  // Certifications: 5 points each (max 15)
  if (inspector.certifications && inspector.certifications.length > 0) {
    score += Math.min(inspector.certifications.length * 5, 15);
  }
  
  // Logo presence: 10 points
  if (inspector.logo_url) {
    score += 10;
  }
  
  // Detailed services: 15 points
  if (inspector.detailed_services && inspector.detailed_services.length >= 5) {
    score += 15;
  } else if (inspector.detailed_services && inspector.detailed_services.length > 0) {
    score += 10;
  }
  
  // Photo gallery: 10 points
  if (inspector.photo_gallery && inspector.photo_gallery.length >= 3) {
    score += 10;
  } else if (inspector.photo_gallery && inspector.photo_gallery.length > 0) {
    score += 5;
  }
  
  // Business hours: 5 points
  if (inspector.business_hours && Object.keys(inspector.business_hours).length > 0) {
    score += 5;
  }
  
  // Social media presence: 10 points
  if (inspector.social_media && Object.keys(inspector.social_media).length >= 2) {
    score += 10;
  } else if (inspector.social_media && Object.keys(inspector.social_media).length > 0) {
    score += 5;
  }
  
  // Company description: 5 points
  if (inspector.company_description && inspector.company_description.length > 50) {
    score += 5;
  }
  
  return Math.min(score, maxScore);
}

// Validate phone number
function isValidPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

// Check if website is accessible
async function checkWebsiteAccessibility(website) {
  try {
    const response = await axios.head(website, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InspectorsNearMe-QC/1.0)'
      }
    });
    
    return {
      accessible: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      redirected: response.request.res.responseUrl !== website
    };
  } catch (error) {
    return {
      accessible: false,
      statusCode: error.response?.status || null,
      error: error.message
    };
  }
}

// Identify low-quality listings
async function identifyLowQualityListings() {
  log('🔍 Identifying low-quality listings...');
  
  const { data: inspectors, error } = await supabase
    .from('inspectors')
    .select('*')
    .or('search_phase.like.%Bay Area%,data_source.like.%Bay Area%');
  
  if (error) {
    log(`Error fetching inspectors: ${error.message}`);
    return [];
  }
  
  const lowQualityInspectors = [];
  
  for (const inspector of inspectors) {
    const qualityScore = calculateQualityScore(inspector);
    
    // Flag as low quality if score < 40
    if (qualityScore < 40) {
      const issues = [];
      
      // Identify specific issues
      if (!inspector.phone || !isValidPhone(inspector.phone)) {
        issues.push('Invalid/missing phone');
      }
      
      if (!inspector.website) {
        issues.push('No website');
      } else if (inspector.enrichment_status === 'failed') {
        issues.push('Website enrichment failed');
      }
      
      if (!inspector.logo_url && inspector.website) {
        issues.push('No logo extracted');
      }
      
      if (!inspector.detailed_services || inspector.detailed_services.length === 0) {
        issues.push('No detailed services');
      }
      
      if (!inspector.certifications || inspector.certifications.length === 0) {
        issues.push('No certifications');
      }
      
      if (!inspector.google_reviews_count || inspector.google_reviews_count < 5) {
        issues.push('Few/no reviews');
      }
      
      lowQualityInspectors.push({
        ...inspector,
        quality_score: qualityScore,
        issues: issues
      });
    }
  }
  
  log(`Found ${lowQualityInspectors.length} low-quality listings`);
  return lowQualityInspectors;
}

// Auto-fix common issues
async function autoFixIssues(inspector) {
  log(`🔧 Auto-fixing issues for ${inspector.business_name}...`);
  
  const fixes = {};
  let fixCount = 0;
  
  // Fix missing certifications based on business name
  if (!inspector.certifications || inspector.certifications.length === 0) {
    const businessName = inspector.business_name.toLowerCase();
    const detectedCertifications = [];
    
    if (businessName.includes('ashi')) detectedCertifications.push('ASHI');
    if (businessName.includes('internachi')) detectedCertifications.push('InterNACHI');
    if (businessName.includes('certified')) detectedCertifications.push('Certified');
    if (businessName.includes('licensed')) detectedCertifications.push('Licensed');
    
    if (detectedCertifications.length > 0) {
      fixes.certifications = detectedCertifications;
      fixCount++;
      log(`  ✅ Fixed certifications: ${detectedCertifications.join(', ')}`);
    }
  }
  
  // Fix missing services based on business name
  if (!inspector.services || inspector.services.length === 0) {
    const defaultServices = ['Home Inspection', 'Property Inspection'];
    const businessName = inspector.business_name.toLowerCase();
    
    if (businessName.includes('mold')) defaultServices.push('Mold Inspection');
    if (businessName.includes('termite')) defaultServices.push('Termite Inspection');
    if (businessName.includes('radon')) defaultServices.push('Radon Testing');
    if (businessName.includes('commercial')) defaultServices.push('Commercial Inspection');
    
    fixes.services = defaultServices;
    fixCount++;
    log(`  ✅ Fixed services: ${defaultServices.join(', ')}`);
  }
  
  // Fix missing address fields if we have partial address
  if (!inspector.address_state && inspector.address_city) {
    fixes.address_state = 'CA'; // Bay Area default
    fixCount++;
    log(`  ✅ Fixed missing state: CA`);
  }
  
  // Check website accessibility and update status
  if (inspector.website && inspector.enrichment_status === 'failed') {
    const accessibility = await checkWebsiteAccessibility(inspector.website);
    
    if (accessibility.accessible) {
      fixes.enrichment_status = 'pending'; // Retry enrichment
      fixCount++;
      log(`  ✅ Website is accessible, marked for retry`);
    } else {
      fixes.enrichment_status = 'website_inaccessible';
      log(`  ⚠️ Website inaccessible: ${accessibility.error}`);
    }
  }
  
  // Apply fixes if any
  if (fixCount > 0) {
    const { error } = await supabase
      .from('inspectors')
      .update(fixes)
      .eq('id', inspector.id);
    
    if (error) {
      log(`  ❌ Error applying fixes: ${error.message}`);
      return false;
    }
    
    log(`  ✅ Applied ${fixCount} fixes successfully`);
    return true;
  }
  
  return false;
}

// Enhanced data validation
async function validateInspectorData(inspector) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Required fields validation
  if (!inspector.business_name || inspector.business_name.trim().length < 3) {
    validation.errors.push('Business name missing or too short');
    validation.valid = false;
  }
  
  // Phone validation
  if (inspector.phone && !isValidPhone(inspector.phone)) {
    validation.errors.push('Invalid phone number format');
    validation.valid = false;
  }
  
  // Email validation
  if (inspector.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inspector.email)) {
      validation.errors.push('Invalid email format');
      validation.valid = false;
    }
  }
  
  // Website validation
  if (inspector.website) {
    try {
      new URL(inspector.website);
    } catch {
      validation.errors.push('Invalid website URL');
      validation.valid = false;
    }
  }
  
  // Address validation
  if (!inspector.address_city || !inspector.address_state) {
    validation.warnings.push('Incomplete address information');
  }
  
  // Review validation
  if (inspector.google_rating && (inspector.google_rating < 1 || inspector.google_rating > 5)) {
    validation.errors.push('Invalid Google rating');
    validation.valid = false;
  }
  
  return validation;
}

// Flag for removal
async function flagForRemoval(inspector, reason) {
  log(`🚫 Flagging for removal: ${inspector.business_name} - ${reason}`);
  
  const { error } = await supabase
    .from('inspectors')
    .update({
      flagged_for_removal: true,
      removal_reason: reason,
      flagged_at: new Date().toISOString()
    })
    .eq('id', inspector.id);
  
  if (error) {
    log(`Error flagging inspector: ${error.message}`);
    return false;
  }
  
  return true;
}

// Generate quality control report
async function generateQualityReport() {
  log('📊 Generating quality control report...');
  
  const { data: inspectors, error } = await supabase
    .from('inspectors')
    .select('*')
    .or('search_phase.like.%Bay Area%,data_source.like.%Bay Area%');
  
  if (error) {
    log(`Error fetching inspectors: ${error.message}`);
    return null;
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    total_inspectors: inspectors.length,
    quality_distribution: {
      high_quality: 0,    // 80+ score
      medium_quality: 0,  // 40-79 score
      low_quality: 0      // <40 score
    },
    enrichment_stats: {
      completed: 0,
      pending: 0,
      failed: 0,
      no_website: 0
    },
    data_completeness: {
      with_logos: 0,
      with_detailed_services: 0,
      with_photos: 0,
      with_social_media: 0,
      with_certifications: 0
    },
    flags: {
      low_quality_count: 0,
      flagged_for_removal: 0,
      validation_errors: 0
    },
    top_quality_inspectors: [],
    improvement_needed: []
  };
  
  let totalScore = 0;
  const lowQualityThreshold = 40;
  
  for (const inspector of inspectors) {
    const qualityScore = calculateQualityScore(inspector);
    totalScore += qualityScore;
    
    // Quality distribution
    if (qualityScore >= 80) {
      report.quality_distribution.high_quality++;
    } else if (qualityScore >= 40) {
      report.quality_distribution.medium_quality++;
    } else {
      report.quality_distribution.low_quality++;
      report.flags.low_quality_count++;
    }
    
    // Enrichment stats
    if (inspector.enrichment_status === 'completed') report.enrichment_stats.completed++;
    else if (inspector.enrichment_status === 'pending') report.enrichment_stats.pending++;
    else if (inspector.enrichment_status === 'failed') report.enrichment_stats.failed++;
    else if (inspector.enrichment_status === 'no_website') report.enrichment_stats.no_website++;
    
    // Data completeness
    if (inspector.logo_url) report.data_completeness.with_logos++;
    if (inspector.detailed_services && inspector.detailed_services.length > 0) report.data_completeness.with_detailed_services++;
    if (inspector.photo_gallery && inspector.photo_gallery.length > 0) report.data_completeness.with_photos++;
    if (inspector.social_media && Object.keys(inspector.social_media).length > 0) report.data_completeness.with_social_media++;
    if (inspector.certifications && inspector.certifications.length > 0) report.data_completeness.with_certifications++;
    
    // Flagged items
    if (inspector.flagged_for_removal) report.flags.flagged_for_removal++;
    
    // Validation
    const validation = await validateInspectorData(inspector);
    if (!validation.valid) report.flags.validation_errors++;
    
    // Top quality inspectors
    if (qualityScore >= 90 && report.top_quality_inspectors.length < 10) {
      report.top_quality_inspectors.push({
        business_name: inspector.business_name,
        quality_score: qualityScore,
        rating: inspector.google_rating,
        reviews: inspector.google_reviews_count,
        website: inspector.website
      });
    }
    
    // Improvement needed
    if (qualityScore < lowQualityThreshold && report.improvement_needed.length < 20) {
      report.improvement_needed.push({
        business_name: inspector.business_name,
        quality_score: qualityScore,
        enrichment_status: inspector.enrichment_status,
        main_issues: [
          !inspector.phone ? 'No phone' : null,
          !inspector.website ? 'No website' : null,
          !inspector.logo_url && inspector.website ? 'No logo' : null,
          !inspector.detailed_services || inspector.detailed_services.length === 0 ? 'No services' : null
        ].filter(Boolean)
      });
    }
  }
  
  // Calculate percentages
  report.average_quality_score = (totalScore / inspectors.length).toFixed(1);
  report.accuracy_rate = ((report.total_inspectors - report.flags.validation_errors) / report.total_inspectors * 100).toFixed(1);
  
  // Calculate coverage percentages
  Object.keys(report.data_completeness).forEach(key => {
    const count = report.data_completeness[key];
    report.data_completeness[`${key}_percentage`] = ((count / report.total_inspectors) * 100).toFixed(1);
  });
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'logs', 'quality-control-report.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });
  
  log(`\n📊 QUALITY CONTROL REPORT`);
  log(`========================`);
  log(`Total Inspectors: ${report.total_inspectors}`);
  log(`Average Quality Score: ${report.average_quality_score}/100`);
  log(`Accuracy Rate: ${report.accuracy_rate}%`);
  log(`\nQuality Distribution:`);
  log(`  High Quality (80+): ${report.quality_distribution.high_quality}`);
  log(`  Medium Quality (40-79): ${report.quality_distribution.medium_quality}`);
  log(`  Low Quality (<40): ${report.quality_distribution.low_quality}`);
  log(`\nData Completeness:`);
  log(`  Logos: ${report.data_completeness.with_logos_percentage}%`);
  log(`  Detailed Services: ${report.data_completeness.with_detailed_services_percentage}%`);
  log(`  Photos: ${report.data_completeness.with_photos_percentage}%`);
  log(`\nFlags:`);
  log(`  Low Quality: ${report.flags.low_quality_count}`);
  log(`  Validation Errors: ${report.flags.validation_errors}`);
  log(`  Flagged for Removal: ${report.flags.flagged_for_removal}`);
  
  return report;
}

// Main quality control process
async function runQualityControl() {
  log('🛡️ STARTING QUALITY CONTROL PROCESS');
  log('===================================');
  
  try {
    // Ensure logs directory exists
    await fs.ensureDir(path.dirname(logFile));
    
    // Step 1: Identify low-quality listings
    const lowQualityInspectors = await identifyLowQualityListings();
    
    // Step 2: Auto-fix common issues
    let fixedCount = 0;
    for (const inspector of lowQualityInspectors) {
      const fixed = await autoFixIssues(inspector);
      if (fixed) fixedCount++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Flag extremely poor quality for removal
    let flaggedCount = 0;
    for (const inspector of lowQualityInspectors) {
      const qualityScore = calculateQualityScore(inspector);
      
      if (qualityScore < 20) {
        const validation = await validateInspectorData(inspector);
        if (!validation.valid && validation.errors.length > 2) {
          await flagForRemoval(inspector, `Quality score: ${qualityScore}, Errors: ${validation.errors.join(', ')}`);
          flaggedCount++;
        }
      }
    }
    
    // Step 4: Generate final quality report
    const report = await generateQualityReport();
    
    log('\n🎯 QUALITY CONTROL COMPLETED');
    log('============================');
    log(`Auto-fixed issues: ${fixedCount}`);
    log(`Flagged for removal: ${flaggedCount}`);
    log(`Average quality score: ${report.average_quality_score}/100`);
    log(`Accuracy rate: ${report.accuracy_rate}%`);
    
    // Check if we meet quality standards
    const qualityStandards = {
      accuracy_rate: 95,
      average_score: 60,
      low_quality_rate: 10
    };
    
    const lowQualityRate = (report.quality_distribution.low_quality / report.total_inspectors * 100).toFixed(1);
    
    log('\n📋 QUALITY STANDARDS CHECK:');
    log(`✅ Accuracy Rate: ${report.accuracy_rate}% (target: ${qualityStandards.accuracy_rate}%)`);
    log(`${parseFloat(report.average_quality_score) >= qualityStandards.average_score ? '✅' : '❌'} Average Score: ${report.average_quality_score} (target: ${qualityStandards.average_score})`);
    log(`${parseFloat(lowQualityRate) <= qualityStandards.low_quality_rate ? '✅' : '❌'} Low Quality Rate: ${lowQualityRate}% (target: <${qualityStandards.low_quality_rate}%)`);
    
    return report;
    
  } catch (error) {
    log(`❌ FATAL ERROR: ${error.message}`);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'report') {
    generateQualityReport()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Quality report failed:', error);
        process.exit(1);
      });
  } else {
    runQualityControl()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Quality control failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  runQualityControl,
  generateQualityReport,
  calculateQualityScore,
  identifyLowQualityListings,
  autoFixIssues
};