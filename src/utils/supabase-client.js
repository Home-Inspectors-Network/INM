const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key if available, otherwise use anon key
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

// Utility functions that mimic MCP server capabilities
const supabaseUtils = {
  // List all tables in the database
  async listTables() {
    try {
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error listing tables:', error);
      throw error;
    }
  },

  // Get table schema
  async getTableSchema(tableName) {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error getting schema for ${tableName}:`, error);
      throw error;
    }
  },

  // Query data from a table
  async queryTable(tableName, options = {}) {
    try {
      let query = supabase.from(tableName).select(options.columns || '*');
      
      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error querying ${tableName}:`, error);
      throw error;
    }
  },

  // Insert data
  async insert(tableName, data) {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      throw error;
    }
  },

  // Update data
  async update(tableName, id, updates) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      throw error;
    }
  },

  // Delete data
  async delete(tableName, id) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      throw error;
    }
  },

  // Execute raw SQL (requires service role key)
  async executeSql(query) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
  }
};

// Export both the client and utility functions
module.exports = {
  supabase,
  supabaseUtils
}; 