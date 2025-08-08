// Dynamic sitemap API endpoint for InspectorsNearMe.com
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inspectorsnearme.com';

// Static pages
const STATIC_PAGES = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/about', priority: 0.9, changefreq: 'weekly' },
  { url: '/contact', priority: 0.9, changefreq: 'weekly' },
  { url: '/inspectors', priority: 0.9, changefreq: 'weekly' },
  { url: '/services', priority: 0.9, changefreq: 'weekly' },
  { url: '/pricing', priority: 0.9, changefreq: 'weekly' },
  { url: '/blog', priority: 0.9, changefreq: 'weekly' }
];

function generateUrlEntry(url, lastmod = null, changefreq = 'monthly', priority = 0.5) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const lastmodDate = lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function getCityPages() {
  try {
    const { data: cityPages, error } = await supabase
      .from('seo_pages')
      .select('slug, updated_at')
      .eq('page_type', 'city')
      .eq('status', 'published')
      .order('slug');
    
    if (error) throw error;
    
    return cityPages.map(page => ({
      url: `/${page.slug}`,
      lastmod: page.updated_at,
      changefreq: 'weekly',
      priority: 0.8
    }));
  } catch (error) {
    console.error('Error fetching city pages:', error);
    return [];
  }
}

async function getInspectorPages() {
  try {
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('id, updated_at')
      .order('id');
    
    if (error) throw error;
    
    return inspectors.map(inspector => ({
      url: `/inspector/${inspector.id}`,
      lastmod: inspector.updated_at,
      changefreq: 'monthly',
      priority: 0.6
    }));
  } catch (error) {
    console.error('Error fetching inspector pages:', error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    // Set proper headers for XML sitemap
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache for 24 hours
    
    // Collect all pages
    const staticPages = STATIC_PAGES;
    const cityPages = await getCityPages();
    const inspectorPages = await getInspectorPages();
    
    // Service pages (static list)
    const servicePages = [
      'general-home-inspection',
      'pre-purchase-inspection',
      'pre-listing-inspection',
      'new-construction-inspection',
      'termite-inspection',
      'radon-testing',
      'mold-inspection'
    ].map(service => ({
      url: `/services/${service}`,
      lastmod: null,
      changefreq: 'monthly',
      priority: 0.5
    }));
    
    const allPages = [
      ...staticPages,
      ...cityPages,
      ...inspectorPages,
      ...servicePages
    ];
    
    // Generate XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add each URL entry
    for (const page of allPages) {
      sitemap += generateUrlEntry(
        page.url,
        page.lastmod,
        page.changefreq,
        page.priority
      ) + '\n';
    }
    
    sitemap += '</urlset>';
    
    res.status(200).send(sitemap);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}