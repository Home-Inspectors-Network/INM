# Supabase Integration for InspectorsNearMe.com

## Overview

Since Claude Code version 1.0.61 doesn't support MCP servers, we've implemented a direct Supabase integration using the JavaScript client library. This provides the same functionality that the MCP server would have offered.

## Setup

### Environment Variables

Ensure your `.env` file contains these Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Testing the Connection

Run the test script to verify your Supabase connection:

```bash
npm run test-supabase
```

## Usage

### Import the Supabase Client

```javascript
const { supabase, supabaseUtils } = require('./src/utils/supabase-client');
```

### Available Utility Functions

1. **List all tables**
   ```javascript
   const tables = await supabaseUtils.listTables();
   ```

2. **Get table schema**
   ```javascript
   const schema = await supabaseUtils.getTableSchema('inspectors');
   ```

3. **Query data**
   ```javascript
   const inspectors = await supabaseUtils.queryTable('inspectors', {
     filters: { state: 'CA' },
     orderBy: 'created_at',
     limit: 10
   });
   ```

4. **Insert data**
   ```javascript
   const newInspector = await supabaseUtils.insert('inspectors', {
     business_name: 'Quality Inspections LLC',
     email: 'info@qualityinspections.com',
     // ... other fields
   });
   ```

5. **Update data**
   ```javascript
   const updated = await supabaseUtils.update('inspectors', inspectorId, {
     phone: '555-1234',
     verified: true
   });
   ```

6. **Delete data**
   ```javascript
   const result = await supabaseUtils.delete('inspectors', inspectorId);
   ```

## Advantages Over MCP Server

1. **Direct Integration**: No need for additional server configuration
2. **Better Performance**: Direct database access without MCP overhead
3. **Version Compatibility**: Works with all Claude Code versions
4. **Full Control**: You can customize the utility functions as needed

## Using with Your Agents

The agents can use these utilities directly in their scripts. For example:

```javascript
// In your data collection scripts
const { supabaseUtils } = require('../src/utils/supabase-client');

async function saveInspectorData(inspectorData) {
  try {
    const result = await supabaseUtils.insert('inspectors', inspectorData);
    console.log('Inspector saved:', result);
  } catch (error) {
    console.error('Error saving inspector:', error);
  }
}
```

## Next Steps

1. Update your agent scripts to use the `supabase-client.js` utilities
2. Create the necessary database tables using the schema in `config/schema.sql`
3. Test the Google Maps API integration for data collection
4. Begin Phase 2 implementation with real data collection

## Troubleshooting

If you encounter connection issues:

1. Verify your Supabase project is active
2. Check that all environment variables are correctly set
3. Ensure you're using the correct keys (anon key for public operations, service role key for admin operations)
4. Run `npm run test-supabase` to diagnose connection problems 