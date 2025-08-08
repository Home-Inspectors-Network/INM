-- Create seo_pages table for storing SEO-optimized content
-- This should be run in your Supabase SQL editor or database management tool

CREATE TABLE IF NOT EXISTS seo_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('city', 'state', 'service', 'blog')),
  title VARCHAR(255) NOT NULL,
  meta_description TEXT,
  content TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  target_keywords TEXT[], -- Array of target keywords for this page
  schema_markup JSONB, -- Structured data for rich snippets
  canonical_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
  monthly_searches INTEGER DEFAULT 0,
  competition_level VARCHAR(20) DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_city_state ON seo_pages(city, state);
CREATE INDEX IF NOT EXISTS idx_seo_pages_type ON seo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_pages_status ON seo_pages(status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_keywords ON seo_pages USING GIN(target_keywords);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_seo_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_seo_pages_updated_at ON seo_pages;
CREATE TRIGGER trigger_update_seo_pages_updated_at
  BEFORE UPDATE ON seo_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_pages_updated_at();

-- Insert some example data for testing (optional)
-- You can remove this section if you don't want test data

-- Example city page
INSERT INTO seo_pages (
  slug, 
  page_type, 
  title, 
  meta_description, 
  content, 
  city, 
  state, 
  target_keywords,
  canonical_url,
  seo_score,
  monthly_searches,
  competition_level
) VALUES (
  'birmingham-al-home-inspectors',
  'city',
  'Home Inspectors in Birmingham, AL | Licensed Property Inspection Services',
  'Find licensed home inspectors in Birmingham, AL. 15+ certified professionals offering comprehensive property inspections. Get quotes today!',
  '<div>Sample content for Birmingham, AL home inspectors page...</div>',
  'Birmingham',
  'AL',
  ARRAY['birmingham home inspectors', 'property inspection birmingham', 'residential inspectors birmingham al'],
  'https://inspectorsnearme.com/birmingham-al-home-inspectors',
  85,
  1200,
  'medium'
) ON CONFLICT (slug) DO NOTHING;

-- Add comments to document the table structure
COMMENT ON TABLE seo_pages IS 'Stores SEO-optimized landing pages for cities, states, and services';
COMMENT ON COLUMN seo_pages.slug IS 'URL-friendly identifier for the page';
COMMENT ON COLUMN seo_pages.page_type IS 'Type of page: city, state, service, or blog';
COMMENT ON COLUMN seo_pages.target_keywords IS 'Array of SEO keywords this page targets';
COMMENT ON COLUMN seo_pages.schema_markup IS 'JSON-LD structured data for rich snippets';
COMMENT ON COLUMN seo_pages.seo_score IS 'SEO optimization score (0-100)';
COMMENT ON COLUMN seo_pages.monthly_searches IS 'Estimated monthly search volume for primary keyword';
COMMENT ON COLUMN seo_pages.competition_level IS 'SEO competition level: low, medium, or high';