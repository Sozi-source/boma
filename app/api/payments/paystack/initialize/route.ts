import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { paystackService } from '@/lib/paystack/paystack-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCurrency, parseMoney, sameOrigin } from '@/lib/security/payment-validation';
import { allowPaymentAttempt } from '@/lib/security/payment-rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const amount = parseMoney(body.amount);
    const currency = parseCurrency(body.currency);
    const bomaId = typeof body.boma_id === 'string' ? body.boma_id : '';
    const email = typeof body.contributor_email === 'string' ? body.contributor_email.trim().toLowerCase() : '';
    const name = typeof body.contributor_name === 'string' ? body.contributor_name.trim().slice(0, 120) : 'Member';
    const phone = typeof body.contributor_phone === 'string' ? body.contributor_phone.trim().slice(0, 32) : null;
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : null;
    if (!amount || !currency || !/^[0-9a-f-]{36}$/i.test(bomaId)) {
      return NextResponse.json({ error: 'Invalid contribution details' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const db = createAdminClient();
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!await allowPaymentAttempt(db, 'init-ip', ip, 10, 60)
      || !await allowPaymentAttempt(db, 'init-email', email, 6, 3600)) {
      return NextResponse.json({ error: 'Too many payment attempts. Please try again later.' }, { status: 429 });
    }
    const { data: boma, error: bomaError } = await db.from('bomas')
      .select('id,currency,status,is_public').eq('id', bomaId).maybeSingle();
    if (bomaError || !boma || !boma.is_public || boma.status !== 'active' || boma.currency !== currency) {
      return NextResponse.json({ error: 'This fund is unavailable for contributions' }, { status: 404 });
    }

    const reference = `BP-${Date.now().toString(36).toUpperCase()}-${randomBytes(12).toString('hex').toUpperCase()}`;
    const metadata = {
      contributor_name: name || 'Member',
      contributor_email: email,
      contributor_phone: phone,
      is_anonymous: body.is_anonymous === true,
      note,
    };
    const { error: insertError } = await db.from('payment_intents').insert({
      reference,
      boma_id: bomaId,
      amount_minor: Math.round(amount * 100),
      currency,
      metadata,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    if (insertError) throw insertError;

    const appUrl = process.env.APP_URL;
    const appOrigin = appUrl ? new URL(appUrl) : null;
    if (!appOrigin || (appOrigin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(appOrigin.hostname))) {
      throw new Error('APP_URL must be configured with HTTPS');
    }
    const result = await paystackService.initialize({
      email,
      amount,
      currency,
      reference,
      callback_url: `${appOrigin.origin}/bomas/${bomaId}?paystack=true`,
      metadata: { reference },
    });
    if (!result.status || result.data.reference !== reference || !result.data.authorization_url.startsWith('https://')) {
      throw new Error('Payment provider returned an invalid checkout response');
    }

    return NextResponse.json({ reference, authorization_url: result.data.authorization_url }, { status: 201 });
  } catch (error) {
    console.error('Payment initialization failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to initialize payment' }, { status: 503 });
  }
}
