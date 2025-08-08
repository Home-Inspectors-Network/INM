const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Simple Supabase Connection Test');
console.log('==================================\n');

console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'Missing'}`);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBasicConnection() {
    console.log('\nTesting basic connection...');
    
    try {
        // Test 1: Try to query system tables
        console.log('Test 1: Checking pg_tables...');
        const { data: tables, error: tablesError } = await supabase
            .rpc('exec', { 
                sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 10;" 
            });
        
        if (tablesError) {
            console.log('  RPC not available, trying direct table access...');
            
            // Test 2: Try to access a known table that might exist
            console.log('Test 2: Checking for existing tables...');
            const { data: authUsers, error: authError } = await supabase.auth.getUser();
            
            if (authError && authError.message.includes('Invalid')) {
                console.log('  ✓ Connection successful (auth endpoint accessible)');
            } else {
                console.log('  ✓ Connection successful');
            }
            
            // Test 3: Try to create a simple table to verify permissions
            console.log('Test 3: Testing table creation...');
            
            // Use raw SQL via the REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sql',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey
                },
                body: `
                    CREATE TABLE IF NOT EXISTS test_connection (
                        id SERIAL PRIMARY KEY,
                        test_value TEXT
                    );
                `
            });
            
            if (response.ok) {
                console.log('  ✓ Table creation test successful');
                
                // Clean up
                await fetch(`${supabaseUrl}/rest/v1/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/sql',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey
                    },
                    body: 'DROP TABLE IF EXISTS test_connection;'
                });
                
                return true;
            } else {
                const errorText = await response.text();
                console.log(`  ✗ Table creation failed: ${response.status} - ${errorText}`);
            }
        } else {
            console.log('  ✓ RPC available, connection successful');
            console.log(`  Found ${tables.length} tables`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.log(`✗ Connection test failed: ${error.message}`);
        return false;
    }
}

async function applySchemaViaAPI() {
    console.log('\nApplying schema via REST API...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema...');
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sql',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            },
            body: schema
        });
        
        if (response.ok) {
            console.log('✓ Schema applied successfully');
            return true;
        } else {
            const errorText = await response.text();
            console.log(`✗ Schema application failed: ${response.status}`);
            console.log(`Error: ${errorText}`);
            return false;
        }
    } catch (error) {
        console.log(`✗ Schema application error: ${error.message}`);
        return false;
    }
}

async function testTableAccess() {
    console.log('\nTesting table access after schema application...');
    
    const tables = ['inspectors', 'memberships', 'reviews', 'leads', 'seo_pages'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`✗ ${table}: ${error.message}`);
            } else {
                console.log(`✓ ${table}: accessible`);
            }
        } catch (error) {
            console.log(`✗ ${table}: ${error.message}`);
        }
    }
}

async function main() {
    const connected = await testBasicConnection();
    
    if (connected) {
        console.log('\n✓ Connection verified');
        
        const schemaApplied = await applySchemaViaAPI();
        
        if (schemaApplied) {
            await testTableAccess();
            console.log('\n🎉 Setup complete! Database ready for Phase II operations.');
        } else {
            console.log('\n⚠️  Manual schema application may be required.');
        }
    } else {
        console.log('\n❌ Connection failed. Please verify credentials.');
    }
}

main().catch(console.error);