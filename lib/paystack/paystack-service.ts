import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

export const isPaystackLiveConfigured = Boolean(
  PAYSTACK_SECRET &&
  !PAYSTACK_SECRET.includes('sample_key') &&
  !PAYSTACK_SECRET.includes('placeholder')
);

export interface PaystackInitParams {
  email: string;
  amount: number; // in standard currency units (e.g. 1000 KES)
  currency?: string; // 'KES', 'USD', 'NGN', etc.
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: string[]; // ['mobile_money', 'card', 'bank']
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
    status: 'success' | 'failed' | 'abandoned';
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
    const subUnits = this.toSubUnits(params.amount);

    if (!isPaystackLiveConfigured) {
      // Sandbox Simulation
      return {
        status: true,
        message: 'Sandbox transaction initialized',
        data: {
          authorization_url: `/bomas?status=success&reference=${params.reference}`,
          access_code: `mock_code_${Math.random().toString(36).substring(2, 9)}`,
          reference: params.reference,
        },
      };
    }

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
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initialize Paystack payment');
    }

    return await res.json();
  }

  /**
   * Verify transaction status with Paystack
   */
  async verify(reference: string): Promise<PaystackVerifyResponse> {
    if (!isPaystackLiveConfigured) {
      // Sandbox Simulation
      return {
        status: true,
        message: 'Sandbox verification successful',
        data: {
          id: Math.floor(Math.random() * 100000),
          status: 'success',
          reference,
          amount: 250000,
          currency: 'KES',
          channel: 'mobile_money',
          paid_at: new Date().toISOString(),
          customer: {
            email: 'contributor@bomapay.com',
            first_name: 'Member',
          },
        },
      };
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: this.getHeaders(),
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
    if (!isPaystackLiveConfigured) {
      return { recipient_code: `RCP_mock_${Math.random().toString(36).substring(2, 8)}` };
    }

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
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      throw new Error(data.message || 'Failed to create Paystack transfer recipient');
    }

    return { recipient_code: data.data.recipient_code };
  }

  /**
   * Initiate automated payout/disbursement to recipient
   */
  async initiateTransfer(params: PaystackTransferParams): Promise<{ transfer_code: string; status: string }> {
    if (!isPaystackLiveConfigured) {
      return {
        transfer_code: `TRF_mock_${Math.random().toString(36).substring(2, 8)}`,
        status: 'success',
      };
    }

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
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      throw new Error(data.message || 'Paystack transfer initiation failed');
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
    if (!PAYSTACK_SECRET || !signature) return false;
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }
}

export const paystackService = new PaystackService();
