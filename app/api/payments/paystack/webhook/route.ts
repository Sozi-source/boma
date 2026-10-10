import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { paystackService } from '@/lib/paystack/paystack-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { validReference } from '@/lib/security/payment-validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';
  if (!paystackService.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const reference = payload?.data?.transaction_reference
      || payload?.data?.transaction?.reference
      || payload?.data?.reference;
    if (!validReference(reference) && !(typeof reference === 'string' && /^WD-[A-Z0-9-]{8,48}$/.test(reference))) {
      return NextResponse.json({ error: 'Invalid webhook reference' }, { status: 400 });
    }
    const db = createAdminClient();

    if (payload.event === 'charge.success') {
      const { data: intent } = await db.from('payment_intents')
        .select('reference,amount_minor,currency,status,expires_at').eq('reference', reference).maybeSingle();
      if (!intent) return NextResponse.json({ error: 'Unknown payment reference' }, { status: 404 });
      if (intent.status === 'paid') return NextResponse.json({ received: true });
      const verified = await paystackService.verify(reference);
      const payment = verified.data;
      if (!verified.status || payment.status !== 'success' || payment.reference !== reference
        || payment.amount !== Number(intent.amount_minor) || payment.currency !== intent.currency) {
        return NextResponse.json({ error: 'Payment did not match the pending order' }, { status: 409 });
      }
      const { error } = await db.rpc('settle_paystack_payment', {
        p_reference: reference, p_amount_minor: payment.amount, p_currency: payment.currency,
        p_channel: payment.channel, p_provider_transaction_id: String(payment.id),
      });
      if (error) throw error;
    } else if (['transfer.success', 'transfer.failed', 'transfer.reversed'].includes(payload.event)) {
      const transfer = payload.data;
      const { data: intent } = await db.from('payout_intents')
        .select('reference,amount_minor,currency').eq('reference', reference).maybeSingle();
      if (!intent) return NextResponse.json({ error: 'Unknown payout reference' }, { status: 404 });
      const amount = Number(transfer.amount);
      if (amount !== Number(intent.amount_minor) || transfer.currency !== intent.currency) {
        return NextResponse.json({ error: 'Transfer did not match the payout order' }, { status: 409 });
      }
      const outcome = payload.event === 'transfer.success' ? 'success'
        : payload.event === 'transfer.reversed' ? 'reversed' : 'failed';
      const { error } = await db.rpc('settle_paystack_payout', {
        p_reference: reference, p_outcome: outcome,
        p_transfer_code: typeof transfer.transfer_code === 'string' ? transfer.transfer_code : null,
        p_amount_minor: amount, p_currency: transfer.currency,
      });
      if (error) throw error;
    } else if (payload.event === 'refund.processed') {
      const refundId = payload.data?.id;
      const amount = Number(payload.data?.amount);
      const currency = payload.data?.currency;
      if ((typeof refundId !== 'string' && typeof refundId !== 'number')
        || !String(refundId).trim() || String(refundId).length > 120
        || !Number.isSafeInteger(amount) || amount <= 0 || typeof currency !== 'string') {
        return NextResponse.json({ error: 'Invalid refund event' }, { status: 400 });
      }
      // The organizer's share has already settled directly to its Till/Paybill.
      // Clarix bears refund liability; an automatic gross reversal would corrupt
      // the group's net ledger, so persist this for operator review.
      const eventHash = createHash('sha256').update(rawBody).digest('hex');
      const { error } = await db.from('payment_incidents').upsert({
        event_hash: eventHash,
        event_type: payload.event,
        reference,
        details: {
          refund_id: String(refundId),
          amount,
          currency,
          status: 'manual_review_required',
        },
        status: 'open',
      }, { onConflict: 'event_hash', ignoreDuplicates: true });
      if (error) throw error;
      return NextResponse.json({ received: true, requires_review: true });
    } else if (['charge.dispute.create', 'charge.dispute.resolve'].includes(payload.event)) {
      // Persist disputes for operator review: they need a hold/resolution process,
      // and acknowledging them after durable insertion prevents webhook retry storms.
      const eventHash = createHash('sha256').update(rawBody).digest('hex');
      const { error } = await db.from('payment_incidents').upsert({
        event_hash: eventHash,
        event_type: payload.event,
        reference,
        details: {
          amount: Number.isSafeInteger(Number(payload.data?.amount)) ? Number(payload.data.amount) : null,
          currency: typeof payload.data?.currency === 'string' ? payload.data.currency : null,
          status: typeof payload.data?.status === 'string' ? payload.data.status.slice(0, 40) : null,
        },
        status: 'open',
      }, { onConflict: 'event_hash', ignoreDuplicates: true });
      if (error) throw error;
      return NextResponse.json({ received: true, requires_review: true });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook processing failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
