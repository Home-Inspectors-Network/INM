import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for use in API routes and getServerSideProps
// Uses non-prefixed environment variables which are available server-side

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase environment variables. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.'
  );
}

export const serverSupabase = createClient(supabaseUrl, supabaseAnonKey);