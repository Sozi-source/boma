import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { paystackService } from '@/lib/paystack/paystack-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { parseMoney, sameOrigin } from '@/lib/security/payment-validation';
import { allowPaymentAttempt } from '@/lib/security/payment-rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { data: assurance, error: assuranceError } = await auth.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== 'aal2') {
      return NextResponse.json({ error: 'Multi-factor authentication is required for payouts' }, { status: 403 });
    }

    const body = await request.json();
    const amount = parseMoney(body.amount);
    const bomaId = typeof body.boma_id === 'string' ? body.boma_id : '';
    const recipientType = body.recipient_type;
    const recipientName = typeof body.recipient_name === 'string' ? body.recipient_name.trim().slice(0, 255) : '';
    const phone = typeof body.recipient_phone === 'string' ? body.recipient_phone.trim().slice(0, 50) : null;
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim().slice(0, 500) : '';
    if (recipientType === 'bank') {
      return NextResponse.json({ error: 'Bank payouts are disabled until recipient bank codes are validated against Paystack' }, { status: 400 });
    }
    if (!amount || !/^[0-9a-f-]{36}$/i.test(bomaId) || recipientType !== 'mpesa'
      || !recipientName || !purpose || !phone) {
      return NextResponse.json({ error: 'Invalid payout details' }, { status: 400 });
    }

    const db = createAdminClient();
    if (!await allowPaymentAttempt(db, 'payout-user', user.id, 5, 3600)) {
      return NextResponse.json({ error: 'Payout request limit reached. Please try again later.' }, { status: 429 });
    }
    const { data: boma, error: bomaError } = await db.from('bomas').select('currency').eq('id', bomaId).maybeSingle();
    if (bomaError || !boma) return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    const reference = `WD-${Date.now().toString(36).toUpperCase()}-${randomBytes(12).toString('hex').toUpperCase()}`;
    const { error: reserveError } = await db.rpc('reserve_paystack_payout', {
      p_reference: reference,
      p_boma_id: bomaId,
      p_actor_id: user.id,
      p_amount_minor: Math.round(amount * 100),
      p_currency: boma.currency,
      p_recipient_type: recipientType,
      p_recipient_name: recipientName,
      p_recipient_phone: phone,
      p_recipient_bank_name: null,
      p_recipient_account_number: null,
      p_purpose: purpose,
    });
    if (reserveError) return NextResponse.json({ error: 'Payout is not authorized or funds are unavailable' }, { status: 403 });

    let recipient: { recipient_code: string };
    try {
      recipient = await paystackService.createRecipient({
        type: 'mobile_money',
        name: recipientName,
        account_number: phone,
        bank_code: 'MPESA',
        currency: boma.currency,
      });
    } catch {
      await db.rpc('settle_paystack_payout', {
        p_reference: reference, p_outcome: 'failed', p_transfer_code: null,
        p_amount_minor: Math.round(amount * 100), p_currency: boma.currency,
      });
      return NextResponse.json({ error: 'Recipient could not be validated' }, { status: 502 });
    }

    try {
      const transfer = await paystackService.initiateTransfer({
        recipient_code: recipient.recipient_code,
        amount: Math.round(amount * 100),
        reason: purpose,
        reference,
        currency: boma.currency,
      });
      await db.from('payout_intents').update({ provider_transfer_code: transfer.transfer_code })
        .eq('reference', reference).eq('status', 'pending');
      return NextResponse.json({ status: 'pending', reference }, { status: 202 });
    } catch {
      // The provider may have accepted a transfer before a network timeout. Keep the reservation
      // held for reconciliation rather than risk sending the payout twice.
      console.error('Payout needs provider reconciliation', reference);
      return NextResponse.json({ error: 'Payout status is being reconciled', reference }, { status: 202 });
    }
  } catch (error) {
    console.error('Payout request failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to process payout request' }, { status: 503 });
  }
}
