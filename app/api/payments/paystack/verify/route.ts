import { NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack/paystack-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { sameOrigin, validReference } from '@/lib/security/payment-validation';
import { allowPaymentAttempt } from '@/lib/security/payment-rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const reference: unknown = body.reference;
    if (!validReference(reference)) return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 });

    const db = createAdminClient();
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!await allowPaymentAttempt(db, 'verify-ip', ip, 30, 60)
      || !await allowPaymentAttempt(db, 'verify-ref', reference, 5, 60)) {
      return NextResponse.json({ error: 'Too many verification attempts. Please try again later.' }, { status: 429 });
    }
    const { data: intent, error } = await db.from('payment_intents')
      .select('reference,boma_id,amount_minor,currency,metadata,status,refunded_minor')
      .eq('reference', reference).maybeSingle();
    if (error || !intent) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (intent.status === 'paid') {
      const refundStatus = Number(intent.refunded_minor) >= Number(intent.amount_minor)
        ? 'refunded'
        : Number(intent.refunded_minor) > 0 ? 'partially_refunded' : 'success';
      return NextResponse.json({ status: refundStatus, reference });
    }
    if (intent.status !== 'pending') {
      return NextResponse.json({ error: 'Payment is no longer pending' }, { status: 409 });
    }

    const payment = await paystackService.verify(reference);
    const data = payment.data;
    if (!payment.status || data.status !== 'success') {
      return NextResponse.json({ error: 'Payment has not succeeded' }, { status: 402 });
    }
    if (data.reference !== intent.reference || data.amount !== Number(intent.amount_minor) || data.currency !== intent.currency) {
      console.error('Payment verification mismatch', reference);
      return NextResponse.json({ error: 'Payment details did not match the order' }, { status: 409 });
    }

    const { error: settleError } = await db.rpc('settle_paystack_payment', {
      p_reference: reference,
      p_amount_minor: data.amount,
      p_currency: data.currency,
      p_channel: data.channel,
      p_provider_transaction_id: String(data.id),
    });
    if (settleError) throw settleError;
    return NextResponse.json({ status: 'success', reference });
  } catch (error) {
    console.error('Payment verification failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to verify payment' }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  if (!validReference(reference)) {
    return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const { data: intent, error } = await db.from('payment_intents')
      .select('reference,boma_id,amount_minor,currency,metadata,status,refunded_minor')
      .eq('reference', reference).maybeSingle();

    if (error || !intent) {
      return NextResponse.json({ error: 'Payment intent not found in database' }, { status: 404 });
    }

    if (intent.status === 'pending') {
      const payment = await paystackService.verify(reference);
      const data = payment.data;
      if (!payment.status || data.status !== 'success') {
        return NextResponse.json({ error: 'Payment has not succeeded on Paystack' }, { status: 402 });
      }

      if (data.reference !== intent.reference || data.amount !== Number(intent.amount_minor) || data.currency !== intent.currency) {
        return NextResponse.json({ error: 'Payment details did not match the order' }, { status: 409 });
      }

      const { error: settleError } = await db.rpc('settle_paystack_payment', {
        p_reference: reference,
        p_amount_minor: data.amount,
        p_currency: data.currency,
        p_channel: data.channel,
        p_provider_transaction_id: String(data.id),
      });

      if (settleError) throw settleError;
    }

    const redirectUrl = new URL(`/bomas/${intent.boma_id}?paystack=true`, request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Direct verification failed:', err);
    return NextResponse.json({
      error: 'Verification failed',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}

