import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch SEO page by slug
    const { data: page, error } = await supabase
      .from('seo_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Return the page data
    res.status(200).json({
      page,
      meta: {
        title: page.title,
        description: page.meta_description,
        keywords: page.target_keywords,
        canonical: page.canonical_url,
        schema: page.schema_markup
      }
    });

  } catch (error) {
    console.error('Error fetching SEO page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}