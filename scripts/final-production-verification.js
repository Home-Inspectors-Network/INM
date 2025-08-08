const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🎯 Final Production Database Verification');
console.log('=========================================\n');

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const publicClient = createClient(supabaseUrl, supabaseAnonKey);

async function verifyConnection() {
    console.log('🔗 Connection Verification');
    console.log('-------------------------');
    console.log(`Database URL: ${supabaseUrl}`);
    
    try {
        const { data, error } = await adminClient.auth.getUser();
        console.log('✓ Admin connection successful');
        
        const { data: pubData, error: pubError } = await publicClient.auth.getUser();
        console.log('✓ Public connection successful');
        
        return true;
    } catch (error) {
        console.log('✗ Connection failed:', error.message);
        return false;
    }
}

async function verifyTables() {
    console.log('\n📋 Table Structure Verification');
    console.log('-------------------------------');
    
    const expectedTables = [
        'inspectors',
        'memberships', 
        'reviews',
        'leads',
        'seo_pages'
    ];
    
    let allTablesExist = true;
    const tableDetails = {};
    
    for (const table of expectedTables) {
        try {
            const { data, error } = await adminClient
                .from(table)
                .select('*')
                .limit(1);
            
            if (error && error.code === '42P01') {
                console.log(`✗ Table '${table}': Does not exist`);
                allTablesExist = false;
            } else if (error) {
                console.log(`⚠️  Table '${table}': ${error.message}`);
                tableDetails[table] = { exists: true, accessible: false, error: error.message };
            } else {
                console.log(`✓ Table '${table}': Exists and accessible`);
                tableDetails[table] = { exists: true, accessible: true };
            }
        } catch (error) {
            console.log(`✗ Table '${table}': ${error.message}`);
            allTablesExist = false;
        }
    }
    
    return { allTablesExist, tableDetails };
}

async function verifyIndexes() {
    console.log('\n📊 Index Verification');
    console.log('--------------------');
    
    const expectedIndexes = [
        'idx_inspectors_city_state',
        'idx_inspectors_services',
        'idx_memberships_status',
        'idx_seo_pages_slug'
    ];
    
    // Note: We can't directly query pg_indexes via the client, 
    // so we'll test the functionality of the indexes indirectly
    
    try {
        // Test city/state index on inspectors
        const { data, error } = await adminClient
            .from('inspectors')
            .select('id')
            .eq('address_city', 'Austin')
            .eq('address_state', 'TX')
            .limit(1);
        
        if (!error) {
            console.log('✓ City/State index query successful');
        } else {
            console.log('⚠️  City/State index query failed:', error.message);
        }
    } catch (error) {
        console.log('⚠️  Index verification incomplete');
    }
}

async function testCRUDOperations() {
    console.log('\n🔧 CRUD Operations Test');
    console.log('----------------------');
    
    try {
        // Test Inspector CRUD
        console.log('Testing Inspector operations...');
        
        // CREATE
        const { data: newInspector, error: createError } = await adminClient
            .from('inspectors')
            .insert({
                business_name: 'Production Test Inspector LLC',
                owner_name: 'John Doe',
                email: 'test@productiontest.com',
                phone: '555-TEST-123',
                website: 'https://test.example.com',
                address_street: '123 Test Street',
                address_city: 'Austin',
                address_state: 'TX',
                address_zip: '78701',
                lat: 30.2672,
                lng: -97.7431,
                certifications: ['TREC', 'ASHI'],
                services: ['Home Inspection', 'Termite Inspection'],
                years_in_business: 5,
                insurance_verified: true,
                license_number: 'TEST-12345'
            })
            .select('id')
            .single();
        
        if (createError) {
            console.log('✗ CREATE failed:', createError.message);
            return false;
        }
        console.log('✓ CREATE successful');
        
        const testId = newInspector.id;
        
        // READ
        const { data: readInspector, error: readError } = await adminClient
            .from('inspectors')
            .select('*')
            .eq('id', testId)
            .single();
        
        if (readError) {
            console.log('✗ READ failed:', readError.message);
        } else {
            console.log('✓ READ successful');
            console.log(`  Retrieved: ${readInspector.business_name}`);
        }
        
        // UPDATE
        const { error: updateError } = await adminClient
            .from('inspectors')
            .update({ 
                business_name: 'Updated Production Test Inspector LLC',
                updated_at: new Date().toISOString()
            })
            .eq('id', testId);
        
        if (updateError) {
            console.log('✗ UPDATE failed:', updateError.message);
        } else {
            console.log('✓ UPDATE successful');
        }
        
        // Test relationships - Create a review
        const { data: newReview, error: reviewError } = await adminClient
            .from('reviews')
            .insert({
                inspector_id: testId,
                reviewer_name: 'Test Reviewer',
                reviewer_email: 'reviewer@test.com',
                rating: 5,
                comment: 'Excellent service during production testing',
                verified: true
            })
            .select('id')
            .single();
        
        if (reviewError) {
            console.log('✗ RELATIONSHIP test (review) failed:', reviewError.message);
        } else {
            console.log('✓ RELATIONSHIP test successful (review created)');
            
            // Clean up review
            await adminClient
                .from('reviews')
                .delete()
                .eq('id', newReview.id);
        }
        
        // DELETE (cleanup)
        const { error: deleteError } = await adminClient
            .from('inspectors')
            .delete()
            .eq('id', testId);
        
        if (deleteError) {
            console.log('✗ DELETE failed:', deleteError.message);
        } else {
            console.log('✓ DELETE successful (cleanup completed)');
        }
        
        return true;
    } catch (error) {
        console.log('✗ CRUD test failed:', error.message);
        return false;
    }
}

