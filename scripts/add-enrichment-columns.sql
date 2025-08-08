-- Add enrichment tracking columns to inspectors table
-- These columns are required for the enhanced enrichment process

ALTER TABLE inspectors 
ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enrichment_data JSONB,
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS city VARCHAR(100), -- alias for address_city for consistency
ADD COLUMN IF NOT EXISTS state VARCHAR(2); -- alias for address_state for consistency

-- Update city and state columns from existing address columns
UPDATE inspectors 
SET city = address_city, 
    state = address_state 
WHERE city IS NULL OR state IS NULL;

-- Create indexes for enrichment queries
CREATE INDEX IF NOT EXISTS idx_inspectors_enrichment_status ON inspectors(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_inspectors_quality_score ON inspectors(quality_score);
CREATE INDEX IF NOT EXISTS idx_inspectors_city_state ON inspectors(city, state);
CREATE INDEX IF NOT EXISTS idx_inspectors_enriched_at ON inspectors(enriched_at);

-- Add comments
COMMENT ON COLUMN inspectors.enrichment_status IS 'Status of data enrichment: pending, in_progress, completed, failed';
COMMENT ON COLUMN inspectors.enrichment_data IS 'JSON object containing enriched business data';
COMMENT ON COLUMN inspectors.quality_score IS 'Quality score 0-100 based on data completeness and accuracy';
COMMENT ON COLUMN inspectors.enriched_at IS 'Timestamp when enrichment was last completed';