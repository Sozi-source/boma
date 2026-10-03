import 'server-only';

import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function allowPaymentAttempt(db: SupabaseClient, scope: string, identity: string, limit: number, windowSeconds: number) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Rate limiting is not configured');
  const key = createHmac('sha256', secret).update(`${scope}:${identity}`).digest('hex');
  const { data, error } = await db.rpc('consume_payment_rate_limit', {
    p_key_hash: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}
