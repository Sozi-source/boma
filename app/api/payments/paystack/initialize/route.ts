import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { paystackService } from '@/lib/paystack/paystack-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCurrency, parseMoney, sameOrigin } from '@/lib/security/payment-validation';
import { allowPaymentAttempt } from '@/lib/security/payment-rate-limit';
import { normalizePhoneNumber } from '@/lib/utils/phone';

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
    const phone = normalizePhoneNumber(typeof body.contributor_phone === 'string' ? body.contributor_phone : '');
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : null;
    if (!amount || !Number.isInteger(amount) || currency !== 'KES' || !/^[0-9a-f-]{36}$/i.test(bomaId)) {
      return NextResponse.json({ error: 'Invalid contribution details' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (!/^254[17]\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid Kenyan M-Pesa number.' }, { status: 400 });
    }

    const db = createAdminClient();
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!await allowPaymentAttempt(db, 'init-ip', ip, 10, 60)
      || !await allowPaymentAttempt(db, 'init-email', email, 6, 3600)) {
      return NextResponse.json({ error: 'Too many payment attempts. Please try again later.' }, { status: 429 });
    }
    const { data: boma, error: bomaError } = await db.from('bomas')
      .select('id,currency,status,is_public,creator_id').eq('id', bomaId).maybeSingle();
    if (bomaError || !boma || !boma.is_public || boma.status !== 'active' || boma.currency !== currency) {
      return NextResponse.json({ error: 'This fund is unavailable for contributions' }, { status: 404 });
    }

    const { data: payoutAccount } = await db.from('paystack_subaccounts')
      .select('subaccount_code,status').eq('creator_id', boma.creator_id).maybeSingle();

    let subaccountCode: string | undefined = undefined;
    if (payoutAccount?.subaccount_code && payoutAccount.subaccount_code !== 'primary') {
      try {
        const providerAccount = await paystackService.getSubaccount(payoutAccount.subaccount_code);
        if (providerAccount.active && providerAccount.currency === 'KES') {
          subaccountCode = payoutAccount.subaccount_code;
        }
      } catch (e) {
        console.warn('Subaccount validation bypassed, routing to primary Paystack payout:', e);
      }
    }

    const feePercent = Number(process.env.PAYSTACK_PLATFORM_FEE_PERCENT) || 2.5;
    const amountMinor = Math.round(amount * 100);
    const platformFeeMinor = subaccountCode ? Math.round(amountMinor * feePercent / 100) : 0;

    const reference = `BP-${Date.now().toString(36).toUpperCase()}-${randomBytes(12).toString('hex').toUpperCase()}`;
    const metadata = {
      contributor_name: name || 'Member',
      contributor_email: email,
      contributor_phone: phone,
      is_anonymous: body.is_anonymous === true,
      note,
      provider: 'paystack',
      subaccount_code: subaccountCode || null,
      payout_destination: '4968133-till',
      platform_fee_percent: subaccountCode ? feePercent : 0,
      platform_fee_minor: platformFeeMinor,
    };
    const { error: insertError } = await db.from('payment_intents').insert({
      reference,
      boma_id: bomaId,
      amount_minor: amountMinor,
      currency,
      metadata,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    if (insertError) throw insertError;

    const result = await paystackService.chargeMpesa({
      email,
      amount,
      currency: 'KES',
      reference,
      phone,
      subaccount: subaccountCode,
      platformFeePercent: subaccountCode ? feePercent : undefined,
    });
    if (!result.status || result.data.reference !== reference || result.data.status !== 'pay_offline') {
      throw new Error('Paystack did not start the M-Pesa authorization');
    }

    return NextResponse.json({
      reference,
      display_text: result.data.display_text || 'Check your phone and approve the M-Pesa prompt.',
      platform_fee_percent: feePercent,
    }, { status: 201 });
  } catch (error) {
    console.error('Payment initialization failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: error instanceof Error && error.message === 'Platform commission is not configured'
      ? 'Openhand payment settings are not configured yet.'
      : 'Unable to initialize payment' }, { status: 503 });
  }
}
