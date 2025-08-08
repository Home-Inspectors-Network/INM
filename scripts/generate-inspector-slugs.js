const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class InspectorSlugGenerator {
  constructor() {
    this.processedCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.slugCounts = new Map(); // Track slug usage for uniqueness
  }

  async generateAllSlugs() {
    console.log('🔗 GENERATING SEO-FRIENDLY INSPECTOR SLUGS');
    console.log('==========================================\n');
    
    // First add slug column if it doesn't exist
    await this.addSlugColumn();
    
    // Get all inspectors that need slugs
    const { data: inspectors } = await supabase
      .from('inspectors')
      .select('id, business_name, city, state, slug')
      .or('slug.is.null,slug.eq.""');
    
    console.log(`📊 Found ${inspectors.length} inspectors needing slugs`);
    console.log(`🎯 Target: Create unique SEO-friendly URLs\n`);
    
    // Process all inspectors
    for (const inspector of inspectors) {
      await this.generateSlugForInspector(inspector);
    }
    
    await this.generateReport();
  }

  async addSlugColumn() {
    console.log('🔧 Adding slug column to database...');
    
    try {
      // Add slug column if it doesn't exist
      await supabase.rpc('add_slug_column', {});
    } catch (error) {
      // Try direct SQL approach
      try {
        const { error: sqlError } = await supabase
          .from('inspectors')
          .select('slug')
          .limit(1);
        
        if (sqlError && sqlError.message.includes('column "slug" does not exist')) {
          console.log('Creating slug column via ALTER TABLE...');
          // This will need to be run manually in Supabase SQL editor
          console.log('⚠️  Please run this SQL in Supabase SQL editor:');
          console.log('ALTER TABLE inspectors ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;');
          console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_inspectors_slug ON inspectors(slug);');
          throw new Error('Please add slug column manually via SQL editor');
        }
      } catch (e) {
        console.log('Slug column already exists or needs manual creation');
      }
    }
  }

  async generateSlugForInspector(inspector) {
    try {
      this.processedCount++;
      console.log(`${this.processedCount}. Processing: ${inspector.business_name}`);
      
      const baseSlug = this.createBaseSlug(inspector);
      const uniqueSlug = this.ensureUniqueSlug(baseSlug);
      
      // Update database with slug
      const { error } = await supabase
        .from('inspectors')
        .update({ slug: uniqueSlug })
        .eq('id', inspector.id);
      
      if (error) {
        console.log(`   ❌ Error updating slug: ${error.message}`);
        this.errorCount++;
      } else {
        console.log(`   ✅ Created slug: ${uniqueSlug}`);
        this.successCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Processing error: ${error.message}`);
      this.errorCount++;
    }
  }

  createBaseSlug(inspector) {
    const { business_name, city, state } = inspector;
    
    // Create base slug: business-name-city-state
    let slug = business_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
    
    // Add location for uniqueness
    if (city) {
      const citySlug = city
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      slug = `${slug}-${citySlug}`;
    }
    
    if (state) {
      const stateSlug = state
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      
      slug = `${slug}-${stateSlug}`;
    }
    
    // Ensure reasonable length
    if (slug.length > 100) {
      slug = slug.substring(0, 100).replace(/-[^-]*$/, '');
    }
    
    return slug;
  }

  ensureUniqueSlug(baseSlug) {
    const count = this.slugCounts.get(baseSlug) || 0;
    this.slugCounts.set(baseSlug, count + 1);
    
    return count > 0 ? `${baseSlug}-${count}` : baseSlug;
  }

  async generateReport() {
    // Get updated statistics
    const { data: withSlugs } = await supabase
      .from('inspectors')
      .select('slug')
      .not('slug', 'is', null);
    
    const { data: total } = await supabase
      .from('inspectors')
      .select('id');
    
    console.log('\n🎉 SLUG GENERATION COMPLETE');
    console.log('============================');
    console.log(`✅ Successfully processed: ${this.successCount}`);
    console.log(`❌ Failed: ${this.errorCount}`);
    console.log(`📊 Total processed: ${this.processedCount}\n`);
    
    console.log('📊 FINAL SLUG COVERAGE:');
    console.log('========================');
    console.log(`🔗 With Slugs: ${withSlugs?.length || 0}/${total?.length || 0} (${((withSlugs?.length || 0)/(total?.length || 1)*100).toFixed(1)}%)`);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('===============');
    console.log('1. Update frontend to use SEO URLs: /inspector/{slug}/');
    console.log('2. Add redirects from old /inspectors/{id} URLs');
    console.log('3. Generate location-based URLs for service areas');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute if called directly
if (require.main === module) {
  const generator = new InspectorSlugGenerator();
  generator.generateAllSlugs().catch(console.error);
}

module.exports = InspectorSlugGenerator;