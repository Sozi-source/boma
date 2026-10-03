import { NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack/paystack-service';
import { generateReference } from '@/lib/ledger/ledger-service';

/**
 * Dispatches a payout through the Paystack Transfers API. The ledger debit is
 * booked client-side after this succeeds.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = 'KES',
      recipient_name,
      recipient_type,
      recipient_phone,
      recipient_account_number,
      purpose,
    } = body;

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json({ error: 'Valid disbursement amount required' }, { status: 400 });
    }

    const reference = generateReference('WD');

    const recipient = await paystackService.createRecipient({
      type: recipient_type === 'mpesa' ? 'mobile_money' : 'nuban',
      name: recipient_name,
      account_number: recipient_type === 'mpesa' ? recipient_phone : recipient_account_number,
      bank_code: recipient_type === 'mpesa' ? 'MPESA' : '044',
      currency,
    });

    const transfer = await paystackService.initiateTransfer({
      recipient_code: recipient.recipient_code,
      amount: paystackService.toSubUnits(numericAmount),
      reason: purpose || 'Boma Cause Disbursement',
      reference,
      currency,
    });

    return NextResponse.json({ status: 'success', reference, transfer });
  } catch (error: unknown) {
    console.error('Disbursement transfer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Disbursement failed' },
      { status: 500 }
    );
  }
}
