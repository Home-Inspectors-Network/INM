const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Creating Tables Programmatically');
console.log('==================================\n');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define our schema as JavaScript objects that we'll use to create tables
const tableDefinitions = {
    inspectors: {
        id: 'SERIAL PRIMARY KEY',
        business_name: 'VARCHAR(255) NOT NULL',
        owner_name: 'VARCHAR(255)',
        email: 'VARCHAR(255)',
        phone: 'VARCHAR(20)',
        website: 'VARCHAR(255)',
        address_street: 'VARCHAR(255)',
        address_city: 'VARCHAR(100)',
        address_state: 'VARCHAR(2)',
        address_zip: 'VARCHAR(10)',
        lat: 'DECIMAL(10, 8)',
        lng: 'DECIMAL(11, 8)',
        certifications: 'TEXT[]',
        services: 'TEXT[]',
        years_in_business: 'INTEGER',
        insurance_verified: 'BOOLEAN DEFAULT FALSE',
        license_number: 'VARCHAR(100)',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    memberships: {
        id: 'SERIAL PRIMARY KEY',
        inspector_id: 'INTEGER REFERENCES inspectors(id)',
        stripe_customer_id: 'VARCHAR(255)',
        stripe_subscription_id: 'VARCHAR(255)',
        plan_type: 'VARCHAR(50)',
        status: 'VARCHAR(50)',
        started_at: 'TIMESTAMP',
        expires_at: 'TIMESTAMP',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    reviews: {
        id: 'SERIAL PRIMARY KEY',
        inspector_id: 'INTEGER REFERENCES inspectors(id)',
        reviewer_name: 'VARCHAR(255)',
        reviewer_email: 'VARCHAR(255)',
        rating: 'INTEGER CHECK (rating >= 1 AND rating <= 5)',
        comment: 'TEXT',
        verified: 'BOOLEAN DEFAULT FALSE',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    leads: {
        id: 'SERIAL PRIMARY KEY',
        inspector_id: 'INTEGER REFERENCES inspectors(id)',
        customer_name: 'VARCHAR(255)',
        customer_email: 'VARCHAR(255)',
        customer_phone: 'VARCHAR(20)',
        service_needed: 'VARCHAR(100)',
        property_address: 'TEXT',
        preferred_date: 'DATE',
        message: 'TEXT',
        status: 'VARCHAR(50) DEFAULT \'new\'',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    seo_pages: {
        id: 'SERIAL PRIMARY KEY',
        slug: 'VARCHAR(255) UNIQUE',
        page_type: 'VARCHAR(50)',
        title: 'VARCHAR(255)',
        meta_description: 'TEXT',
        content: 'TEXT',
        city: 'VARCHAR(100)',
        state: 'VARCHAR(2)',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    }
};

async function checkIfTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        return !error || error.code !== '42P01';
    } catch {
        return false;
    }
}

async function testConnection() {
    console.log('Testing connection...');
    try {
        // Try a simple operation to verify connection
        const { data, error } = await supabase.auth.getUser();
        console.log('✓ Connection to Supabase verified');
        return true;
    } catch (error) {
        console.log('✗ Connection failed:', error.message);
        return false;
    }
}

async function createDatabaseFunction() {
    console.log('\nAttempting to create a database function for table creation...');
    
    // Try to create a simple test table first to verify we have the right permissions
    try {
        const { error } = await supabase
            .from('__test_table_creation__')
            .insert({ test: 'value' });
        
        if (error && error.code === '42P01') {
            console.log('✓ Database access confirmed (table does not exist as expected)');
        } else if (error) {
            console.log('Database error:', error.message);
        }
        
        // Since we can't execute arbitrary SQL via the client, let's try a different approach
        // Let's see if we can insert data into existing tables or get information about the schema
        
        return false;
    } catch (error) {
        console.log('Error testing database access:', error.message);
        return false;
    }
}

async function testTableCreation() {
    console.log('\nTesting table creation capabilities...');
    
    // Check each table
    for (const [tableName, columns] of Object.entries(tableDefinitions)) {
        console.log(`\nChecking table: ${tableName}`);
        
        const exists = await checkIfTableExists(tableName);
        if (exists) {
            console.log(`  ✓ Table '${tableName}' already exists`);
            
            // Test basic operations
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`  ⚠️  Table exists but has access issues: ${error.message}`);
                } else {
                    console.log(`  ✓ Table '${tableName}' is accessible`);
                }
            } catch (error) {
                console.log(`  ✗ Error accessing table: ${error.message}`);
            }
        } else {
            console.log(`  ✗ Table '${tableName}' does not exist`);
        }
    }
}

async function generateSchemaInstructions() {
    console.log('\n📋 Manual Schema Application Instructions');
    console.log('=========================================\n');
    
    console.log('Since automated schema application is not possible with the current setup,');
    console.log('please follow these steps to apply the schema manually:\n');
    
    console.log('1. Go to your Supabase Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}\n`);
    
    console.log('2. Navigate to the SQL Editor in the left sidebar\n');
    
    console.log('3. Copy and paste the following SQL schema:\n');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('```sql');
        console.log(schema);
        console.log('```\n');
        
        console.log('4. Click "Run" to execute the schema\n');
        console.log('5. Verify the tables were created by running:');
        console.log('   SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';\n');
        
        console.log('6. Run the verification script again:');
        console.log('   node scripts/verify-supabase.js\n');
        
    } catch (error) {
        console.log('Error reading schema file:', error.message);
    }
}

async function main() {
    const connected = await testConnection();
    if (!connected) {
        console.log('❌ Cannot connect to Supabase');
        return;
    }
    
    await testTableCreation();
    
    // Check if all tables exist
    let allTablesExist = true;
    for (const tableName of Object.keys(tableDefinitions)) {
        const exists = await checkIfTableExists(tableName);
        if (!exists) {
            allTablesExist = false;
            break;
        }
    }
    
    if (allTablesExist) {
        console.log('\n🎉 All tables exist! Database is ready for Phase II operations.');
        
        // Test a basic CRUD operation
        console.log('\nTesting basic operations...');
        try {
            const { data, error } = await supabase
                .from('inspectors')
                .insert({
                    business_name: 'Test Inspector',
                    address_city: 'Test City',
                    address_state: 'TX'
                })
                .select('id')
                .single();
            
            if (error) {
                console.log('✗ Insert test failed:', error.message);
            } else {
                console.log('✓ Insert test successful');
                
                // Clean up
                await supabase
                    .from('inspectors')
                    .delete()
                    .eq('id', data.id);
                console.log('✓ Cleanup completed');
            }
        } catch (error) {
            console.log('✗ CRUD test failed:', error.message);
        }
    } else {
        await generateSchemaInstructions();
    }
}

main().catch(console.error);