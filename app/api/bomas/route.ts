import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bomaId = searchParams.get('id');
    const category = searchParams.get('category');
    const q = searchParams.get('q');
    const requestedCreatorId = searchParams.get('creator_id');

    const COLUMNS = 'id,group_id,group_name,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at';

    if (bomaId) {
      // Single fund by ID — public only, no auth required
      const admin = createAdminClient();
      const { data, error } = await admin.from('bomas')
        .select(COLUMNS)
        .eq('id', bomaId)
        .eq('is_public', true)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: data ? [data] : [] });
    }

    if (requestedCreatorId) {
      // Creator dashboard — must be authenticated as that creator
      const auth = await createClient();
      const { data: { user } } = await auth.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Sign in to view your funds.' }, { status: 401 });
      if (user.id !== requestedCreatorId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const admin = createAdminClient();
      let query = admin.from('bomas').select(COLUMNS).eq('creator_id', user.id).order('created_at', { ascending: false });
      if (category && category !== 'all') query = query.eq('category', category);
      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: data || [] });
    }

    // Public explore — RLS-safe via cookie client
    const auth = await createClient();
    let query = auth.from('bomas').select(COLUMNS).eq('is_public', true).order('created_at', { ascending: false });
    if (category && category !== 'all') query = query.eq('category', category);
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
