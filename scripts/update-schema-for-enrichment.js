#!/usr/bin/env node

/**
 * Update Database Schema for Enhanced Enrichment
 * Adds columns to support comprehensive multi-city enrichment
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSchema() {
  console.log('🔧 UPDATING DATABASE SCHEMA FOR ENRICHMENT');
  console.log('============================================\n');

  const updates = [
    {
      name: 'Add enrichment tracking columns',
      sql: `
        ALTER TABLE inspectors 
        ADD COLUMN IF NOT EXISTS enrichment_data JSONB,
        ADD COLUMN IF NOT EXISTS service_cities TEXT[],
        ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_multi_city_assignment BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS original_inspector_id UUID REFERENCES inspectors(id);
      `
    },
    {
      name: 'Add indexes for performance',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_inspectors_enrichment_status ON inspectors(enrichment_status);
        CREATE INDEX IF NOT EXISTS idx_inspectors_quality_score ON inspectors(quality_score DESC);
        CREATE INDEX IF NOT EXISTS idx_inspectors_service_cities ON inspectors USING GIN(service_cities);
        CREATE INDEX IF NOT EXISTS idx_inspectors_multi_city ON inspectors(is_multi_city_assignment);
        CREATE INDEX IF NOT EXISTS idx_inspectors_original_id ON inspectors(original_inspector_id);
      `
    },
    {
      name: 'Add GIN index for enrichment data JSONB',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_inspectors_enrichment_data ON inspectors USING GIN(enrichment_data);
      `
    },
    {
      name: 'Update existing records with default values',
      sql: `
        UPDATE inspectors 
        SET enrichment_status = 'pending',
            quality_score = 0,
            is_multi_city_assignment = FALSE
        WHERE enrichment_status IS NULL;
      `
    }
  ];

  let successCount = 0;

  for (const update of updates) {
    try {
      console.log(`📝 Executing: ${update.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: update.sql 
      });
      
      if (error) {
        // Try direct execution if RPC fails
        console.log('  ⚠️  RPC failed, trying direct execution...');
        
        // Split multiple statements and execute individually
        const statements = update.sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error: directError } = await supabase
              .from('inspectors')
              .select('id')
              .limit(1); // This will fail if table doesn't exist
            
            if (directError && directError.code === '42P01') {
              console.log('  ❌ Inspectors table does not exist. Please create tables first.');
              break;
            }
          }
        }
        
        // For schema updates, we need to use the SQL editor in Supabase dashboard
        console.log('  ⚠️  Schema updates require manual execution in Supabase SQL editor');
        console.log(`  📋 SQL to execute: ${update.sql}`);
      } else {
        console.log('  ✅ Success');
        successCount++;
      }
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
      console.log('  📋 Manual SQL needed:', update.sql);
    }
  }

  console.log(`\n📊 Schema Update Summary:`);
  console.log(`✅ Successful updates: ${successCount}/${updates.length}`);
  console.log(`📝 Manual updates needed: ${updates.length - successCount}`);

  if (successCount < updates.length) {
    console.log('\n📋 MANUAL SQL COMMANDS TO RUN IN SUPABASE:');
    console.log('==========================================');
    updates.forEach((update, index) => {
      console.log(`\n-- ${index + 1}. ${update.name}`);
      console.log(update.sql);
    });
  }

  return successCount === updates.length;
}

// Test the updated schema
async function testSchema() {
  console.log('\n🧪 TESTING UPDATED SCHEMA');
  console.log('==========================\n');

  const tests = [
    {
      name: 'Check if enrichment columns exist',
      test: async () => {
        const { data, error } = await supabase
          .from('inspectors')
          .select('enrichment_status, quality_score, is_multi_city_assignment')
          .limit(1);
        
        return !error;
      }
    },
    {
      name: 'Test JSONB enrichment_data column',
      test: async () => {
        const { error } = await supabase
          .from('inspectors')
          .select('enrichment_data')
          .limit(1);
        
        return !error;
      }
    },
    {
      name: 'Test service_cities array column',
      test: async () => {
        const { error } = await supabase
          .from('inspectors')
          .select('service_cities')
          .limit(1);
        
        return !error;
      }
    }
  ];

  let passedTests = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const passed = await test.test();
      
      if (passed) {
        console.log('  ✅ PASS');
        passedTests++;
      } else {
        console.log('  ❌ FAIL');
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${tests.length} passed`);
  return passedTests === tests.length;
}

async function main() {
  try {
    const schemaUpdated = await updateSchema();
    
    if (schemaUpdated) {
      const testsPass = await testSchema();
      
      if (testsPass) {
        console.log('\n🎉 Schema successfully updated and tested!');
        console.log('📋 Ready for enhanced enrichment execution.');
      } else {
        console.log('\n⚠️  Schema updated but tests failed. Check configuration.');
      }
    } else {
      console.log('\n⚠️  Schema updates incomplete. Manual intervention required.');
      console.log('📋 Please run the SQL commands shown above in Supabase dashboard.');
    }
    
  } catch (error) {
    console.error('\n❌ Schema update failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateSchema, testSchema };