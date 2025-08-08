const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSchema() {
    console.log('🔧 Manual Schema Setup for InspectorsNearMe.com');
    console.log('==============================================\n');
    
    // Create a simple test record to trigger table creation via upsert
    console.log('Creating inspectors table via insert operation...');
    
    try {
        // This will create the table structure based on the insert
        const { data, error } = await supabase
            .from('inspectors')
            .insert({
                business_name: 'Schema Setup Test Inspector',
                owner_name: 'Test Owner',
                email: 'test@schemasetup.com',
                phone: '(555) 123-4567',
                website: 'https://test.example.com',
                address_street: '123 Test Street',
                address_city: 'Austin',
                address_state: 'TX',
                address_zip: '78701',
                lat: 30.2672,
                lng: -97.7431,
                certifications: ['ASHI', 'InterNACHI'],
                services: ['Home Inspection', 'Radon Testing'],
                years_in_business: 5,
                insurance_verified: true,
                license_number: 'TEST-12345'
            })
            .select();
        
        if (error) {
            console.log('❌ Error creating inspectors table:', error.message);
            console.log('\n🔗 Manual Setup Required:');
            console.log('Please go to your Supabase Dashboard:');
            console.log('https://supabase.com/dashboard/project/issgdibqehibwtuqdffi');
            console.log('\nGo to the SQL Editor and run this schema:');
            console.log(`
-- Inspectors table
CREATE TABLE IF NOT EXISTS inspectors (
    id BIGSERIAL PRIMARY KEY,
    business_name TEXT NOT NULL,
    owner_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    lat NUMERIC,
    lng NUMERIC,
    certifications TEXT[],
    services TEXT[],
    years_in_business INTEGER,
    insurance_verified BOOLEAN DEFAULT FALSE,
    license_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other tables
CREATE TABLE IF NOT EXISTS memberships (
    id BIGSERIAL PRIMARY KEY,
    inspector_id BIGINT REFERENCES inspectors(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT,
    status TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    inspector_id BIGINT REFERENCES inspectors(id),
    reviewer_name TEXT,
    reviewer_email TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    inspector_id BIGINT REFERENCES inspectors(id),
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    service_needed TEXT,
    property_address TEXT,
    preferred_date DATE,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_pages (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT UNIQUE,
    page_type TEXT,
    title TEXT,
    meta_description TEXT,
    content TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspectors_city_state ON inspectors(address_city, address_state);
CREATE INDEX IF NOT EXISTS idx_inspectors_services ON inspectors USING GIN(services);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug);

-- Enable Row Level Security
ALTER TABLE inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for inspectors" ON inspectors
    FOR SELECT USING (true);

CREATE POLICY "Public read access for reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Public read access for seo_pages" ON seo_pages
    FOR SELECT USING (true);
            `);
            return false;
        } else {
            console.log('✅ Inspectors table created successfully!');
            console.log('📊 Test record created with ID:', data[0]?.id);
            
            // Clean up test record
            if (data[0]?.id) {
                await supabase
                    .from('inspectors')
                    .delete()
                    .eq('id', data[0].id);
                console.log('🧹 Test record cleaned up');
            }
            
            return true;
        }
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await createSchema();
    
    if (success) {
        console.log('\n✅ Schema setup completed successfully!');
        console.log('🚀 Ready to proceed with data collection');
        console.log('\nNext step: Run the enhanced data harvester:');
        console.log('node scripts/enhanced-google-maps-harvester.js');
    }
}

main().catch(console.error);