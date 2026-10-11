import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');
    const bomaId = searchParams.get('id');
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    const admin = createAdminClient();
    let query = admin
      .from('bomas')
      .select('id,group_id,group_name,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at')
      .order('created_at', { ascending: false });

    if (bomaId) {
      query = query.eq('id', bomaId);
    } else if (creatorId) {
      query = query.or(`creator_id.eq.${creatorId},creator_id.eq.42893afe-6c38-42ab-b1e4-a78eca2492de`);
    } else {
      query = query.eq('is_public', true);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (q && q.trim()) {
      query = query.or(`title.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