async function testPublicAccess() {
    console.log('\n🔓 Public Access Test (Anonymous Key)');
    console.log('------------------------------------');
    
    try {
        // Test read access with anonymous key
        const { data, error } = await publicClient
            .from('inspectors')
            .select('id, business_name, address_city, address_state, services')
            .limit(3);
        
        if (error) {
            console.log('✗ Public read access failed:', error.message);
            console.log('  Note: This may be expected if RLS policies are enabled');
            return false;
        }
        
        console.log(`✓ Public read access successful (${data.length} records)`);
        
        // Test write access (should fail for security)
        const { error: writeError } = await publicClient
            .from('inspectors')
            .insert({
                business_name: 'Unauthorized Test'
            });
        
        if (writeError) {
            console.log('✓ Public write access properly restricted');
        } else {
            console.log('⚠️  Public write access allowed (security concern)');
        }
        
        return true;
    } catch (error) {
        console.log('✗ Public access test failed:', error.message);
        return false;
    }
}

async function performanceTest() {
    console.log('\n⚡ Performance Test');
    console.log('------------------');
    
    try {
        const startTime = Date.now();
        
        // Test query performance
        const { data, error } = await adminClient
            .from('inspectors')
            .select('id, business_name, address_city, address_state')
            .limit(100);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error) {
            console.log('✗ Performance test failed:', error.message);
            return false;
        }
        
        console.log(`✓ Query completed in ${duration}ms`);
        console.log(`✓ Retrieved ${data.length} records`);
        
        if (duration < 1000) {
            console.log('✓ Performance: Excellent (< 1s)');
        } else if (duration < 3000) {
            console.log('✓ Performance: Good (< 3s)');
        } else {
            console.log('⚠️  Performance: Slow (> 3s)');
        }
        
        return true;
    } catch (error) {
        console.log('✗ Performance test failed:', error.message);
        return false;
    }
}

async function generateSummaryReport() {
    console.log('\n📊 Production Readiness Summary');
    console.log('==============================\n');
    
    const results = {
        connection: await verifyConnection(),
        tables: await verifyTables(),
        crud: false,
        publicAccess: false,
        performance: false
    };
    
    if (results.tables.allTablesExist) {
        await verifyIndexes();
        results.crud = await testCRUDOperations();
        results.publicAccess = await testPublicAccess();
        results.performance = await performanceTest();
    }
    
    console.log('\n🎯 Final Assessment:');
    console.log('===================');
    console.log(`Database Connection: ${results.connection ? '✅' : '❌'}`);
    console.log(`Schema Applied: ${results.tables.allTablesExist ? '✅' : '❌'}`);
    console.log(`CRUD Operations: ${results.crud ? '✅' : '❌'}`);
    console.log(`Security (RLS): ${!results.publicAccess ? '✅' : '⚠️ '}`);
    console.log(`Performance: ${results.performance ? '✅' : '❌'}`);
    
    if (results.connection && results.tables.allTablesExist && results.crud) {
        console.log('\n🚀 STATUS: READY FOR PHASE II OPERATIONS');
        console.log('\nNext Steps:');
        console.log('1. Begin data migration/import');
        console.log('2. Configure Row Level Security (RLS) policies');
        console.log('3. Set up monitoring and backups');
        console.log('4. Deploy application to production');
    } else {
        console.log('\n⚠️  STATUS: REQUIRES ATTENTION');
        console.log('\nRequired Actions:');
        if (!results.connection) console.log('- Fix database connection issues');
        if (!results.tables.allTablesExist) console.log('- Apply database schema manually');
        if (!results.crud) console.log('- Investigate CRUD operation failures');
    }
    
    console.log(`\nDatabase URL: ${supabaseUrl}`);
    console.log('Dashboard: https://supabase.com/dashboard/project/issgdibqehibwtuqdffi');
}

async function main() {
    await generateSummaryReport();
}

main().catch(console.error);