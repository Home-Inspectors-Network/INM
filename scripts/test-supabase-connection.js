#!/usr/bin/env node

/**
 * Test Supabase Connection
 * This script demonstrates how to use Supabase directly without MCP servers
 */

const { supabase, supabaseUtils } = require('../src/utils/supabase-client');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: List all tables
    console.log('📋 Listing all tables in your Supabase database:');
    const tables = await supabaseUtils.listTables();
    
    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`  - ${table.tablename}`);
      });
    } else {
      console.log('  No tables found or unable to list tables.');
      console.log('  This might mean:');
      console.log('  1. Your database has no tables yet');
      console.log('  2. The connection credentials are incorrect');
      console.log('  3. You need to use the service role key for system tables');
    }

    // Test 2: Try to query the inspectors table (if it exists)
    console.log('\n🔍 Attempting to query inspectors table:');
    try {
      const inspectors = await supabaseUtils.queryTable('inspectors', { limit: 5 });
      
      if (inspectors && inspectors.length > 0) {
        console.log(`  Found ${inspectors.length} inspectors`);
        console.log('  Sample inspector:', JSON.stringify(inspectors[0], null, 2));
      } else {
        console.log('  No inspectors found in the table.');
      }
    } catch (error) {
      console.log('  Inspectors table not found or error querying it.');
      console.log('  You may need to create this table first.');
    }

    console.log('\n✅ Supabase connection test complete!');
    console.log('\n📖 Available utility functions:');
    console.log('  - supabaseUtils.listTables()');
    console.log('  - supabaseUtils.getTableSchema(tableName)');
    console.log('  - supabaseUtils.queryTable(tableName, options)');
    console.log('  - supabaseUtils.insert(tableName, data)');
    console.log('  - supabaseUtils.update(tableName, id, updates)');
    console.log('  - supabaseUtils.delete(tableName, id)');
    console.log('  - supabaseUtils.executeSql(query)');

  } catch (error) {
    console.error('\n❌ Error testing Supabase connection:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has these variables:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (optional but recommended)');
    console.log('2. Ensure your Supabase project is active');
    console.log('3. Verify your access token is correct');
  }
}

// Run the test
testSupabaseConnection(); 