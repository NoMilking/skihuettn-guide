import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Supabase client initialization.
 *
 * IMPORTANT: Make sure to create a .env file with:
 * - EXPO_PUBLIC_SUPABASE_URL
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * You can copy .env.example to .env and fill in your values.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.\n' +
    'You can copy .env.example to .env and fill in your values.'
  );
}

/**
 * Supabase client instance.
 *
 * Configuration:
 * - No authentication (persistSession: false)
 * - Device-based identification via device_id
 * - Row Level Security (RLS) is DISABLED on all tables
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // No user authentication
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Helper function to check Supabase connection.
 *
 * @returns Promise<boolean> - true if connection is successful
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('ski_areas').select('count');
    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      return false;
    }
    console.log('[Supabase] Connection successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test error:', error);
    return false;
  }
}
