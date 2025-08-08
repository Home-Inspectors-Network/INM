-- Modern Directory Features Database Schema Update
-- Adds comprehensive business information and multi-city service areas

-- Add comprehensive modern directory columns to inspectors table
ALTER TABLE inspectors 

-- Multi-City Service Areas
ADD COLUMN service_cities JSONB DEFAULT '[]',
ADD COLUMN is_multi_city_assignment BOOLEAN DEFAULT false,
ADD COLUMN original_inspector_id INTEGER REFERENCES inspectors(id),
ADD COLUMN service_radius_miles INTEGER,
ADD COLUMN travel_fees JSONB,

-- Business Hours & Availability
ADD COLUMN business_hours JSONB,
ADD COLUMN emergency_hours JSONB,
ADD COLUMN response_time_hours INTEGER,
ADD COLUMN same_day_available BOOLEAN DEFAULT false,
ADD COLUMN weekend_available BOOLEAN DEFAULT false,

-- Contact Methods & Communication
ADD COLUMN contact_methods JSONB,
ADD COLUMN preferred_contact_method VARCHAR(50),
ADD COLUMN live_chat_available BOOLEAN DEFAULT false,
ADD COLUMN text_messaging_available BOOLEAN DEFAULT false,
ADD COLUMN languages_spoken JSONB DEFAULT '["English"]',

-- Social Media & Online Presence  
ADD COLUMN social_media JSONB,
ADD COLUMN google_business_url VARCHAR(500),
ADD COLUMN yelp_url VARCHAR(500),
ADD COLUMN bbb_url VARCHAR(500),

-- Professional Credentials (Enhanced)
ADD COLUMN license_details JSONB,
ADD COLUMN certification_details JSONB,
ADD COLUMN insurance_details JSONB,
ADD COLUMN professional_associations JSONB,
ADD COLUMN continuing_education JSONB,

-- Awards & Recognition
ADD COLUMN awards JSONB,
ADD COLUMN media_mentions JSONB,
ADD COLUMN bbb_rating VARCHAR(10),
ADD COLUMN customer_choice_award BOOLEAN DEFAULT false,

-- Service Information (Enhanced)
ADD COLUMN service_packages JSONB,
ADD COLUMN specialty_services JSONB,
ADD COLUMN service_guarantees JSONB,
ADD COLUMN warranty_information JSONB,
ADD COLUMN pricing_details JSONB,

-- Technology Features
ADD COLUMN online_booking_url VARCHAR(500),
ADD COLUMN digital_reports BOOLEAN DEFAULT false,
ADD COLUMN mobile_app_available BOOLEAN DEFAULT false,
ADD COLUMN virtual_consultations BOOLEAN DEFAULT false,
ADD COLUMN report_delivery_methods JSONB,

-- Team & Company Information
ADD COLUMN company_background JSONB,
ADD COLUMN team_information JSONB,
ADD COLUMN owner_biography TEXT,
ADD COLUMN company_mission TEXT,
ADD COLUMN community_involvement JSONB,

-- Equipment & Methods
ADD COLUMN equipment_list JSONB,
ADD COLUMN inspection_methods JSONB,
ADD COLUMN testing_capabilities JSONB,
ADD COLUMN safety_protocols JSONB,

-- Customer Experience
ADD COLUMN customer_portal_url VARCHAR(500),
ADD COLUMN support_hours JSONB,
ADD COLUMN issue_resolution_process TEXT,
ADD COLUMN loyalty_program JSONB,
ADD COLUMN referral_program JSONB,

-- Content & Education
ADD COLUMN recent_blog_posts JSONB,
ADD COLUMN educational_content JSONB,
ADD COLUMN faq_sections JSONB,
ADD COLUMN video_content JSONB,

-- Visual Content
ADD COLUMN photo_galleries JSONB,
ADD COLUMN before_after_photos JSONB,
ADD COLUMN team_photos JSONB,
ADD COLUMN facility_photos JSONB,

-- Reviews & Testimonials (Enhanced)
ADD COLUMN review_response_rate DECIMAL(5,2),
ADD COLUMN testimonials JSONB,
ADD COLUMN video_testimonials JSONB,
ADD COLUMN case_studies JSONB,

