import { NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack/paystack-service';

/**
 * Verifies a Paystack transaction. This route only confirms payment with
 * Paystack; the client books the verified amount into the ledger.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });
    }

    const verifyData = await paystackService.verify(reference);

    if (verifyData.data.status !== 'success') {
      return NextResponse.json(
        { error: `Payment status is ${verifyData.data.status}` },
        { status: 402 }
      );
    }

    const metadata = (verifyData.data.metadata || {}) as Record<string, unknown>;

    return NextResponse.json({
      status: 'success',
      reference: verifyData.data.reference,
      amount: paystackService.fromSubUnits(verifyData.data.amount),
      currency: verifyData.data.currency,
      channel: verifyData.data.channel,
      metadata,
      customer: verifyData.data.customer,
    });
  } catch (error: unknown) {
    console.error('Paystack verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
