import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder')
);

export function createClient() {
  const url = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
  const key = supabaseKey || 'placeholder-anon-key';
  return createBrowserClient(url, key);
}

export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl, supabaseKey)
  : null;
