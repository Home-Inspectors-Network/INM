-- Inspectors table
CREATE TABLE inspectors (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(10),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    certifications TEXT[],
    services TEXT[],
    years_in_business INTEGER,
    insurance_verified BOOLEAN DEFAULT FALSE,
    license_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Premium memberships
CREATE TABLE memberships (
    id SERIAL PRIMARY KEY,
    inspector_id INTEGER REFERENCES inspectors(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan_type VARCHAR(50),
    status VARCHAR(50),
    started_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    inspector_id INTEGER REFERENCES inspectors(id),
    reviewer_name VARCHAR(255),
    reviewer_email VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    inspector_id INTEGER REFERENCES inspectors(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    service_needed VARCHAR(100),
    property_address TEXT,
    preferred_date DATE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEO pages
CREATE TABLE seo_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    page_type VARCHAR(50),
    title VARCHAR(255),
    meta_description TEXT,
    content TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_inspectors_city_state ON inspectors(address_city, address_state);
CREATE INDEX idx_inspectors_services ON inspectors USING GIN(services);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_seo_pages_slug ON seo_pages(slug);
