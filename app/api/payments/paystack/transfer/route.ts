import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { paystackService, PaystackRecipientError, PaystackTransferError } from '@/lib/paystack/paystack-service';
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
    const phoneDigits = phone?.replace(/\D/g, '') || '';
    const mpesaPhone = phoneDigits.startsWith('254') && phoneDigits.length === 12
      ? `0${phoneDigits.slice(3)}`
      : phoneDigits.length === 9 && /^[17]/.test(phoneDigits)
        ? `0${phoneDigits}`
        : phoneDigits;
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim().slice(0, 500) : '';
    if (recipientType === 'bank') {
      return NextResponse.json({ error: 'Bank payouts are disabled until recipient bank codes are validated against Paystack' }, { status: 400 });
    }
    if (!amount || !/^[0-9a-f-]{36}$/i.test(bomaId) || recipientType !== 'mpesa'
      || !recipientName || !purpose || !phone) {
      return NextResponse.json({ error: 'Invalid payout details' }, { status: 400 });
    }
    if (!/^0[17]\d{8}$/.test(mpesaPhone)) {
      return NextResponse.json({ error: 'Enter a valid Kenyan M-Pesa number, such as +254 7xx xxx xxx.' }, { status: 400 });
    }

    const db = createAdminClient();
    if (!await allowPaymentAttempt(db, 'payout-user', user.id, 5, 3600)) {
      return NextResponse.json({ error: 'Payout request limit reached. Please try again later.' }, { status: 429 });
    }
    const { data: boma, error: bomaError } = await db.from('bomas').select('currency,creator_id').eq('id', bomaId).maybeSingle();
    if (bomaError || !boma) return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    const { data: directSettlement } = await db.from('paystack_subaccounts')
      .select('subaccount_code').eq('creator_id', boma.creator_id).maybeSingle();
    if (directSettlement) {
      return NextResponse.json({ error: 'This organizer receives contributions directly through their Paystack subaccount.' }, { status: 409 });
    }
    if (boma.currency !== 'KES') {
      return NextResponse.json({ error: 'M-Pesa payouts are only available for KES funds.' }, { status: 400 });
    }
    const reference = `WD-${Date.now().toString(36).toUpperCase()}-${randomBytes(12).toString('hex').toUpperCase()}`;
    const { error: reserveError } = await db.rpc('reserve_paystack_payout', {
      p_reference: reference,
      p_boma_id: bomaId,
      p_actor_id: user.id,
      p_amount_minor: Math.round(amount * 100),
      p_currency: boma.currency,
      p_recipient_type: recipientType,
      p_recipient_name: recipientName,
      p_recipient_phone: mpesaPhone,
      p_recipient_bank_name: null,
      p_recipient_account_number: null,
      p_purpose: purpose,
    });
    if (reserveError) {
      if (/insufficient available balance/i.test(reserveError.message)) {
        return NextResponse.json({ error: 'Insufficient fund balance. Refresh the page and try an amount within the available balance.' }, { status: 400 });
      }
      console.warn('Payout reservation denied', reserveError.message);
      return NextResponse.json({ error: 'You are not authorized to request a payout for this fund.' }, { status: 403 });
    }

    let recipient: { recipient_code: string };
    try {
      recipient = await paystackService.createRecipient({
        type: 'mobile_money',
        name: recipientName,
        account_number: mpesaPhone,
        bank_code: 'MPESA',
        currency: boma.currency,
      });
    } catch (error) {
      const { error: releaseError } = await db.rpc('settle_paystack_payout', {
        p_reference: reference, p_outcome: 'failed', p_transfer_code: null,
        p_amount_minor: Math.round(amount * 100), p_currency: boma.currency,
      });
      if (releaseError) {
        console.error('Failed to release recipient validation reservation', reference, releaseError.message);
        return NextResponse.json({ error: 'Payout status is being reconciled. Check the payout status before trying again.' }, { status: 202 });
      }

      const providerMessage = error instanceof Error ? error.message.toLowerCase() : '';
      console.warn('Paystack recipient creation failed', error instanceof PaystackRecipientError ? error.statusCode : 'network', providerMessage);
      if (providerMessage.includes('not configured')) {
        return NextResponse.json({ error: 'Paystack payouts are not configured on the server.' }, { status: 503 });
      }
      if (error instanceof PaystackRecipientError && [401, 403].includes(error.statusCode)) {
        return NextResponse.json({ error: 'Paystack has not enabled transfers for this account. Check your Paystack account settings.' }, { status: 403 });
      }
      if (error instanceof PaystackRecipientError && error.statusCode >= 500) {
        return NextResponse.json({ error: 'Paystack could not verify this number right now. Please try again.' }, { status: 502 });
      }
      if (error instanceof PaystackRecipientError) {
        return NextResponse.json({ error: 'Paystack could not verify this M-Pesa number. Check that it is an active personal Safaricom M-Pesa number and try again.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Could not connect to Paystack to verify this number. Please try again.' }, { status: 502 });
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
    } catch (error) {
      if (error instanceof PaystackTransferError) {
        const { error: releaseError } = await db.rpc('settle_paystack_payout', {
          p_reference: reference, p_outcome: 'failed', p_transfer_code: null,
          p_amount_minor: Math.round(amount * 100), p_currency: boma.currency,
        });
        if (releaseError) {
          console.error('Failed to release rejected payout reservation', reference, releaseError.message);
          return NextResponse.json({ error: 'Payout status is being reconciled. Check the payout status before trying again.' }, { status: 202 });
        }

        const message = /insufficient|not enough|low balance/i.test(error.message)
          ? 'Paystack’s transfer balance is too low. Check your Paystack balance and settlement status, then try again.'
          : 'Paystack could not send this payout. Check the recipient details and payout settings, then try again.';
        console.warn('Paystack rejected payout', error.statusCode, error.message);
        return NextResponse.json({ error: message }, { status: 400 });
      }
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
