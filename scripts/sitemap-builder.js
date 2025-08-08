require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inspectorsnearme.com';
const SITEMAP_DIR = path.join(__dirname, '..', 'public');
const LOG_DIR = path.join(__dirname, '..', 'logs');

// Logging
const logFile = path.join(LOG_DIR, 'sitemap-generation.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// URL priority mapping
const URL_PRIORITIES = {
  homepage: 1.0,
  main_pages: 0.9,
  city_pages: 0.8,
  state_pages: 0.7,
  inspector_profiles: 0.6,
  service_pages: 0.5,
  blog_posts: 0.4
};

// Change frequency mapping
const CHANGE_FREQUENCIES = {
  homepage: 'daily',
  main_pages: 'weekly',
  city_pages: 'weekly',
  state_pages: 'monthly',
  inspector_profiles: 'monthly',
  service_pages: 'monthly',
  blog_posts: 'weekly'
};

// Static pages configuration
const STATIC_PAGES = [
  {
    url: '/',
    priority: URL_PRIORITIES.homepage,
    changefreq: CHANGE_FREQUENCIES.homepage,
    type: 'homepage'
  },
  {
    url: '/about',
    priority: URL_PRIORITIES.main_pages,
    changefreq: CHANGE_FREQUENCIES.main_pages,
    type: 'main_pages'
  },
  {
    url: '/contact',
    priority: URL_PRIORITIES.main_pages,
    changefreq: CHANGE_FREQUENCIES.main_pages,
    type: 'main_pages'
  },
  {
    url: '/inspectors',
    priority: URL_PRIORITIES.main_pages,
    changefreq: CHANGE_FREQUENCIES.main_pages,
    type: 'main_pages'
  },
  {
    url: '/services',
    priority: URL_PRIORITIES.main_pages,
    changefreq: CHANGE_FREQUENCIES.main_pages,
    type: 'main_pages'
  },
  {
    url: '/pricing',
    priority: URL_PRIORITIES.main_pages,
    changefreq: CHANGE_FREQUENCIES.main_pages,
    type: 'main_pages'
  },
  {
    url: '/blog',
    priority: URL_PRIORITIES.main_pages,
    changefreq: CHANGE_FREQUENCIES.main_pages,
    type: 'main_pages'
  }
];

// Service types for service pages
const SERVICE_TYPES = [
  'general-home-inspection',
  'pre-purchase-inspection',
  'pre-listing-inspection',
  'new-construction-inspection',
  'commercial-inspection',
  'termite-inspection',
  'radon-testing',
  'mold-inspection',
  'sewer-scope-inspection',
  'pool-inspection',
  'roof-inspection',
  'hvac-inspection',
  'electrical-inspection',
  'plumbing-inspection'
];

// Generate XML sitemap entry
function generateUrlEntry(url, lastmod = null, changefreq = 'monthly', priority = 0.5, images = []) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const lastmodDate = lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  let entry = `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>`;

  // Add image entries if provided
  if (images && images.length > 0) {
    images.forEach(image => {
      entry += `
    <image:image>
      <image:loc>${image.url}</image:loc>
      <image:caption>${image.caption || ''}</image:caption>
    </image:image>`;
    });
  }

  entry += `
  </url>`;
  
  return entry;
}

// Get all city pages from database
async function getCityPages() {
  try {
    log('Fetching city pages from seo_pages table...');
    
    const { data: cityPages, error } = await supabase
      .from('seo_pages')
      .select('slug, updated_at, city, state')
      .eq('page_type', 'city')
      .eq('status', 'published')
      .order('city');
    
    if (error) {
      log(`Error fetching city pages: ${error.message}`);
      return [];
    }
    
    log(`Found ${cityPages.length} city pages`);
    return cityPages.map(page => ({
      url: `/${page.slug}`,
      lastmod: page.updated_at,
      changefreq: CHANGE_FREQUENCIES.city_pages,
      priority: URL_PRIORITIES.city_pages,
      type: 'city_pages'
    }));
    
  } catch (error) {
    log(`Error in getCityPages: ${error.message}`);
    return [];
  }
}

// Get all state pages from database
async function getStatePages() {
  try {
    log('Fetching state pages from seo_pages table...');
    
    const { data: statePages, error } = await supabase
      .from('seo_pages')
      .select('slug, updated_at, state')
      .eq('page_type', 'state')
      .eq('status', 'published')
      .order('state');
    
    if (error) {
      log(`Error fetching state pages: ${error.message}`);
      return [];
    }
    
    log(`Found ${statePages.length} state pages`);
    return statePages.map(page => ({
      url: `/${page.slug}`,
      lastmod: page.updated_at,
      changefreq: CHANGE_FREQUENCIES.state_pages,
      priority: URL_PRIORITIES.state_pages,
      type: 'state_pages'
    }));
    
  } catch (error) {
    log(`Error in getStatePages: ${error.message}`);
    return [];
  }
}

