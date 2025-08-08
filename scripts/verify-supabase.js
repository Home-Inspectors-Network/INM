const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Production Verification');
console.log('===================================\n');

console.log('Configuration:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey ? '✓ Present' : '✗ Missing'}`);
console.log(`Anon Key: ${supabaseAnonKey ? '✓ Present' : '✗ Missing'}`);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\nMissing required Supabase configuration');
    process.exit(1);
}

// Create clients
const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const publicClient = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('\n📡 Testing Connection...');
    
    try {
        // Test with a simple query that should work
        const { data, error } = await adminClient
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(10);
        
        if (error) {
            console.log('✗ Connection test failed:', error.message);
            return false;
        }
        
        console.log('✓ Connection successful');
        console.log(`Found ${data.length} public tables`);
        if (data.length > 0) {
            console.log('Tables:', data.map(t => t.table_name).join(', '));
        }
        return true;
    } catch (error) {
        console.log('✗ Connection failed:', error.message);
        return false;
    }
}

async function checkTables() {
    console.log('\n📋 Checking Required Tables...');
    
    const requiredTables = ['inspectors', 'memberships', 'reviews', 'leads', 'seo_pages'];
    let tablesExist = 0;
    
    for (const table of requiredTables) {
        try {
            const { data, error } = await adminClient
                .from(table)
                .select('count')
                .limit(1);
            
            if (error) {
                if (error.code === '42P01') {
                    console.log(`✗ Table '${table}': Does not exist`);
                } else {
                    console.log(`? Table '${table}': ${error.message}`);
                }
            } else {
                console.log(`✓ Table '${table}': Exists and accessible`);
                tablesExist++;
            }
        } catch (error) {
            console.log(`✗ Table '${table}': ${error.message}`);
        }
    }
    
    return tablesExist;
}

async function testBasicCRUD() {
    console.log('\n🔧 Testing Basic CRUD Operations...');
    
    try {
        // Test insert
        const { data: insertData, error: insertError } = await adminClient
            .from('inspectors')
            .insert({
                business_name: 'Test Inspector LLC',
                owner_name: 'Test Owner',
                email: 'test@inspectorsnearme.com',
                phone: '555-0123',
                address_city: 'Austin',
                address_state: 'TX',
                address_zip: '78701'
            })
            .select('id')
            .single();
        
        if (insertError) {
            console.log('✗ Insert failed:', insertError.message);
            return false;
        }
        
        console.log('✓ Insert successful');
        const testId = insertData.id;
        
        // Test read
        const { data: readData, error: readError } = await adminClient
            .from('inspectors')
            .select('business_name, owner_name')
            .eq('id', testId)
            .single();
        
        if (readError) {
            console.log('✗ Read failed:', readError.message);
        } else {
            console.log('✓ Read successful:', readData.business_name);
        }
        
        // Test update
        const { error: updateError } = await adminClient
            .from('inspectors')
            .update({ business_name: 'Updated Test Inspector LLC' })
            .eq('id', testId);
        
        if (updateError) {
            console.log('✗ Update failed:', updateError.message);
        } else {
            console.log('✓ Update successful');
        }
        
        // Test delete (cleanup)
        const { error: deleteError } = await adminClient
            .from('inspectors')
            .delete()
            .eq('id', testId);
        
        if (deleteError) {
            console.log('✗ Delete failed:', deleteError.message);
        } else {
            console.log('✓ Delete successful (cleanup completed)');
        }
        
        return true;
    } catch (error) {
        console.log('✗ CRUD test failed:', error.message);
        return false;
    }
}

async function testPublicAccess() {
    console.log('\n🔓 Testing Public Access (Anon Key)...');
    
    try {
        const { data, error } = await publicClient
            .from('inspectors')
            .select('id, business_name, address_city, address_state')
            .limit(5);
        
        if (error) {
            console.log('✗ Public access failed:', error.message);
            return false;
        }
        
        console.log(`✓ Public access successful (${data.length} records accessible)`);
        return true;
    } catch (error) {
        console.log('✗ Public access test failed:', error.message);
        return false;
    }
}

async function main() {
    const connectionOk = await testConnection();
    if (!connectionOk) {
        console.log('\n❌ Connection failed - cannot proceed with further tests');
        process.exit(1);
    }
    
    const tablesCount = await checkTables();
    const crudOk = tablesCount > 0 ? await testBasicCRUD() : false;
    const publicOk = tablesCount > 0 ? await testPublicAccess() : false;
    
    console.log('\n===================================');
    console.log('📊 Summary:');
    console.log(`Connection: ${connectionOk ? '✓' : '✗'}`);
    console.log(`Tables: ${tablesCount}/5 exist`);
    console.log(`CRUD Operations: ${crudOk ? '✓' : '✗'}`);
    console.log(`Public Access: ${publicOk ? '✓' : '✗'}`);
    
    if (connectionOk && tablesCount === 5 && crudOk && publicOk) {
        console.log('\n🎉 Production database is ready for Phase II operations!');
    } else if (connectionOk && tablesCount === 0) {
        console.log('\n⚠️  Database connected but schema needs to be applied.');
        console.log('Please apply the schema manually via Supabase dashboard or SQL editor.');
    } else {
        console.log('\n⚠️  Some issues detected. Check the logs above.');
    }
}

main().catch(console.error);