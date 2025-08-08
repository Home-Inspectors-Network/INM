const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration in environment variables');
    console.log('Please ensure these are set:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
    console.log('🔧 Creating inspectors table...');
    console.log(`Database: ${supabaseUrl}`);
    
    try {
        // Try to insert a test record which will create the table if it doesn't exist
        const { data, error } = await supabase
            .from('inspectors')
            .insert({
                business_name: 'TEST_RECORD_FOR_TABLE_CREATION',
                address_city: 'Houston',
                address_state: 'TX',
                certifications: ['ASHI'],
                services: ['Home Inspection'],
                lat: 29.7604,
                lng: -95.3698
            })
            .select();
        
        if (error) {
            console.log('❌ Table creation failed:', error.message);
            console.log('\n📋 Manual setup instructions:');
            console.log('1. Go to https://supabase.com/dashboard');
            console.log('2. Open the SQL Editor');
            console.log('3. Run this SQL:');
            console.log(`
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
    certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
    services TEXT[] DEFAULT ARRAY[]::TEXT[],
    years_in_business INTEGER,
    insurance_verified BOOLEAN DEFAULT FALSE,
    license_number TEXT,
    google_place_id TEXT UNIQUE,
    google_rating NUMERIC,
    google_reviews_count INTEGER,
    business_status TEXT DEFAULT 'OPERATIONAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inspectors_city_state ON inspectors(address_city, address_state);
CREATE INDEX IF NOT EXISTS idx_inspectors_place_id ON inspectors(google_place_id);
CREATE INDEX IF NOT EXISTS idx_inspectors_services ON inspectors USING GIN(services);

-- Enable Row Level Security
ALTER TABLE inspectors ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access for inspectors" ON inspectors
    FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON inspectors TO anon;
GRANT ALL ON inspectors TO authenticated;
            `);
            console.log('\n4. After running the SQL, try the harvester again.');
            return false;
        } else {
            console.log('✅ Table created successfully!');
            console.log('Test record ID:', data[0]?.id);
            
            // Clean up test record
            if (data[0]?.id) {
                await supabase
                    .from('inspectors')
                    .delete()
                    .eq('id', data[0].id);
                console.log('🧹 Test record cleaned up');
            }
            
            console.log('✅ Database is ready for harvesting!');
            return true;
        }
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await createTable();
    
    if (success) {
        console.log('\n🚀 Ready to start harvesting!');
        console.log('Run: npm run harvest');
    } else {
        console.log('\n⚠️  Manual setup required before harvesting');
    }
}

main().catch(console.error);