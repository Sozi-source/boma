import 'server-only';

import { createClient } from '@supabase/supabase-js';

/** Privileged database access. This module must only be imported by route handlers. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !url.startsWith('https://') || !key) {
    throw new Error('Server payment persistence is not configured');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