// Get all inspector profile pages
async function getInspectorPages() {
  try {
    log('Fetching inspector profiles...');
    
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('id, business_name, updated_at')
      .order('business_name');
    
    if (error) {
      log(`Error fetching inspectors: ${error.message}`);
      return [];
    }
    
    log(`Found ${inspectors.length} inspector profiles`);
    return inspectors.map(inspector => ({
      url: `/inspector/${inspector.id}`,
      lastmod: inspector.updated_at,
      changefreq: CHANGE_FREQUENCIES.inspector_profiles,
      priority: URL_PRIORITIES.inspector_profiles,
      type: 'inspector_profiles'
    }));
    
  } catch (error) {
    log(`Error in getInspectorPages: ${error.message}`);
    return [];
  }
}

// Get all service pages
async function getServicePages() {
  try {
    log('Generating service pages...');
    
    const servicePages = SERVICE_TYPES.map(service => ({
      url: `/services/${service}`,
      lastmod: null,
      changefreq: CHANGE_FREQUENCIES.service_pages,
      priority: URL_PRIORITIES.service_pages,
      type: 'service_pages'
    }));
    
    log(`Generated ${servicePages.length} service pages`);
    return servicePages;
    
  } catch (error) {
    log(`Error in getServicePages: ${error.message}`);
    return [];
  }
}

// Get blog posts (if blog table exists)
async function getBlogPages() {
  try {
    log('Fetching blog posts...');
    
    // Check if blog table exists
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    
    if (error) {
      // Blog table doesn't exist or no access
      log('Blog table not found or no published posts');
      return [];
    }
    
    log(`Found ${blogPosts.length} blog posts`);
    return blogPosts.map(post => ({
      url: `/blog/${post.slug}`,
      lastmod: post.updated_at,
      changefreq: CHANGE_FREQUENCIES.blog_posts,
      priority: URL_PRIORITIES.blog_posts,
      type: 'blog_posts'
    }));
    
  } catch (error) {
    log(`Blog posts not available: ${error.message}`);
    return [];
  }
}

