export type Currency = 'KES' | 'USD' | 'EUR' | 'UGX' | 'TZS';

export type BomaCategory =
  | 'medical'
  | 'education'
  | 'chama'
  | 'funeral'
  | 'wedding'
  | 'community'
  | 'emergency'
  | 'business'
  | 'family'
  | 'housing'
  | 'food'
  | 'travel'
  | 'religious'
  | 'sports'
  | 'technology'
  | 'other';

export type BomaStatus = 'active' | 'funded' | 'closed' | 'paused';

export type PaymentMethod = 'mpesa' | 'card' | 'bank_transfer' | 'mock_wallet';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export type LedgerEntryType = 'credit' | 'debit';

export type DisbursementStatus = 'pending' | 'approved' | 'disbursed' | 'rejected';

export interface Boma {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: BomaCategory;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  creator_id: string;
  creator_name: string;
  creator_phone?: string;
  status: BomaStatus;
  deadline: string; // ISO date string
  image_url?: string;
  is_public: boolean;
  contributors_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  boma_id: string;
  currency: Currency;
  available_balance: number;
  ledger_balance: number;
  total_received: number;
  total_disbursed: number;
  last_reconciled_at: string;
}

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  boma_id: string;
  entry_type: LedgerEntryType;
  amount: number;
  currency: Currency;
  balance_after: number;
  description: string;
  reference_code: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  boma_id: string;
  reference: string; // e.g. BP-2026-9281A
  idempotency_key: string;
  contributor_name: string;
  contributor_email?: string;
  contributor_phone?: string;
  is_anonymous: boolean;
  amount: number;
  fee: number;
  net_amount: number;
  currency: Currency;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  note?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Disbursement {
  id: string;
  boma_id: string;
  requested_by: string;
  amount: number;
  currency: Currency;
  recipient_type: 'mpesa' | 'bank';
  recipient_phone?: string;
  recipient_bank_name?: string;
  recipient_account_number?: string;
  recipient_name: string;
  purpose: string;
  status: DisbursementStatus;
  reference: string;
  created_at: string;
  disbursed_at?: string;
}

export interface ContributorSummary {
  name: string;
  amount: number;
  currency: Currency;
  is_anonymous: boolean;
  date: string;
  reference: string;
  message?: string;
}

export interface PlatformStats {
  total_volume_kes: number;
  total_contributions: number;
  active_bomas: number;
  successful_payouts: number;
  transparency_score: number; // e.g. 100%
}

export type CommitteeRole = 'chairperson' | 'treasurer' | 'secretary' | 'member';

export interface CommitteeMember {
  id: string;
  name: string;
  phone?: string;
  role: CommitteeRole;
}

export interface Committee {
  boma_id: string;
  members: CommitteeMember[];
  /** Approvals required before a payout executes */
  threshold: number;
}

export type PayoutRequestStatus = 'pending' | 'executed' | 'rejected';

export interface PayoutApproval {
  member_id: string;
  member_name: string;
  decision: 'approve' | 'reject';
  at: string;
}

export interface PayoutRequest {
  id: string;
  boma_id: string;
  amount: number;
  currency: Currency;
  recipient_type: 'mpesa' | 'bank';
  recipient_name: string;
  recipient_phone?: string;
  recipient_bank_name?: string;
  recipient_account_number?: string;
  purpose: string;
  requested_by: string;
  status: PayoutRequestStatus;
  approvals: PayoutApproval[];
  disbursement_reference?: string;
  created_at: string;
}
