import { NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack/paystack-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/security/payment-validation';

export const runtime = 'nodejs';

function platformFeePercent() {
  const value = Number(process.env.PAYSTACK_PLATFORM_FEE_PERCENT);
  if (!Number.isFinite(value) || value <= 0 || value >= 100) throw new Error('Platform commission is not configured');
  return value;
}

export async function GET() {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to view your payout setup.' }, { status: 401 });
    const db = createAdminClient();
    const { data, error } = await db.from('paystack_subaccounts')
      .select('subaccount_code,destination_type,destination_last4,status,created_at')
      .eq('creator_id', user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ account: data ?? null });
  } catch (error) {
    console.error('Paystack subaccount lookup failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to load M-Pesa payout setup.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user || !user.email) return NextResponse.json({ error: 'Sign in with an email address to continue.' }, { status: 401 });

    const body = await request.json();
    const destinationType = body.destination_type;
    const accountNumber = typeof body.account_number === 'string' ? body.account_number.replace(/\s+/g, '') : '';
    const businessName = typeof body.business_name === 'string' ? body.business_name.trim().slice(0, 120) : '';
    const contactName = typeof body.contact_name === 'string' ? body.contact_name.trim().slice(0, 120) : '';
    const contactPhone = typeof body.contact_phone === 'string' ? body.contact_phone.trim().slice(0, 32) : '';
    if (!['mpesa_till', 'mpesa_paybill'].includes(destinationType)
      || !/^\d{5,10}$/.test(accountNumber) || !businessName || !contactName) {
      return NextResponse.json({ error: 'Enter a valid M-Pesa Till or Paybill and organizer details.' }, { status: 400 });
    }
    const db = createAdminClient();
    const { data: existing, error: existingError } = await db.from('paystack_subaccounts')
      .select('subaccount_code,destination_type,destination_last4,status,created_at')
      .eq('creator_id', user.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return NextResponse.json({ error: 'A payout account is already registered. Contact BomaPay support to change it.' }, { status: 409 });

    const feePercent = platformFeePercent();
    const created = await paystackService.createSubaccount({
      businessName,
      accountNumber,
      primaryContactEmail: user.email,
      primaryContactName: contactName,
      primaryContactPhone: contactPhone,
      percentageCharge: feePercent,
    });
    const destinationStatus = created.is_verified ? 'verified' : 'pending_verification';
    const { error: insertError } = await db.from('paystack_subaccounts').insert({
      creator_id: user.id,
      subaccount_code: created.subaccount_code,
      destination_type: destinationType,
      destination_last4: accountNumber.slice(-4),
      status: destinationStatus,
    });
    if (insertError) throw insertError;
    return NextResponse.json({
      account: {
        subaccount_code: created.subaccount_code,
        destination_type: destinationType,
        destination_last4: accountNumber.slice(-4),
        status: destinationStatus,
      },
      platform_fee_percent: feePercent,
    }, { status: 201 });
  } catch (error) {
    console.error('Paystack subaccount creation failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: error instanceof Error && error.message === 'Platform commission is not configured'
      ? 'BomaPay payment settings are not configured yet.'
      : 'Unable to set up the M-Pesa payout account. Please check the details or contact BomaPay support.' }, { status: 503 });
  }
}
