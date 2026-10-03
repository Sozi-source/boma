import { NextResponse } from 'next/server';
import { paystackService, isPaystackLiveConfigured } from '@/lib/paystack/paystack-service';

/**
 * Paystack webhook receiver. Signature is verified in live mode.
 *
 * NOTE: Ledger booking from webhooks needs server-side persistence (Supabase
 * tables). Until the schema is applied, contributions are booked client-side
 * after the checkout redirect verifies the payment.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    if (isPaystackLiveConfigured && !paystackService.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    console.log('Paystack webhook received:', payload.event, payload.data?.reference);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook error' },
      { status: 500 }
    );
  }
}
