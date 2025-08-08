#!/usr/bin/env node

/**
 * TOP 10 COMPREHENSIVE COLLECTOR
 * 
 * Phase 1: Collect Top 10 Home Inspectors for 20 Major Cities
 * Uses Firecrawl API for multi-engine search and data extraction
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const FirecrawlApp = require('firecrawl-js').default;
const fs = require('fs-extra');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Target 20 Major Cities
const TARGET_CITIES = [
  { name: 'New York City', state: 'NY', shortName: 'NYC' },
  { name: 'Los Angeles', state: 'CA', shortName: 'LA' },
  { name: 'Chicago', state: 'IL', shortName: 'Chicago' },
  { name: 'Houston', state: 'TX', shortName: 'Houston' },
  { name: 'Phoenix', state: 'AZ', shortName: 'Phoenix' },
  { name: 'Philadelphia', state: 'PA', shortName: 'Philly' },
  { name: 'San Antonio', state: 'TX', shortName: 'San Antonio' },
  { name: 'San Diego', state: 'CA', shortName: 'San Diego' },
  { name: 'Dallas', state: 'TX', shortName: 'Dallas' },
  { name: 'San Jose', state: 'CA', shortName: 'San Jose' },
  { name: 'San Francisco', state: 'CA', shortName: 'SF' },
  { name: 'Seattle', state: 'WA', shortName: 'Seattle' },
  { name: 'Austin', state: 'TX', shortName: 'Austin' },
  { name: 'Denver', state: 'CO', shortName: 'Denver' },
  { name: 'Boston', state: 'MA', shortName: 'Boston' },
  { name: 'Miami', state: 'FL', shortName: 'Miami' },
  { name: 'Atlanta', state: 'GA', shortName: 'Atlanta' },
  { name: 'Washington', state: 'DC', shortName: 'DC' },
  { name: 'Las Vegas', state: 'NV', shortName: 'Vegas' },
  { name: 'Portland', state: 'OR', shortName: 'Portland' }
];

class Top10Collector {
  constructor() {
    this.stats = {
      total_processed: 0,
      total_collected: 0,
      cities_completed: 0,
      errors: [],
      start_time: new Date()
    };
    
    this.allInspectors = [];
    this.logDir = path.join(__dirname, '../logs/top10-collection');
    fs.ensureDirSync(this.logDir);
  }

  async collectAllCities() {
    console.log('🚀 TOP 10 HOME INSPECTORS COLLECTION - PHASE 1');
    console.log('===============================================');
    console.log(`📍 Target: 20 cities × 10 inspectors = 200 total`);
    console.log(`🎯 Inspector Type: Home Inspectors`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    for (const city of TARGET_CITIES) {
      await this.collectCityInspectors(city);
      
      // Progress report every 5 cities
      if ((this.stats.cities_completed % 5) === 0) {
        await this.reportProgress();
      }
      
      // Rate limiting between cities
      await this.delay(5000);
    }

    await this.finalReport();
  }

  async collectCityInspectors(city) {
    console.log(`\n📍 COLLECTING: ${city.name}, ${city.state}`);
    console.log('─'.repeat(50));
    
    const cityStartTime = Date.now();
    const inspectors = [];
    
    try {
      // Generate search queries
      const queries = this.generateSearchQueries(city);
      
      for (const query of queries) {
        console.log(`  🔍 Searching: "${query}"`);
        
        try {
          const searchResults = await this.searchWithFirecrawl(query);
          const processedResults = await this.processSearchResults(searchResults, city);
          
          // Add unique inspectors
          for (const inspector of processedResults) {
            if (!this.isDuplicate(inspector, inspectors)) {
              inspectors.push(inspector);
            }
          }
          
          console.log(`    ✅ Found ${processedResults.length} inspectors (${inspectors.length} total)`);
          
          // Stop if we have enough
          if (inspectors.length >= 15) break;
          
          // Rate limiting between searches
          await this.delay(2000);
          
        } catch (error) {
          console.log(`    ❌ Search failed: ${error.message}`);
          this.stats.errors.push({ city: city.name, query, error: error.message });
        }
      }
      
      // Sort by quality and take top 10
      const top10 = this.selectTop10(inspectors);
      
      // Save to database
      await this.saveInspectors(top10, city);
      
      const duration = ((Date.now() - cityStartTime) / 1000).toFixed(1);
      console.log(`  ✅ Completed ${city.name}: ${top10.length} inspectors saved (${duration}s)`);
      
      this.stats.cities_completed++;
      this.allInspectors.push(...top10);
      
    } catch (error) {
      console.log(`  ❌ City collection failed: ${error.message}`);
      this.stats.errors.push({ city: city.name, error: error.message });
    }
  }

  generateSearchQueries(city) {
    return [
      `home inspectors ${city.name} ${city.state}`,
      `"home inspection" ${city.name} ${city.state}`,
      `property inspectors ${city.name} ${city.state}`,
      `certified home inspector ${city.name}`,
      `residential property inspection ${city.shortName}`,
      `best home inspectors ${city.name}`,
      `ASHI certified inspectors ${city.name} ${city.state}`,
      `InterNACHI inspectors ${city.name}`
    ];
  }

  async searchWithFirecrawl(query) {
    try {
      const results = await firecrawl.search({
        query: query,
        limit: 10,
        scrapeOptions: {
          formats: ['markdown', 'html'],
          includeTags: ['title', 'meta', 'h1', 'h2', 'p', 'a', 'div'],
          excludeTags: ['script', 'style', 'nav', 'footer'],
          waitFor: 2000,
          timeout: 15000
        }
      });
      
      return results.data || [];
    } catch (error) {
      console.error(`Firecrawl search error: ${error.message}`);
      return [];
    }
  }

  async processSearchResults(results, city) {
    const processed = [];
    
    for (const result of results) {
      try {
        // Skip non-inspector results
        if (!this.isValidInspectorResult(result)) continue;
        
        // Extract business data
        const inspector = await this.extractInspectorData(result, city);
        
        if (inspector && this.validateInspector(inspector)) {
          processed.push(inspector);
        }
      } catch (error) {
        console.log(`      ⚠️  Failed to process result: ${error.message}`);
      }
    }
    
    return processed;
  }

  isValidInspectorResult(result) {
    const url = (result.url || '').toLowerCase();
    const title = (result.title || '').toLowerCase();
    const content = (result.markdown || result.content || '').toLowerCase();
    
    // Exclude non-inspector sites
    const excludePatterns = [
      'zillow.com', 'realtor.com', 'redfin.com',
      'angie.com', 'thumbtack.com', 'homeadvisor.com',
      'yelp.com/search', 'google.com/search',
      'facebook.com', 'instagram.com', 'linkedin.com',
      'wikipedia.org', 'youtube.com'
    ];
    
    if (excludePatterns.some(pattern => url.includes(pattern))) {
      return false;
    }
    
    // Must have inspector-related keywords
    const keywords = ['inspect', 'home', 'property', 'residential'];
    return keywords.some(keyword => 
      title.includes(keyword) || content.includes(keyword)
    );
  }

  async extractInspectorData(result, city) {
    const content = result.markdown || result.content || '';
    const url = result.url || '';
    
    // Extract business name
    let businessName = this.extractBusinessName(result.title, url);
    if (!businessName) return null;
    
    // Extract contact information
    const phone = this.extractPhone(content);
    const email = this.extractEmail(content);
    const website = this.cleanWebsiteUrl(url);
    
    // Extract address
    const addressData = this.extractAddress(content, city);
    
    // Extract services and certifications
    const services = this.extractServices(content);
    const certifications = this.extractCertifications(content);
    
    // Extract business details
    const yearsInBusiness = this.extractYearsInBusiness(content);
    const description = this.extractDescription(content);
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      businessName, phone, email, website,
      address: addressData.street,
      services, certifications, description
    });
    
    return {
      business_name: businessName,
      owner_name: null,
      email: email,
      phone: phone,
      website: website,
      address_street: addressData.street,
      city: city.name,
      state: city.state,
      address_zip: addressData.zip,
      services: services,
      certifications: certifications,
      years_in_business: yearsInBusiness,
      insurance_verified: this.hasInsurance(content),
      license_number: this.extractLicense(content),
      inspector_type: 'home',
      enrichment_status: 'pending',
      quality_score: qualityScore,
      description: description,
      collected_at: new Date().toISOString(),
      data_source: 'firecrawl_top10',
      search_engine: 'multi',
      source_url: url
    };
  }

  extractBusinessName(title, url) {
    if (!title) return null;
    
    // Clean up title
    let name = title;
    const suffixes = [
      ' - Home Inspector', ' | Home Inspection', ' - Yelp', ' - Google',
      ' Home Inspection Services', ' - Property Inspector'
    ];
    
    suffixes.forEach(suffix => {
      if (name.includes(suffix)) {
        name = name.replace(suffix, '');
      }
    });
    
    // Clean up common patterns
    name = name.replace(/^(Home Inspector|Property Inspector|Inspector):\s*/i, '');
    name = name.trim();
    
    // If name is too generic, try to extract from URL
    if (name.length < 3 || name.toLowerCase() === 'home' || name.toLowerCase() === 'inspector') {
      const urlMatch = url.match(/\/\/(?:www\.)?([^.]+)\./);
      if (urlMatch) {
        name = urlMatch[1].replace(/-/g, ' ');
        name = name.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    return name;
  }

  extractPhone(content) {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const matches = content.match(phoneRegex);
    
    if (matches && matches.length > 0) {
      // Clean and format the first valid phone number
      let phone = matches[0].replace(/[^\d]/g, '');
      if (phone.length === 10) {
        return `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
      } else if (phone.length === 11 && phone[0] === '1') {
        phone = phone.slice(1);
        return `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
      }
    }
    return null;
  }

  extractEmail(content) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = content.match(emailRegex);
    
    if (matches) {
      // Filter out common non-business emails
      const validEmails = matches.filter(email => {
        const lower = email.toLowerCase();
        return !lower.includes('example.com') && 
               !lower.includes('email.com') &&
               !lower.includes('@test.');
      });
      
      return validEmails[0] || null;
    }
    return null;
  }

  cleanWebsiteUrl(url) {
    if (!url) return null;
    
    // Remove tracking parameters and anchors
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  extractAddress(content, city) {
    let street = null;
    let zip = null;
    
    // Try to find ZIP code first
    const zipRegex = new RegExp(`${city.name}[^\\d]*(\\d{5})`, 'i');
    const zipMatch = content.match(zipRegex);
    if (zipMatch) {
      zip = zipMatch[1];
    }
    
    // Try to find street address
    const addressRegex = /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct|Circle|Cir|Parkway|Pkwy)(?:\s+(?:Suite|Ste|Unit|#)\s*[A-Za-z0-9]+)?)/gi;
    const matches = content.match(addressRegex);
    
    if (matches) {
      // Find address closest to city name mention
      for (const match of matches) {
        const surroundingText = content.substring(
          Math.max(0, content.indexOf(match) - 50),
          Math.min(content.length, content.indexOf(match) + match.length + 50)
        );
        
        if (surroundingText.toLowerCase().includes(city.name.toLowerCase())) {
          street = match.trim();
          break;
        }
      }
      
      // If no address near city name, use first one
      if (!street && matches[0]) {
        street = matches[0].trim();
      }
    }
    
    return { street, zip };
  }

  extractServices(content) {
    const services = [];
    const serviceKeywords = {
      'Home Inspection': ['home inspection', 'residential inspection', 'property inspection'],
      'Pre-Purchase Inspection': ['pre-purchase', 'buyer inspection', 'pre-sale'],
      'New Construction': ['new construction', 'new build', 'builder warranty'],
      'Condo Inspection': ['condo', 'condominium', 'townhome'],
      'Multi-Family': ['multi-family', 'duplex', 'apartment'],
      'Commercial': ['commercial inspection', 'commercial property'],
      'Radon Testing': ['radon test', 'radon inspection', 'radon measurement'],
      'Mold Inspection': ['mold inspection', 'mold testing', 'mold assessment'],
      'Termite Inspection': ['termite', 'pest inspection', 'wdo inspection'],
      'Pool/Spa': ['pool inspection', 'spa inspection', 'pool safety']
    };
    
    const lowerContent = content.toLowerCase();
    
    for (const [service, keywords] of Object.entries(serviceKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        services.push(service);
      }
    }
    
    // Always include basic home inspection if inspector
    if (services.length === 0) {
      services.push('Home Inspection');
    }
    
    return services;
  }

  extractCertifications(content) {
    const certs = [];
    const certPatterns = {
      'ASHI': /\bASHI\b/i,
      'InterNACHI': /\b(?:InterNACHI|NACHI)\b/i,
      'CREIA': /\bCREIA\b/i,
      'NAHI': /\bNAHI\b/i,
      'ICC': /\bICC\b/i,
      'TREC': /\bTREC\b/i,
      'Licensed': /\b(?:licensed|license #|lic\.?)\b/i,
      'Certified': /\b(?:certified|certification)\b/i,
      'Insured': /\b(?:insured|insurance)\b/i
    };
    
    for (const [cert, pattern] of Object.entries(certPatterns)) {
      if (pattern.test(content)) {
        certs.push(cert);
      }
    }
    
    return [...new Set(certs)]; // Remove duplicates
  }

  extractYearsInBusiness(content) {
    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|business|serving)/i,
      /(?:established|founded|since)\s*(?:in\s*)?(\d{4})/i,
      /(?:over|more than)\s*(\d+)\s*years?/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        if (match[1].length === 4) {
          // It's a year, calculate years in business
          return new Date().getFullYear() - parseInt(match[1]);
        } else {
          return parseInt(match[1]);
        }
      }
    }
    
    return null;
  }

  extractDescription(content) {
    // Get first meaningful paragraph
    const sentences = content.split(/[.!?]/).filter(s => s.length > 50 && s.length < 300);
    
    for (const sentence of sentences) {
      // Skip navigation, menu items, etc
      if (sentence.includes('Home') && 
          !sentence.includes('Menu') && 
          !sentence.includes('Click') &&
          !sentence.includes('Copyright')) {
        return sentence.trim() + '.';
      }
    }
    
    return null;
  }

  hasInsurance(content) {
    const insuranceKeywords = [
      'fully insured', 'insured and bonded', 'liability insurance',
      'professional liability', 'errors and omissions', 'e&o insurance'
    ];
    
    const lowerContent = content.toLowerCase();
    return insuranceKeywords.some(keyword => lowerContent.includes(keyword));
  }

  extractLicense(content) {
    // Look for license numbers
    const patterns = [
      /license\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /lic\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /(?:TREC|State)\s*#?\s*:?\s*([A-Z0-9-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1].length > 3) {
        return match[1];
      }
    }
    
    return null;
  }

  calculateQualityScore(data) {
    let score = 0;
    
    // Basic data completeness (50 points)
    if (data.businessName) score += 10;
    if (data.phone) score += 10;
    if (data.email) score += 10;
    if (data.website) score += 10;
    if (data.address) score += 10;
    
    // Service information (20 points)
    if (data.services && data.services.length > 0) score += 10;
    if (data.services && data.services.length > 3) score += 10;
    
    // Credentials (20 points)
    if (data.certifications && data.certifications.length > 0) score += 10;
    if (data.certifications && data.certifications.length > 2) score += 10;
    
    // Additional info (10 points)
    if (data.description) score += 5;
    if (data.yearsInBusiness) score += 5;
    
    return score;
  }

  isDuplicate(inspector, existingList) {
    return existingList.some(existing => {
      // Check by name similarity
      if (existing.business_name === inspector.business_name) return true;
      
      // Check by phone if available
      if (existing.phone && inspector.phone && existing.phone === inspector.phone) return true;
      
      // Check by email if available
      if (existing.email && inspector.email && existing.email === inspector.email) return true;
      
      // Check by website domain
      if (existing.website && inspector.website) {
        try {
          const domain1 = new URL(existing.website).hostname;
          const domain2 = new URL(inspector.website).hostname;
          if (domain1 === domain2) return true;
        } catch {}
      }
      
      return false;
    });
  }

  selectTop10(inspectors) {
    // Sort by quality score descending
    inspectors.sort((a, b) => b.quality_score - a.quality_score);
    
    // Take top 10
    return inspectors.slice(0, 10);
  }

  async saveInspectors(inspectors, city) {
    const saved = [];
    
    for (const inspector of inspectors) {
      try {
        // Check for existing inspector
        const { data: existing } = await supabase
          .from('inspectors')
          .select('id')
          .eq('business_name', inspector.business_name)
          .eq('city', inspector.city)
          .single();
        
        if (!existing) {
          const { data, error } = await supabase
            .from('inspectors')
            .insert([inspector])
            .select();
          
          if (error) {
            console.log(`    ⚠️  Failed to save ${inspector.business_name}: ${error.message}`);
          } else {
            saved.push(data[0]);
            this.stats.total_collected++;
          }
        }
        
        this.stats.total_processed++;
        
      } catch (error) {
        console.log(`    ⚠️  Database error for ${inspector.business_name}: ${error.message}`);
      }
    }
    
    return saved;
  }

  async reportProgress() {
    console.log('\n📊 PROGRESS REPORT');
    console.log('==================');
    console.log(`Cities Completed: ${this.stats.cities_completed}/20`);
    console.log(`Total Collected: ${this.stats.total_collected}`);
    console.log(`Average per City: ${(this.stats.total_collected / this.stats.cities_completed).toFixed(1)}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    const elapsed = (Date.now() - this.stats.start_time.getTime()) / 1000 / 60;
    console.log(`Time Elapsed: ${elapsed.toFixed(1)} minutes`);
    console.log(`Est. Remaining: ${((elapsed / this.stats.cities_completed) * (20 - this.stats.cities_completed)).toFixed(1)} minutes\n`);
  }

  async finalReport() {
    const duration = (Date.now() - this.stats.start_time.getTime()) / 1000 / 60;
    
    console.log('\n🎉 COLLECTION COMPLETE!');
    console.log('=======================');
    console.log(`✅ Cities Completed: ${this.stats.cities_completed}/20`);
    console.log(`📊 Total Inspectors Collected: ${this.stats.total_collected}`);
    console.log(`📈 Average per City: ${(this.stats.total_collected / this.stats.cities_completed).toFixed(1)}`);
    console.log(`⏱️  Total Duration: ${duration.toFixed(1)} minutes`);
    console.log(`❌ Total Errors: ${this.stats.errors.length}`);
    
    // Save detailed report
    const reportPath = path.join(this.logDir, `collection-report-${Date.now()}.json`);
    await fs.writeJson(reportPath, {
      stats: this.stats,
      inspectors: this.allInspectors,
      errors: this.stats.errors
    }, { spaces: 2 });
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Database summary
    const { count } = await supabase
      .from('inspectors')
      .select('*', { count: 'exact', head: true })
      .eq('inspector_type', 'home');
    
    console.log(`\n💾 Database Status:`);
    console.log(`   Total Home Inspectors: ${count}`);
    console.log(`   Ready for Enrichment: ${this.stats.total_collected} new inspectors`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute collection
if (require.main === module) {
  const collector = new Top10Collector();
  
  collector.collectAllCities()
    .then(() => {
      console.log('\n✅ Top 10 collection completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Collection failed:', error);
      process.exit(1);
    });
}

module.exports = Top10Collector;