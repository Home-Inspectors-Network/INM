const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration in .env.local');
    process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
    try {
        // Use the REST API directly to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            // Try alternative method - use the PostgREST query interface
            const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sql',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                    'Prefer': 'return=minimal'
                },
                body: sql
            });
            
            if (!altResponse.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            return { success: true };
        }
        
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
}

async function applySchemaDirectly() {
    console.log('Applying database schema using direct SQL execution...');
    
    try {
        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Schema content:');
        console.log(schema.substring(0, 200) + '...');
        console.log('\nAttempting to execute full schema...');
        
        // Try to execute the entire schema as one block
        const result = await executeSQL(schema);
        
        if (result.error) {
            console.log('Direct execution failed, trying statement by statement...');
            
            // Split into individual statements and execute one by one
            const statements = schema
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i] + ';';
                console.log(`Executing statement ${i + 1}/${statements.length}:`);
                console.log(statement.substring(0, 100) + '...');
                
                const stmtResult = await executeSQL(statement);
                if (stmtResult.error) {
                    console.log(`  ✗ Error: ${stmtResult.error}`);
                } else {
                    console.log(`  ✓ Success`);
                }
            }
        } else {
            console.log('✓ Schema executed successfully as a block');
        }
        
        return true;
    } catch (error) {
        console.error('Schema application failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Direct Supabase Schema Application');
    console.log('=====================================\n');
    
    await applySchemaDirectly();
    
    console.log('\n=====================================');
    console.log('Schema application attempt completed.');
    console.log('Please run the verification script to check results.');
}

main().catch(console.error);