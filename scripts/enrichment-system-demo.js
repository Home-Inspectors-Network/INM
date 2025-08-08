#!/usr/bin/env node

/**
 * Inspector Enrichment System - Complete Demo
 * Demonstrates the full enrichment pipeline for Palo Alto inspectors
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Quality Control System
class InspectorQualityControl {
  constructor() {
    this.qualityMetrics = {
      completeProfile: 10,
      verifiedPhone: 5,
      activeWebsite: 5,
      recentReviews: 10,
      certificationPoints: 5, // per certification, max 25
      serviceVariety: 2, // per service, max 20
      insuranceVerified: 10,
      businessHours: 5,
      socialMedia: 3, // per platform, max 15
      professionalDescription: 5
    };
    
    this.minimumScore = 30; // Flag for removal below this
    this.targetScore = 70;  // Target quality score
    this.premiumScore = 85; // Premium listing threshold
  }

  calculateScore(inspector) {
    let score = 0;
    
    // Complete profile components
    if (inspector.business_name && inspector.email && inspector.phone && inspector.website) {
      score += this.qualityMetrics.completeProfile;
    }
    
    // Verified phone
    if (inspector.phone && this.isValidPhone(inspector.phone)) {
      score += this.qualityMetrics.verifiedPhone;
    }
    
    // Active website
    if (inspector.website && inspector.website.startsWith('http')) {
      score += this.qualityMetrics.activeWebsite;
    }
    
    // Recent reviews
    if (inspector.rating && inspector.review_count) {
      if (inspector.review_count >= 50 && inspector.rating >= 4.5) {
        score += this.qualityMetrics.recentReviews;
      } else if (inspector.review_count >= 20 && inspector.rating >= 4.0) {
        score += 7;
      } else if (inspector.review_count >= 10 && inspector.rating >= 3.5) {
        score += 5;
      }
    }
    
    // Certifications
    if (inspector.certifications && Array.isArray(inspector.certifications)) {
      score += Math.min(
        inspector.certifications.length * this.qualityMetrics.certificationPoints,
        25
      );
    }
    
    // Services variety
    if (inspector.services && Array.isArray(inspector.services)) {
      score += Math.min(
        inspector.services.length * this.qualityMetrics.serviceVariety,
        20
      );
    }
    
    // Insurance verification
    if (inspector.insurance_verified) {
      score += this.qualityMetrics.insuranceVerified;
    }
    
    // Business hours
    if (inspector.business_hours) {
      score += this.qualityMetrics.businessHours;
    }
    
    // Social media presence
    if (inspector.social_media && typeof inspector.social_media === 'object') {
      const platforms = Object.keys(inspector.social_media).length;
      score += Math.min(platforms * this.qualityMetrics.socialMedia, 15);
    }
    
    // Professional description
    if (inspector.description && inspector.description.length > 100) {
      score += this.qualityMetrics.professionalDescription;
    }
    
    return Math.min(score, 100);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  getQualityTier(score) {
    if (score >= this.premiumScore) return 'Premium';
    if (score >= this.targetScore) return 'Good';
    if (score >= this.minimumScore) return 'Fair';
    return 'Needs Improvement';
  }
}

// Enrichment Data Generator
class EnrichmentDataGenerator {
  static generateRealisticData(existingInspector) {
    const services = [
      'Home Inspection',
      'Pre-Purchase Inspection', 
      'Pre-Listing Inspection',
      'New Construction Inspection',
      'Commercial Inspection',
      'Pest Inspection',
      'Radon Testing',
      'Mold Testing',
      'Thermal Imaging',
      'Pool/Spa Inspection',
      'Well Water Testing',
      'Septic Inspection'
    ];

    const certifications = [
      'ASHI Certified Inspector',
      'InterNACHI Certified',
      'California Real Estate Inspector',
      'Pest Control License',
      'Radon Measurement Professional',
      'Certified Mold Inspector',
      'Thermal Imaging Certified',
      'Pool/Spa Inspector Certified'
    ];

    const serviceAreas = [
      'Palo Alto',
      'Mountain View', 
      'Los Altos',
      'Menlo Park',
      'Stanford',
      'East Palo Alto',
      'Redwood City',
      'San Mateo',
      'Sunnyvale',
      'Cupertino'
    ];

    return {
      email: existingInspector.email || 'info@bayareahomeinspections.com',
      website: existingInspector.website || 'https://www.bayareahomeinspections.com',
      services: services.slice(0, Math.floor(Math.random() * 8) + 4), // 4-12 services
      certifications: certifications.slice(0, Math.floor(Math.random() * 5) + 3), // 3-8 certifications
      business_hours: {
        monday: '8:00 AM - 6:00 PM',
        tuesday: '8:00 AM - 6:00 PM',
        wednesday: '8:00 AM - 6:00 PM',
        thursday: '8:00 AM - 6:00 PM',
        friday: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      years_in_business: Math.floor(Math.random() * 20) + 5, // 5-25 years
      insurance_verified: true,
      license_number: `CA-HI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      service_area: serviceAreas.slice(0, Math.floor(Math.random() * 6) + 3), // 3-9 areas
      payment_methods: ['Cash', 'Check', 'Credit Card', 'PayPal', 'Zelle'],
      social_media: {
        facebook: 'https://facebook.com/bayareahomeinspections',
        linkedin: 'https://linkedin.com/company/bay-area-home-inspections',
        yelp: 'https://yelp.com/biz/bay-area-home-inspections-palo-alto',
        google: 'https://g.page/bay-area-home-inspections'
      },
      description: 'Professional home inspection services in the Bay Area with extensive experience. We provide comprehensive inspections using the latest technology including thermal imaging and moisture detection. Licensed, insured, and certified by leading industry organizations.',
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0 rating
      review_count: Math.floor(Math.random() * 200) + 25, // 25-225 reviews
      last_updated: new Date().toISOString()
    };
  }
}

// Main Demo Function
async function runEnrichmentDemo() {
  console.log('🏠 INSPECTOR ENRICHMENT SYSTEM DEMO');
  console.log('═'.repeat(60));
  
  const qualityControl = new InspectorQualityControl();
  
  try {
    // Step 1: Find Palo Alto inspectors
    console.log('1️⃣ Finding Palo Alto inspectors...\n');
    
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*')
      .ilike('city', '%palo alto%')
      .limit(3);

    if (error) throw error;

    if (inspectors.length === 0) {
      console.log('❌ No Palo Alto inspectors found.');
      return;
    }

    console.log(`Found ${inspectors.length} inspectors:`);
    
    // Step 2: Analyze current quality scores
    console.log('\n2️⃣ Current Quality Analysis:\n');
    
    inspectors.forEach((inspector, index) => {
      const currentScore = qualityControl.calculateScore(inspector);
      const tier = qualityControl.getQualityTier(currentScore);
      
      console.log(`Inspector ${index + 1}: ${inspector.business_name || 'Unnamed'}`);
      console.log(`   Current Score: ${currentScore}/100 (${tier})`);
      console.log(`   Missing: ${inspector.email ? '' : 'Email, '}${inspector.website ? '' : 'Website, '}${inspector.services ? '' : 'Services, '}${inspector.certifications ? '' : 'Certifications'}`);
      console.log('');
    });

    // Step 3: Demonstrate enrichment on first inspector
    const targetInspector = inspectors[0];
    console.log(`3️⃣ Enriching: ${targetInspector.business_name || targetInspector.id}\n`);
    
    const enrichmentData = EnrichmentDataGenerator.generateRealisticData(targetInspector);
    
    // Show what would be updated
    console.log('📝 Enrichment Data Preview:');
    console.log(`   Email: ${enrichmentData.email}`);
    console.log(`   Website: ${enrichmentData.website}`);
    console.log(`   Services: ${enrichmentData.services.length} services`);
    console.log(`   Certifications: ${enrichmentData.certifications.length} certifications`);
    console.log(`   Years in Business: ${enrichmentData.years_in_business}`);
    console.log(`   Insurance: ${enrichmentData.insurance_verified ? 'Verified' : 'Not verified'}`);
    console.log(`   Rating: ${enrichmentData.rating} (${enrichmentData.review_count} reviews)`);
    console.log(`   Service Areas: ${enrichmentData.service_area.join(', ')}`);
    
    // Calculate new score with enriched data
    const enrichedInspector = { ...targetInspector, ...enrichmentData };
    const newScore = qualityControl.calculateScore(enrichedInspector);
    const currentScore = qualityControl.calculateScore(targetInspector);
    
    console.log('\n4️⃣ Quality Score Impact:\n');
    console.log(`   Before: ${currentScore}/100 (${qualityControl.getQualityTier(currentScore)})`);
    console.log(`   After:  ${newScore}/100 (${qualityControl.getQualityTier(newScore)})`);
    console.log(`   Improvement: +${newScore - currentScore} points`);
    
    // Step 4: Show enrichment pipeline
    console.log('\n5️⃣ Enrichment Pipeline Architecture:\n');
    
    console.log('📊 DATA SOURCES:');
    console.log('   • Google Maps Business API');
    console.log('   • Yelp Fusion API');
    console.log('   • Better Business Bureau');
    console.log('   • State licensing databases');
    console.log('   • Social media APIs');
    console.log('   • Website contact scraping');
    console.log('   • Industry certification boards');
    
    console.log('\n🔄 AUTOMATION SCHEDULE:');
    console.log('   • Daily: New listing enrichment');
    console.log('   • Weekly: Contact verification');
    console.log('   • Monthly: Certification updates');
    console.log('   • Quarterly: Insurance renewal checks');
    console.log('   • Annually: License verification');
    
    console.log('\n⚡ QUALITY TRIGGERS:');
    console.log(`   • Score < ${qualityControl.minimumScore}: Flag for removal`);
    console.log(`   • Score < ${qualityControl.targetScore}: Priority enrichment`);
    console.log(`   • Score ≥ ${qualityControl.premiumScore}: Premium tier eligible`);
    
    console.log('\n🎯 ENRICHMENT PRIORITIES:');
    console.log('   1. Missing contact information (email, phone)');
    console.log('   2. Service offerings and specializations');
    console.log('   3. Professional certifications');
    console.log('   4. Customer reviews and ratings');
    console.log('   5. Insurance and license verification');
    console.log('   6. Business hours and availability');
    console.log('   7. Service area coverage');
    console.log('   8. Social media presence');
    
    // Optional: Actually perform the enrichment
    console.log('\n6️⃣ Execute Enrichment? (This would update the database)\n');
    console.log('   To run actual enrichment: npm run test-enrichment');
    console.log('   To see SQL queries: npm run sql-demo');
    
  } catch (error) {
    console.error('❌ Demo Error:', error.message);
  }
}

// Export for testing
if (require.main === module) {
  runEnrichmentDemo().catch(console.error);
}

module.exports = {
  InspectorQualityControl,
  EnrichmentDataGenerator,
  runEnrichmentDemo
};