-- Payment & Pricing
ADD COLUMN payment_methods JSONB,
ADD COLUMN financing_available BOOLEAN DEFAULT false,
ADD COLUMN pricing_transparency JSONB,
ADD COLUMN package_deals JSONB,

-- Scheduling & Availability
ADD COLUMN scheduling_system JSONB,
ADD COLUMN advance_booking_days INTEGER,
ADD COLUMN seasonal_considerations JSONB,
ADD COLUMN holiday_schedule JSONB,

-- Partnership & Network
ADD COLUMN contractor_partnerships JSONB,
ADD COLUMN realtor_partnerships JSONB,
ADD COLUMN professional_network JSONB,
ADD COLUMN vendor_relationships JSONB,

-- Enhanced Tracking
ADD COLUMN last_content_update TIMESTAMP,
ADD COLUMN last_social_media_update TIMESTAMP,
ADD COLUMN data_completeness_score INTEGER DEFAULT 0,
ADD COLUMN modern_features_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_inspectors_service_cities ON inspectors USING GIN (service_cities);
CREATE INDEX idx_inspectors_multi_city ON inspectors (is_multi_city_assignment);
CREATE INDEX idx_inspectors_original_id ON inspectors (original_inspector_id);
CREATE INDEX idx_inspectors_social_media ON inspectors USING GIN (social_media);
CREATE INDEX idx_inspectors_contact_methods ON inspectors USING GIN (contact_methods);
CREATE INDEX idx_inspectors_business_hours ON inspectors USING GIN (business_hours);
CREATE INDEX idx_inspectors_completeness ON inspectors (data_completeness_score);

