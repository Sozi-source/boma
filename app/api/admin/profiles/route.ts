import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/security/payment-validation';

export const runtime = 'nodejs';

async function getAuthenticatedAccount() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const { data: profile } = await auth.from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .eq('id', user.id).maybeSingle();
  const isAdmin = profile?.role === 'admin';
  return { user, db: isAdmin ? createAdminClient() : auth, profile, isAdmin };
}

export async function GET() {
  try {
    const account = await getAuthenticatedAccount();
    if (!account) return NextResponse.json({ error: 'Sign in to view accounts' }, { status: 401 });

    const { data, error } = account.isAdmin
      ? await account.db.from('profiles').select('id, full_name, email, phone, role, created_at').order('full_name')
      : { data: account.profile ? [account.profile] : [], error: null };
    if (error) throw error;

    const ownProfile = data?.find((profile) => profile.id === account.user.id);
    const ownAccount = ownProfile ?? {
      id: account.user.id,
      full_name: account.user.user_metadata?.full_name || account.user.user_metadata?.name || account.user.email?.split('@')[0] || 'My account',
      email: account.user.email ?? null,
      phone: typeof account.user.user_metadata?.phone === 'string' ? account.user.user_metadata.phone : null,
      role: 'organizer',
      created_at: account.user.created_at,
    };
    const users = account.isAdmin ? (data ?? []) : [ownAccount];
    return NextResponse.json({ users, canManage: account.isAdmin });
  } catch (error) {
    console.error('Admin profile list failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to load accounts' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const account = await getAuthenticatedAccount();
    if (!account) return NextResponse.json({ error: 'Sign in to link a phone' }, { status: 401 });

    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 50) : '';
    if (!userId || !phone) return NextResponse.json({ error: 'Account and phone are required' }, { status: 400 });
    if (!account.isAdmin && userId !== account.user.id) {
      return NextResponse.json({ error: 'Not authorized to update this account' }, { status: 403 });
    }

    const { data, error } = await account.db.from('profiles').update({ phone })
      .eq('id', userId).select('id, full_name, email, phone, role, created_at').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Unable to link phone to account' }, { status: 400 });
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Admin profile update failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to link phone' }, { status: 503 });
  }
}
