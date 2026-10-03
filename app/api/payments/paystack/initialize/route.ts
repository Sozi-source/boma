import { NextResponse } from 'next/server';
import { paystackService, isPaystackLiveConfigured } from '@/lib/paystack/paystack-service';
import { generateReference } from '@/lib/ledger/ledger-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      boma_id,
      amount,
      contributor_name,
      contributor_phone,
      contributor_email,
      is_anonymous,
      note,
      currency = 'KES',
    } = body;

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid contribution amount is required' },
        { status: 400 }
      );
    }

    if (!boma_id) {
      return NextResponse.json(
        { error: 'boma_id is required' },
        { status: 400 }
      );
    }

    // Generate unique verifiable audit reference
    const reference = generateReference('BP');
    const email = contributor_email || `donor-${Date.now()}@bomapay.com`;

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const callbackUrl = `${origin}/bomas/${boma_id}?reference=${reference}&paystack=true`;

    const initResult = await paystackService.initialize({
      email,
      amount: numericAmount,
      currency,
      reference,
      callback_url: callbackUrl,
      metadata: {
        boma_id,
        contributor_name: contributor_name || 'Well-wisher',
        contributor_phone,
        is_anonymous: Boolean(is_anonymous),
        note,
      },
      channels: ['mobile_money', 'card', 'bank'],
    });

    return NextResponse.json({
      status: 'success',
      live: isPaystackLiveConfigured,
      reference,
      authorization_url: initResult.data.authorization_url,
      access_code: initResult.data.access_code,
    });
  } catch (error: unknown) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
