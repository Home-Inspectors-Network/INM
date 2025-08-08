const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class ContactDataBackfill {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.processedCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
  }

  async backfillAllContactData() {
    console.log('🔍 CONTACT DATA BACKFILL STARTING');
    console.log('==================================\n');
    
    // Get all inspectors missing contact data
    const { data: inspectors } = await supabase
      .from('inspectors')
      .select('id, business_name, google_place_id, website, phone, email')
      .not('google_place_id', 'is', null);
    
    console.log(`📊 Found ${inspectors.length} inspectors with Google Place IDs`);
    
    const missingData = inspectors.filter(i => 
      !i.website || !i.phone || !i.email
    );
    
    console.log(`🔧 ${missingData.length} inspectors need contact data backfill\n`);
    
    // Process in batches to respect API limits
    const batchSize = 10;
    for (let i = 0; i < missingData.length; i += batchSize) {
      const batch = missingData.slice(i, i + batchSize);
      await this.processBatch(batch);
      
      // Rate limiting: 50 requests per second limit
      await this.delay(200);
    }
    
    console.log('\n🎉 BACKFILL COMPLETE');
    console.log('====================');
    console.log(`✅ Successfully processed: ${this.successCount}`);
    console.log(`❌ Errors: ${this.errorCount}`);
    console.log(`📊 Total processed: ${this.processedCount}`);
    
    // Final report
    await this.generateReport();
  }

  async processBatch(inspectors) {
    const promises = inspectors.map(inspector => this.backfillInspector(inspector));
    await Promise.all(promises);
  }

  async backfillInspector(inspector) {
    try {
      this.processedCount++;
      console.log(`\n${this.processedCount}. Processing: ${inspector.business_name}`);
      
      const placeDetails = await this.getPlaceDetails(inspector.google_place_id);
      
      if (!placeDetails) {
        console.log('  ❌ No place details found');
        this.errorCount++;
        return;
      }
      
      // Extract contact information
      const contactData = {
        website: placeDetails.website || inspector.website,
        phone: placeDetails.formatted_phone_number || inspector.phone,
        email: this.extractEmail(placeDetails) || inspector.email,
        address: placeDetails.formatted_address || null,
        rating: placeDetails.rating || null,
        review_count: placeDetails.user_ratings_total || 0,
        business_hours: this.extractBusinessHours(placeDetails),
        updated_at: new Date().toISOString()
      };
      
      // Update database
      await supabase
        .from('inspectors')
        .update(contactData)
        .eq('id', inspector.id);
      
      console.log(`  ✅ Updated: ${contactData.website ? 'W' : ''}${contactData.phone ? 'P' : ''}${contactData.email ? 'E' : ''}`);
      this.successCount++;
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      this.errorCount++;
    }
  }

  async getPlaceDetails(placeId) {
    const fields = [
      'name', 'website', 'formatted_phone_number', 'international_phone_number',
      'formatted_address', 'rating', 'user_ratings_total', 'opening_hours',
      'photos', 'reviews', 'url', 'vicinity'
    ].join(',');
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.googleApiKey}`;
    
    const response = await axios.get(url);
    return response.data.result;
  }

  extractEmail(placeDetails) {
    // Look for email in various fields
    const text = JSON.stringify(placeDetails);
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    return emails ? emails[0] : null;
  }

  extractBusinessHours(placeDetails) {
    if (!placeDetails.opening_hours) return {};
    
    const hours = {};
    if (placeDetails.opening_hours.weekday_text) {
      placeDetails.opening_hours.weekday_text.forEach(dayText => {
        const [day, time] = dayText.split(': ');
        hours[day.toLowerCase()] = time || 'Closed';
      });
    }
    return hours;
  }

  async generateReport() {
    const { data: stats } = await supabase
      .from('inspectors')
      .select('*');
    
    const withWebsites = stats.filter(i => i.website).length;
    const withPhones = stats.filter(i => i.phone).length;
    const withEmails = stats.filter(i => i.email).length;
    
    console.log('\n📊 FINAL DATA COVERAGE REPORT');
    console.log('=============================');
    console.log(`📧 Websites: ${withWebsites}/${stats.length} (${((withWebsites/stats.length)*100).toFixed(1)}%)`);
    console.log(`📞 Phones: ${withPhones}/${stats.length} (${((withPhones/stats.length)*100).toFixed(1)}%)`);
    console.log(`📧 Emails: ${withEmails}/${stats.length} (${((withEmails/stats.length)*100).toFixed(1)}%)`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute if called directly
if (require.main === module) {
  const backfill = new ContactDataBackfill();
  backfill.backfillAllContactData().catch(console.error);
}

module.exports = ContactDataBackfill;