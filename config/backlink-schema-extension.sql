-- Backlink Builder Agent Schema Extensions
-- Add to existing schema for comprehensive backlink management

-- Backlink prospects and opportunities
CREATE TABLE backlink_prospects (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    url TEXT,
    domain_authority INTEGER,
    spam_score INTEGER,
    traffic_estimate INTEGER,
    relevance_score DECIMAL(3,2), -- 0-10 scale
    niche VARCHAR(100),
    contact_email VARCHAR(255),
    contact_name VARCHAR(255),
    prospect_type VARCHAR(50), -- 'guest_post', 'directory', 'resource_page', 'broken_link', 'partnership'
    status VARCHAR(50) DEFAULT 'discovered', -- 'discovered', 'qualified', 'contacted', 'responded', 'acquired', 'rejected'
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    notes TEXT,
    discovered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_contacted DATE,
    next_followup DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acquired backlinks tracking
CREATE TABLE backlinks (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES backlink_prospects(id),
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text VARCHAR(255),
    link_type VARCHAR(50), -- 'dofollow', 'nofollow', 'ugc', 'sponsored'
    placement VARCHAR(50), -- 'editorial', 'footer', 'sidebar', 'author_bio', 'resource_list'
    date_acquired DATE,
    date_lost DATE,
    is_active BOOLEAN DEFAULT TRUE,
    last_checked TIMESTAMP,
    response_code INTEGER, -- HTTP status code from last check
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high'
    value_score DECIMAL(3,2), -- 0-10 estimated value
    cost DECIMAL(10,2), -- Cost if paid placement
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outreach campaigns
CREATE TABLE outreach_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50), -- 'guest_post', 'directory_submission', 'broken_link', 'resource_page'
    template_id INTEGER,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    target_count INTEGER DEFAULT 0,
    contacted_count INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email templates for outreach
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50), -- 'initial', 'followup_1', 'followup_2', 'thank_you'
    subject_line VARCHAR(255),
    body_template TEXT,
    variables JSON, -- Template variables like {first_name}, {domain}, etc.
    open_rate DECIMAL(5,2), -- Percentage
    response_rate DECIMAL(5,2), -- Percentage
    success_rate DECIMAL(5,2), -- Percentage
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual outreach attempts
CREATE TABLE outreach_attempts (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES backlink_prospects(id),
    campaign_id INTEGER REFERENCES outreach_campaigns(id),
    template_id INTEGER REFERENCES email_templates(id),
    attempt_type VARCHAR(50), -- 'initial', 'followup_1', 'followup_2'
    sent_date TIMESTAMP,
    opened_date TIMESTAMP,
    responded_date TIMESTAMP,
    response_type VARCHAR(50), -- 'positive', 'negative', 'neutral', 'interested', 'not_interested'
    response_content TEXT,
    personalized_subject VARCHAR(255),
    personalized_body TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'opened', 'responded', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitor analysis
CREATE TABLE competitor_backlinks (
    id SERIAL PRIMARY KEY,
    competitor_domain VARCHAR(255),
    source_domain VARCHAR(255),
    source_url TEXT,
    target_url TEXT,
    anchor_text VARCHAR(255),
    domain_authority INTEGER,
    discovered_date DATE,
    is_opportunity BOOLEAN DEFAULT FALSE, -- Whether we should pursue this link
    opportunity_score DECIMAL(3,2), -- 0-10 scale
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Local business directories and citations
CREATE TABLE local_directories (
    id SERIAL PRIMARY KEY,
    directory_name VARCHAR(255) NOT NULL,
    directory_url TEXT,
    domain_authority INTEGER,
    submission_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'approved', 'rejected', 'expired'
    submission_date DATE,
    approval_date DATE,
    listing_url TEXT,
    cost DECIMAL(10,2),
    renewal_date DATE,
    local_focus VARCHAR(100), -- Geographic focus area
    industry_focus VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content pieces for guest posting and link building
CREATE TABLE link_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50), -- 'guest_post', 'infographic', 'tool', 'resource_page'
    word_count INTEGER,
    target_keywords TEXT[], -- Array of target keywords
    content_body TEXT,
    author_bio TEXT,
    images_urls TEXT[],
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'ready', 'published', 'archived'
    placements_count INTEGER DEFAULT 0,
    total_backlinks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link building metrics and analytics
CREATE TABLE link_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_backlinks INTEGER DEFAULT 0,
    new_backlinks INTEGER DEFAULT 0,
    lost_backlinks INTEGER DEFAULT 0,
    domain_authority_change DECIMAL(5,2),
    organic_traffic_change INTEGER,
    keyword_rankings_improved INTEGER,
    keyword_rankings_declined INTEGER,
    outreach_sent INTEGER DEFAULT 0,
    outreach_responses INTEGER DEFAULT 0,
    outreach_success INTEGER DEFAULT 0,
    cost_total DECIMAL(10,2) DEFAULT 0,
    roi_estimate DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anchor text distribution tracking
CREATE TABLE anchor_text_analysis (
    id SERIAL PRIMARY KEY,
    anchor_text VARCHAR(255) NOT NULL,
    anchor_type VARCHAR(50), -- 'exact_match', 'partial_match', 'branded', 'generic', 'url'
    usage_count INTEGER DEFAULT 1,
    target_keyword VARCHAR(255),
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high' based on over-optimization
    last_used DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anchor_text)
);

-- Create indexes for performance
CREATE INDEX idx_prospects_domain_status ON backlink_prospects(domain, status);
CREATE INDEX idx_prospects_type_priority ON backlink_prospects(prospect_type, priority);
CREATE INDEX idx_backlinks_active_acquired ON backlinks(is_active, date_acquired);
CREATE INDEX idx_backlinks_source_target ON backlinks(source_url, target_url);
CREATE INDEX idx_outreach_campaign_status ON outreach_attempts(campaign_id, status);
CREATE INDEX idx_outreach_prospect_date ON outreach_attempts(prospect_id, sent_date);
CREATE INDEX idx_competitor_domain_opportunity ON competitor_backlinks(competitor_domain, is_opportunity);
CREATE INDEX idx_directories_status_renewal ON local_directories(submission_status, renewal_date);
CREATE INDEX idx_metrics_date ON link_metrics(metric_date);
CREATE INDEX idx_anchor_text_type_risk ON anchor_text_analysis(anchor_type, risk_level);

-- Create views for common queries
CREATE VIEW active_prospects AS
SELECT 
    bp.*,
    COUNT(oa.id) as outreach_attempts,
    MAX(oa.sent_date) as last_outreach
FROM backlink_prospects bp
LEFT JOIN outreach_attempts oa ON bp.id = oa.prospect_id
WHERE bp.status IN ('discovered', 'qualified', 'contacted', 'responded')
GROUP BY bp.id;

CREATE VIEW campaign_performance AS
SELECT 
    c.*,
    COUNT(oa.id) as total_attempts,
    COUNT(CASE WHEN oa.opened_date IS NOT NULL THEN 1 END) as opens,
    COUNT(CASE WHEN oa.responded_date IS NOT NULL THEN 1 END) as responses,
    COUNT(CASE WHEN oa.response_type = 'positive' THEN 1 END) as positive_responses,
    ROUND(
        (COUNT(CASE WHEN oa.opened_date IS NOT NULL THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(oa.id), 0)) * 100, 2
    ) as open_rate,
    ROUND(
        (COUNT(CASE WHEN oa.responded_date IS NOT NULL THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(oa.id), 0)) * 100, 2
    ) as response_rate
FROM outreach_campaigns c
LEFT JOIN outreach_attempts oa ON c.id = oa.campaign_id
GROUP BY c.id;

CREATE VIEW backlink_health AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_links,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_links,
    COUNT(CASE WHEN date_lost IS NOT NULL THEN 1 END) as lost_links,
    AVG(value_score) as avg_value_score,
    COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_links
FROM backlinks
GROUP BY DATE(created_at)
ORDER BY date DESC;