-- Create separate table for detailed business content
CREATE TABLE inspector_content (
    id SERIAL PRIMARY KEY,
    inspector_id INTEGER REFERENCES inspectors(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'blog_post', 'faq', 'case_study', etc.
    title VARCHAR(500),
    content TEXT,
    url VARCHAR(500),
    published_date TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB
);

CREATE INDEX idx_content_inspector_id ON inspector_content (inspector_id);
CREATE INDEX idx_content_type ON inspector_content (content_type);
CREATE INDEX idx_content_published ON inspector_content (published_date);

-- Create table for service area assignments (normalized approach)
CREATE TABLE inspector_service_areas (
    id SERIAL PRIMARY KEY,
    inspector_id INTEGER REFERENCES inspectors(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    county VARCHAR(100),
    is_primary_location BOOLEAN DEFAULT false,
    travel_fee DECIMAL(8,2),
    service_radius_miles INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_areas_inspector ON inspector_service_areas (inspector_id);
CREATE INDEX idx_service_areas_location ON inspector_service_areas (city, state);
CREATE INDEX idx_service_areas_primary ON inspector_service_areas (is_primary_location);

-- Create table for social media tracking
CREATE TABLE inspector_social_media (
    id SERIAL PRIMARY KEY,
    inspector_id INTEGER REFERENCES inspectors(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'linkedin', 'instagram', etc.
    url VARCHAR(500) NOT NULL,
    username VARCHAR(100),
    follower_count INTEGER,
    last_post_date TIMESTAMP,
    engagement_rate DECIMAL(5,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_inspector_id ON inspector_social_media (inspector_id);
CREATE INDEX idx_social_platform ON inspector_social_media (platform);

-- Create table for tracking enrichment progress
CREATE TABLE enrichment_progress (
    id SERIAL PRIMARY KEY,
    inspector_id INTEGER REFERENCES inspectors(id) ON DELETE CASCADE,
    feature_category VARCHAR(100) NOT NULL, -- 'social_media', 'business_hours', etc.
    feature_name VARCHAR(100) NOT NULL,
    extraction_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extraction_successful BOOLEAN DEFAULT false,
    data_found BOOLEAN DEFAULT false,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_enrichment_inspector ON enrichment_progress (inspector_id);
CREATE INDEX idx_enrichment_category ON enrichment_progress (feature_category);
CREATE INDEX idx_enrichment_success ON enrichment_progress (extraction_successful);

-- Create function to calculate data completeness score
CREATE OR REPLACE FUNCTION calculate_completeness_score(inspector_row inspectors)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Basic information (20 points max)
    IF inspector_row.business_name IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.phone IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.email IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.website IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.address IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.logo_url IS NOT NULL THEN score := score + 5; END IF;
    IF inspector_row.company_description IS NOT NULL THEN score := score + 2; END IF;
    
    -- Services (15 points max)
    IF inspector_row.services IS NOT NULL AND jsonb_array_length(inspector_row.services) > 0 THEN score := score + 3; END IF;
    IF inspector_row.detailed_services IS NOT NULL AND jsonb_array_length(inspector_row.detailed_services) > 0 THEN score := score + 5; END IF;
    IF inspector_row.service_packages IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.specialty_services IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.pricing_details IS NOT NULL THEN score := score + 2; END IF;
    
    -- Professional credentials (15 points max)
    IF inspector_row.certifications IS NOT NULL AND jsonb_array_length(inspector_row.certifications) > 0 THEN score := score + 5; END IF;
    IF inspector_row.license_details IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.insurance_details IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.professional_associations IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.years_in_business IS NOT NULL THEN score := score + 2; END IF;
    
    -- Contact & availability (15 points max)
    IF inspector_row.business_hours IS NOT NULL THEN score := score + 4; END IF;
    IF inspector_row.contact_methods IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.service_cities IS NOT NULL AND jsonb_array_length(inspector_row.service_cities) > 1 THEN score := score + 3; END IF;
    IF inspector_row.response_time_hours IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.emergency_hours IS NOT NULL THEN score := score + 3; END IF;
    
    -- Online presence (10 points max)
    IF inspector_row.social_media IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.recent_blog_posts IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.google_business_url IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.online_booking_url IS NOT NULL THEN score := score + 3; END IF;
    
    -- Visual content (10 points max)
    IF inspector_row.photo_galleries IS NOT NULL AND jsonb_array_length(inspector_row.photo_galleries) > 0 THEN score := score + 4; END IF;
    IF inspector_row.team_photos IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.before_after_photos IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.video_content IS NOT NULL THEN score := score + 2; END IF;
    
    -- Technology features (10 points max)
    IF inspector_row.digital_reports = true THEN score := score + 2; END IF;
    IF inspector_row.online_booking_url IS NOT NULL THEN score := score + 3; END IF;
    IF inspector_row.mobile_app_available = true THEN score := score + 2; END IF;
    IF inspector_row.virtual_consultations = true THEN score := score + 2; END IF;
    IF inspector_row.live_chat_available = true THEN score := score + 1; END IF;
    
    -- Reviews & testimonials (5 points max)
    IF inspector_row.review_count > 0 THEN score := score + 2; END IF;
    IF inspector_row.testimonials IS NOT NULL THEN score := score + 2; END IF;
    IF inspector_row.review_response_rate > 0 THEN score := score + 1; END IF;
    
    RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update completeness score
CREATE OR REPLACE FUNCTION update_completeness_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_completeness_score := calculate_completeness_score(NEW);
    NEW.modern_features_count := (
        CASE WHEN NEW.social_media IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.business_hours IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.online_booking_url IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.digital_reports = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.recent_blog_posts IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.live_chat_available = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.virtual_consultations = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.mobile_app_available = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.photo_galleries IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN NEW.team_information IS NOT NULL THEN 1 ELSE 0 END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_completeness
    BEFORE INSERT OR UPDATE ON inspectors
    FOR EACH ROW
    EXECUTE FUNCTION update_completeness_score();

-- Add comments for documentation
COMMENT ON COLUMN inspectors.service_cities IS 'JSON array of all cities this inspector services';
COMMENT ON COLUMN inspectors.is_multi_city_assignment IS 'True if this is a duplicate entry for multi-city coverage';
COMMENT ON COLUMN inspectors.data_completeness_score IS 'Automatically calculated score 0-100 based on data completeness';
COMMENT ON COLUMN inspectors.modern_features_count IS 'Count of modern directory features implemented';

COMMENT ON TABLE inspector_content IS 'Stores blog posts, FAQs, case studies, and other content';
COMMENT ON TABLE inspector_service_areas IS 'Normalized table for multi-city service area assignments';
COMMENT ON TABLE inspector_social_media IS 'Tracks social media presence and engagement';
COMMENT ON TABLE enrichment_progress IS 'Tracks which enrichment features have been attempted/completed';