const { createClient } = require('@supabase/supabase-js');
const FirecrawlApp = require('firecrawl-js').default;
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class FirecrawlContactExtraction {
  constructor() {
    this.firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    this.processedCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
  }

  async extractAllContactData() {
    console.log('🔍 FIRECRAWL CONTACT DATA EXTRACTION');
    console.log('====================================\n');
    
    // Get inspectors missing contact data
    const { data: inspectors } = await supabase
      .from('inspectors')
      .select('id, business_name, city, state, website, phone, email')
      .or('website.is.null,phone.is.null,email.is.null');
    
    console.log(`📊 Found ${inspectors.length} inspectors needing contact data`);
    console.log(`🎯 Target: Extract websites, phones, emails for all\n`);
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < inspectors.length; i += batchSize) {
      const batch = inspectors.slice(i, i + batchSize);
      await this.processBatch(batch);
      
      // Rate limiting
      await this.delay(3000);
    }
    
    await this.generateReport();
  }

  async processBatch(inspectors) {
    const promises = inspectors.map(inspector => this.extractContactData(inspector));
    await Promise.all(promises);
  }

  async extractContactData(inspector) {
    try {
      this.processedCount++;
      console.log(`\n${this.processedCount}. Processing: ${inspector.business_name}`);
      
      // Create search queries for this business
      const searchQueries = this.generateSearchQueries(inspector);
      
      let contactData = {};
      let searchSuccess = false;
      
      // Try each search query until we find contact info
      for (const query of searchQueries) {
        console.log(`  🔍 Searching: "${query}"`);
        
        try {
          const searchResults = await this.firecrawl.search({
            query: query,
            limit: 3,
            scrapeOptions: {
              formats: ['markdown']
            }
          });
          
          if (searchResults && searchResults.data && searchResults.data.length > 0) {
            // Extract contact info from search results
            const extracted = this.extractContactFromResults(searchResults.data);
            
            if (this.hasUsefulContact(extracted)) {
              contactData = { ...contactData, ...extracted };
              searchSuccess = true;
              console.log(`    ✅ Found contact data: ${this.summarizeContact(extracted)}`);
              break; // Found good data, stop searching
            }
          }
        } catch (searchError) {
          console.log(`    ⚠️  Search failed: ${searchError.message}`);
        }
        
        await this.delay(1000); // Brief delay between searches
      }
      
      if (searchSuccess && Object.keys(contactData).length > 0) {
        // Update database with found contact information
        await this.updateInspectorContact(inspector.id, contactData);
        this.successCount++;
      } else {
        console.log(`  ❌ No contact data found`);
        this.errorCount++;
      }
      
    } catch (error) {
      console.log(`  ❌ Processing error: ${error.message}`);
      this.errorCount++;
    }
  }

  generateSearchQueries(inspector) {
    const name = inspector.business_name;
    const city = inspector.city || '';
    const state = inspector.state || 'CA';
    
    return [
      `"${name}" ${city} ${state} home inspector contact`,
      `"${name}" ${city} phone website`,
      `"${name}" home inspection ${city} California`,
      `${name} ${city} ${state} inspector contact information`
    ];
  }

  extractContactFromResults(results) {
    let extracted = {};
    
    for (const result of results) {
      const content = result.markdown || result.content || '';
      
      // Extract website
      if (!extracted.website) {
        extracted.website = this.extractWebsite(result.url, content);
      }
      
      // Extract phone
      if (!extracted.phone) {
        extracted.phone = this.extractPhone(content);
      }
      
      // Extract email  
      if (!extracted.email) {
        extracted.email = this.extractEmail(content);
      }
      
      // Extract address
      if (!extracted.address) {
        extracted.address = this.extractAddress(content);
      }
    }
    
    return extracted;
  }

  extractWebsite(url, content) {
    // Use the URL from search result as website
    if (url && url.includes('http') && !url.includes('google.com') && !url.includes('yelp.com')) {
      return url;
    }
    
    // Look for website mentions in content
    const websiteRegex = /(?:website|site|www)[:\s]*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const match = content.match(websiteRegex);
    return match ? match[0].replace(/.*?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}).*/, '$1') : null;
  }

  extractPhone(content) {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const match = content.match(phoneRegex);
    return match ? match[0] : null;
  }

  extractEmail(content) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = content.match(emailRegex);
    return match ? match[0] : null;
  }

  extractAddress(content) {
    // Simple address pattern for CA addresses
    const addressRegex = /\d+\s+[A-Za-z\s,.]+(CA|California)\s+\d{5}/g;
    const match = content.match(addressRegex);
    return match ? match[0] : null;
  }

  hasUsefulContact(extracted) {
    return extracted.website || extracted.phone || extracted.email;
  }

  summarizeContact(extracted) {
    const parts = [];
    if (extracted.website) parts.push('Website');
    if (extracted.phone) parts.push('Phone');
    if (extracted.email) parts.push('Email');
    return parts.join(', ');
  }

  async updateInspectorContact(inspectorId, contactData) {
    const updateData = {
      ...contactData,
      updated_at: new Date().toISOString()
    };
    
    await supabase
      .from('inspectors')
      .update(updateData)
      .eq('id', inspectorId);
  }

  async generateReport() {
    const { data: stats } = await supabase
      .from('inspectors')
      .select('website, phone, email');
    
    const withWebsites = stats.filter(i => i.website).length;
    const withPhones = stats.filter(i => i.phone).length;
    const withEmails = stats.filter(i => i.email).length;
    
    console.log('\n🎉 CONTACT EXTRACTION COMPLETE');
    console.log('==============================');
    console.log(`✅ Successfully processed: ${this.successCount}`);
    console.log(`❌ Failed: ${this.errorCount}`);
    console.log(`📊 Total processed: ${this.processedCount}\n`);
    
    console.log('📊 FINAL DATA COVERAGE:');
    console.log('========================');
    console.log(`🌐 Websites: ${withWebsites}/${stats.length} (${((withWebsites/stats.length)*100).toFixed(1)}%)`);
    console.log(`📞 Phones: ${withPhones}/${stats.length} (${((withPhones/stats.length)*100).toFixed(1)}%)`);
    console.log(`📧 Emails: ${withEmails}/${stats.length} (${((withEmails/stats.length)*100).toFixed(1)}%)`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute if called directly
if (require.main === module) {
  const extraction = new FirecrawlContactExtraction();
  extraction.extractAllContactData().catch(console.error);
}

module.exports = FirecrawlContactExtraction;