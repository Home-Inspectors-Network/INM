const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSEOPages() {
  console.log('🔍 Checking SEO Pages in Database...\n');
  
  try {
    // Check total count
    const { count } = await supabase
      .from('seo_pages')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total SEO pages in database: ${count || 0}`);
    
    // Get Bay Area pages
    const { data: bayAreaPages, error } = await supabase
      .from('seo_pages')
      .select('slug, title, city, state, created_at')
      .ilike('slug', '%-ca-home-inspectors')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching SEO pages:', error);
      return;
    }
    
    if (bayAreaPages && bayAreaPages.length > 0) {
      console.log('\n📍 Bay Area SEO Pages Found:');
      console.log('=' + '='.repeat(79));
      
      bayAreaPages.forEach(page => {
        console.log(`\n🏙️  ${page.title}`);
        console.log(`   Slug: ${page.slug}`);
        console.log(`   Location: ${page.city}, ${page.state}`);
        console.log(`   State: ${page.state}`);
        console.log(`   Created: ${new Date(page.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('\n❌ No Bay Area SEO pages found in database!');
      console.log('   The SEO generation script may not have successfully saved to database.');
    }
    
    // Check for specific city example
    console.log('\n🔍 Checking specific city (San Francisco):');
    const { data: sfPage } = await supabase
      .from('seo_pages')
      .select('*')
      .eq('slug', 'san-francisco-ca-home-inspectors')
      .single();
    
    if (sfPage) {
      console.log('✅ San Francisco page exists');
      console.log(`   URL: /${sfPage.slug}`);
      console.log(`   Keywords: ${sfPage.target_keywords?.join(', ') || 'None set'}`);
    } else {
      console.log('❌ San Francisco page NOT found');
    }
    
  } catch (error) {
    console.error('Error checking SEO pages:', error);
  }
}

checkSEOPages();