// Generate main sitemap.xml
async function generateMainSitemap() {
  try {
    log('Generating main sitemap...');
    
    // Collect all URLs
    const staticPages = STATIC_PAGES;
    const cityPages = await getCityPages();
    const statePages = await getStatePages();
    const inspectorPages = await getInspectorPages();
    const servicePages = await getServicePages();
    const blogPages = await getBlogPages();
    
    const allPages = [
      ...staticPages,
      ...cityPages,
      ...statePages,
      ...inspectorPages,
      ...servicePages,
      ...blogPages
    ];
    
    log(`Total pages to include: ${allPages.length}`);
    
    // Generate XML
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add each URL entry
    for (const page of allPages) {
      sitemapXml += generateUrlEntry(
        page.url,
        page.lastmod,
        page.changefreq,
        page.priority,
        page.images || []
      ) + '\n';
    }
    
    sitemapXml += '</urlset>';
    
    // Write sitemap
    const sitemapPath = path.join(SITEMAP_DIR, 'sitemap.xml');
    await fs.writeFile(sitemapPath, sitemapXml);
    
    log(`Main sitemap generated: ${sitemapPath}`);
    log(`Total URLs: ${allPages.length}`);
    
    // Generate statistics
    const stats = {
      total: allPages.length,
      byType: {}
    };
    
    allPages.forEach(page => {
      const type = page.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    
    return { path: sitemapPath, stats, pages: allPages };
    
  } catch (error) {
    log(`Error generating main sitemap: ${error.message}`);
    throw error;
  }
}

// Generate sitemap index for large sites
async function generateSitemapIndex(sitemaps) {
  try {
    log('Generating sitemap index...');
    
    let indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    sitemaps.forEach(sitemap => {
      const lastmod = new Date().toISOString().split('T')[0];
      indexXml += `  <sitemap>
    <loc>${SITE_URL}/sitemaps/${sitemap.filename}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
`;
    });
    
    indexXml += '</sitemapindex>';
    
    const indexPath = path.join(SITEMAP_DIR, 'sitemap-index.xml');
    await fs.writeFile(indexPath, indexXml);
    
    log(`Sitemap index generated: ${indexPath}`);
    return indexPath;
    
  } catch (error) {
    log(`Error generating sitemap index: ${error.message}`);
    throw error;
  }
}

// Generate separate sitemaps for large sites (if needed)
async function generateSeparateSitemaps() {
  try {
    log('Checking if separate sitemaps are needed...');
    
    const sitemapDir = path.join(SITEMAP_DIR, 'sitemaps');
    await fs.ensureDir(sitemapDir);
    
    const separateSitemaps = [];
    
    // City pages sitemap
    const cityPages = await getCityPages();
    if (cityPages.length > 0) {
      let cityXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      cityPages.forEach(page => {
        cityXml += generateUrlEntry(page.url, page.lastmod, page.changefreq, page.priority) + '\n';
      });
      cityXml += '</urlset>';
      
      const cityPath = path.join(sitemapDir, 'city-pages.xml');
      await fs.writeFile(cityPath, cityXml);
      
      separateSitemaps.push({
        filename: 'city-pages.xml',
        path: cityPath,
        count: cityPages.length
      });
    }
    
    // Inspector pages sitemap
    const inspectorPages = await getInspectorPages();
    if (inspectorPages.length > 0) {
      let inspectorXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      inspectorPages.forEach(page => {
        inspectorXml += generateUrlEntry(page.url, page.lastmod, page.changefreq, page.priority) + '\n';
      });
      inspectorXml += '</urlset>';
      
      const inspectorPath = path.join(sitemapDir, 'inspectors.xml');
      await fs.writeFile(inspectorPath, inspectorXml);
      
      separateSitemaps.push({
        filename: 'inspectors.xml',
        path: inspectorPath,
        count: inspectorPages.length
      });
    }
    
    log(`Generated ${separateSitemaps.length} separate sitemaps`);
    
    // Generate index if we have separate sitemaps
    if (separateSitemaps.length > 0) {
      await generateSitemapIndex(separateSitemaps);
    }
    
    return separateSitemaps;
    
  } catch (error) {
    log(`Error generating separate sitemaps: ${error.message}`);
    throw error;
  }
}

// Generate robots.txt
async function generateRobotsTxt() {
  try {
    log('Generating robots.txt...');
    
    const robotsContent = `# Robots.txt for InspectorsNearMe.com
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-index.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /logs/
Disallow: /scripts/

# Allow important directories
Allow: /services/
Allow: /inspectors/
Allow: /blog/
Allow: /sitemap.xml

# Block search and filter parameters
Disallow: /*?search=*
Disallow: /*?filter=*
Disallow: /*?page=*

# SEO-friendly URLs are encouraged
# City pages: /{city}-{state}-home-inspectors
# Inspector profiles: /inspector/{id}
# Services: /services/{service-type}
`;

    const robotsPath = path.join(SITEMAP_DIR, 'robots.txt');
    await fs.writeFile(robotsPath, robotsContent);
    
    log(`robots.txt generated: ${robotsPath}`);
    return robotsPath;
    
  } catch (error) {
    log(`Error generating robots.txt: ${error.message}`);
    throw error;
  }
}

// Submit sitemap to Google Search Console (placeholder for API integration)
async function submitToSearchConsole(sitemapUrl) {
  try {
    log('Sitemap submission to Google Search Console...');
    
    // Note: This would require Google Search Console API setup
    // For now, we'll just log the submission URL
    const submitUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    log(`Manual submission URL: ${submitUrl}`);
    log('To enable automatic submission, configure Google Search Console API credentials');
    
    // TODO: Implement actual API submission when credentials are available
    // const response = await fetch(submitUrl, { method: 'GET' });
    // if (response.ok) {
    //   log('Successfully submitted to Google Search Console');
    // }
    
    return { submitUrl, status: 'manual_submission_required' };
    
  } catch (error) {
    log(`Error in search console submission: ${error.message}`);
    return { error: error.message, status: 'failed' };
  }
}

// Generate image sitemap for inspector photos and property images
async function generateImageSitemap() {
  try {
    log('Generating image sitemap...');
    
    // Get inspectors with profile images
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('id, business_name, website')
      .not('website', 'is', null);
    
    if (error) {
      log(`Error fetching inspectors for image sitemap: ${error.message}`);
      return null;
    }
    
    const imageEntries = [];
    
    // Add default images for each inspector profile
    inspectors.forEach(inspector => {
      imageEntries.push({
        url: `/inspector/${inspector.id}`,
        images: [
          {
            url: `${SITE_URL}/images/inspectors/default-profile.jpg`,
            caption: `${inspector.business_name} - Professional Home Inspector`
          }
        ]
      });
    });
    
    if (imageEntries.length === 0) {
      log('No images found for image sitemap');
      return null;
    }
    
    let imageXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    imageEntries.forEach(entry => {
      imageXml += generateUrlEntry(entry.url, null, 'monthly', 0.6, entry.images) + '\n';
    });
    
    imageXml += '</urlset>';
    
    const imagePath = path.join(SITEMAP_DIR, 'sitemap-images.xml');
    await fs.writeFile(imagePath, imageXml);
    
    log(`Image sitemap generated: ${imagePath} (${imageEntries.length} entries)`);
    return imagePath;
    
  } catch (error) {
    log(`Error generating image sitemap: ${error.message}`);
    return null;
  }
}

// Generate comprehensive sitemap report
async function generateSitemapReport(results) {
  try {
    log('Generating sitemap report...');
    
    const report = {
      generatedAt: new Date().toISOString(),
      siteUrl: SITE_URL,
      sitemaps: {
        main: results.mainSitemap,
        separate: results.separateSitemaps || [],
        images: results.imageSitemap ? { path: results.imageSitemap } : null
      },
      files: {
        robotsTxt: results.robotsTxt
      },
      submission: results.submission || null,
      statistics: results.mainSitemap.stats,
      recommendations: []
    };
    
    // Add recommendations based on statistics
    if (report.statistics.total > 10000) {
      report.recommendations.push('Consider implementing separate sitemaps by content type');
    }
    
    if (report.statistics.byType.inspector_profiles > 1000) {
      report.recommendations.push('Large number of inspector profiles - consider pagination');
    }
    
    if (!report.sitemaps.images) {
      report.recommendations.push('Consider adding image sitemap for better image SEO');
    }
    
    // Save report
    const reportPath = path.join(LOG_DIR, 'sitemap-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    log(`Sitemap report saved: ${reportPath}`);
    return report;
    
  } catch (error) {
    log(`Error generating sitemap report: ${error.message}`);
    throw error;
  }
}

// Main sitemap generation function
async function generateSitemaps() {
  try {
    // Ensure directories exist
    await fs.ensureDir(SITEMAP_DIR);
    await fs.ensureDir(LOG_DIR);
    
    log('Starting comprehensive sitemap generation...');
    log(`Site URL: ${SITE_URL}`);
    
    const results = {};
    
    // Generate main sitemap
    results.mainSitemap = await generateMainSitemap();
    
    // Generate separate sitemaps if needed (for large sites)
    results.separateSitemaps = await generateSeparateSitemaps();
    
    // Generate image sitemap
    results.imageSitemap = await generateImageSitemap();
    
    // Generate robots.txt
    results.robotsTxt = await generateRobotsTxt();
    
    // Submit to search console
    const mainSitemapUrl = `${SITE_URL}/sitemap.xml`;
    results.submission = await submitToSearchConsole(mainSitemapUrl);
    
    // Generate report
    const report = await generateSitemapReport(results);
    
    // Summary
    log('\n=== Sitemap Generation Summary ===');
    log(`Main sitemap: ${results.mainSitemap.path}`);
    log(`Total URLs: ${results.mainSitemap.stats.total}`);
    log(`Separate sitemaps: ${results.separateSitemaps.length}`);
    log(`Image sitemap: ${results.imageSitemap ? 'Generated' : 'Skipped'}`);
    log(`robots.txt: ${results.robotsTxt}`);
    log(`Report: ${LOG_DIR}/sitemap-report.json`);
    
    // URL breakdown
    log('\nURL Breakdown:');
    Object.entries(results.mainSitemap.stats.byType).forEach(([type, count]) => {
      log(`  ${type}: ${count} URLs`);
    });
    
    log('\nSitemap generation completed successfully!');
    
    return results;
    
  } catch (error) {
    log(`Fatal error in sitemap generation: ${error.message}`);
    throw error;
  }
}

// Validate sitemap XML structure
async function validateSitemap(sitemapPath) {
  try {
    const xmlContent = await fs.readFile(sitemapPath, 'utf8');
    
    // Basic validation checks
    const checks = {
      hasXmlDeclaration: xmlContent.startsWith('<?xml version="1.0"'),
      hasUrlsetTag: xmlContent.includes('<urlset'),
      hasNamespace: xmlContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),
      hasClosingTag: xmlContent.includes('</urlset>'),
      urlCount: (xmlContent.match(/<url>/g) || []).length
    };
    
    const isValid = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : check > 0
    );
    
    log(`Sitemap validation: ${isValid ? 'PASSED' : 'FAILED'}`);
    log(`URLs found: ${checks.urlCount}`);
    
    return { isValid, checks };
    
  } catch (error) {
    log(`Sitemap validation error: ${error.message}`);
    return { isValid: false, error: error.message };
  }
}

module.exports = {
  generateSitemaps,
  generateMainSitemap,
  generateRobotsTxt,
  generateImageSitemap,
  submitToSearchConsole,
  validateSitemap,
  generateSitemapReport
};

// Run if called directly
if (require.main === module) {
  generateSitemaps().catch(error => {
    console.error('Sitemap generation failed:', error);
    process.exit(1);
  });
}