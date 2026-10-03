import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next') ?? '/dashboard';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\')
    ? requestedNext
    : '/dashboard';
  const appOrigin = process.env.APP_URL || (process.env.NODE_ENV === 'production' ? null : new URL(request.url).origin);
  if (!appOrigin) return NextResponse.json({ error: 'Application URL is not configured' }, { status: 503 });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, appOrigin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth-code-error', appOrigin));
}
