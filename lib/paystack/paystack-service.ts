import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export class PaystackTransferError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'PaystackTransferError';
  }
}

export class PaystackRecipientError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'PaystackRecipientError';
  }
}
const PAYSTACK_ENV = process.env.NODE_ENV === 'production' ? 'live' : (process.env.PAYSTACK_ENV || 'live');
export const isPaystackLiveConfigured = PAYSTACK_ENV === 'test'
  ? /^sk_test_[A-Za-z0-9]+$/.test(PAYSTACK_SECRET)
  : /^sk_live_[A-Za-z0-9]+$/.test(PAYSTACK_SECRET);

function requirePaystack() {
  if (!isPaystackLiveConfigured) throw new Error('Paystack is not configured');
}

export interface PaystackInitParams {
  email: string;
  amount: number; // in standard currency units (e.g. 1000 KES)
  currency?: string; // 'KES', 'USD', 'NGN', etc.
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: string[]; // ['mobile_money', 'card', 'bank']
}

export interface PaystackMpesaChargeParams {
  email: string;
  amount: number;
  currency: 'KES';
  reference: string;
  phone: string;
  subaccount: string;
  platformFeePercent: number;
}

export interface PaystackSubaccountParams {
  businessName: string;
  accountNumber: string;
  primaryContactEmail: string;
  primaryContactName: string;
  primaryContactPhone?: string;
  percentageCharge: number;
}

export interface PaystackSubaccount {
  subaccount_code: string;
  is_verified: boolean;
  active: boolean;
  currency: string;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number; // in sub-units (e.g. 100000 = 1000 KES)
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      email: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
    };
    metadata?: Record<string, unknown>;
  };
}

export interface PaystackRecipientParams {
  type: 'mobile_money' | 'nuban';
  name: string;
  account_number: string;
  bank_code: string; // 'MPESA' for M-Pesa Kenya
  currency: string;
}

export interface PaystackTransferParams {
  recipient_code: string;
  amount: number; // in sub-units
  reason: string;
  reference: string;
  currency?: string;
}

class PaystackService {
  private getHeaders() {
    return {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Convert standard major units (e.g. KES 500) to Paystack sub-units (50000 cents)
   */
  toSubUnits(amount: number): number {
    return Math.round(Number(amount) * 100);
  }

  /**
   * Convert Paystack sub-units (50000 cents) to standard major units (KES 500)
   */
  fromSubUnits(subUnits: number): number {
    return Number(subUnits) / 100;
  }

  /**
   * Initialize a collection transaction on Paystack
   */
  async initialize(params: PaystackInitParams): Promise<PaystackInitResponse> {
    requirePaystack();
    const subUnits = this.toSubUnits(params.amount);

    const payload = {
      email: params.email,
      amount: subUnits,
      currency: params.currency || 'KES',
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
      channels: params.channels || ['mobile_money', 'card', 'bank'],
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initialize Paystack payment');
    }

    return await res.json();
  }

  async chargeMpesa(params: PaystackMpesaChargeParams): Promise<{
    status: boolean;
    data: { reference: string; status: string; display_text?: string };
  }> {
    requirePaystack();
    const feeMinor = Math.round(this.toSubUnits(params.amount) * params.platformFeePercent / 100);
    const res = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email: params.email,
        amount: this.toSubUnits(params.amount),
        currency: params.currency,
        reference: params.reference,
        mobile_money: { phone: params.phone.startsWith('+') ? params.phone : `+${params.phone}`, provider: 'mpesa' },
        subaccount: params.subaccount,
        transaction_charge: feeMinor,
        bearer: 'account',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json();
    if (!res.ok || !data.status || data.data?.reference !== params.reference) {
      throw new Error(data.message || 'Failed to start M-Pesa payment');
    }
    return data;
  }

  async createSubaccount(params: PaystackSubaccountParams): Promise<PaystackSubaccount> {
    requirePaystack();
    const res = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        business_name: params.businessName,
        settlement_bank: 'MPESA',
        account_number: params.accountNumber,
        percentage_charge: params.percentageCharge,
        primary_contact_email: params.primaryContactEmail,
        primary_contact_name: params.primaryContactName,
        ...(params.primaryContactPhone ? { primary_contact_phone: params.primaryContactPhone } : {}),
        description: 'Boma group contribution settlement',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = await res.json();
    if (!res.ok || !result.status || !result.data?.subaccount_code) {
      throw new Error(result.message || 'Paystack could not create the group subaccount');
    }
    return result.data as PaystackSubaccount;
  }

  async getSubaccount(code: string): Promise<PaystackSubaccount> {
    requirePaystack();
    const res = await fetch(`https://api.paystack.co/subaccount/${encodeURIComponent(code)}`, {
      headers: this.getHeaders(), signal: AbortSignal.timeout(10_000),
    });
    const result = await res.json();
    if (!res.ok || !result.status || !result.data?.subaccount_code) {
      throw new Error(result.message || 'Paystack subaccount could not be verified');
    }
    return result.data as PaystackSubaccount;
  }

  /**
   * Verify transaction status with Paystack
   */
  async verify(reference: string): Promise<PaystackVerifyResponse> {
    requirePaystack();

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Paystack verification query failed');
    }

    return await res.json();
  }

  /**
   * Create a transfer recipient for automated payouts/disbursements
   */
  async createRecipient(params: PaystackRecipientParams): Promise<{ recipient_code: string }> {
    requirePaystack();

    const res = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        type: params.type,
        name: params.name,
        account_number: params.account_number,
        bank_code: params.bank_code,
        currency: params.currency || 'KES',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      throw new PaystackRecipientError(data.message || 'Failed to create Paystack transfer recipient', res.status);
    }

    return { recipient_code: data.data.recipient_code };
  }

  /**
   * Initiate automated payout/disbursement to recipient
   */
  async initiateTransfer(params: PaystackTransferParams): Promise<{ transfer_code: string; status: string }> {
    requirePaystack();

    const res = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        source: 'balance',
        amount: params.amount,
        recipient: params.recipient_code,
        reason: params.reason,
        reference: params.reference,
        currency: params.currency || 'KES',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();
    if (res.status >= 500) {
      throw new Error('Paystack transfer status could not be confirmed');
    }
    if (!res.ok || !data.status) {
      throw new PaystackTransferError(data.message || 'Paystack transfer initiation failed', res.status);
    }

    return {
      transfer_code: data.data.transfer_code,
      status: data.data.status,
    };
  }

  /**
   * Verify Paystack Webhook HMAC Signature
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!PAYSTACK_SECRET || !/^[a-f0-9]{128}$/i.test(signature)) return false;
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'));
  }
}

export const paystackService = new PaystackService();
