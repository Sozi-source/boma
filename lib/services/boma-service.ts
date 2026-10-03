import { 
  Boma, 
  Account, 
  Transaction, 
  LedgerEntry, 
  Disbursement, 
  BomaCategory, 
  Currency, 
  PaymentMethod,
  PlatformStats,
  Committee,
  CommitteeRole,
  PayoutRequest
} from '../types/fintech';
import { generateReference, createIdempotencyKey } from '../ledger/ledger-service';
import { createClient, isSupabaseConfigured } from '../supabase/client';

// Clean initial stores (all dummy data purged)
const INITIAL_BOMAS: Boma[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_LEDGER: LedgerEntry[] = [];
const INITIAL_ACCOUNTS: Account[] = [];
const INITIAL_DISBURSEMENTS: Disbursement[] = [];
const INITIAL_COMMITTEES: Committee[] = [];
const INITIAL_PAYOUT_REQUESTS: PayoutRequest[] = [];

// LocalStorage Keys for client persistence (v3 clean slate)
const STORAGE_KEYS = {
  BOMAS: 'bomapay_bomas_v3',
  ACCOUNTS: 'bomapay_accounts_v3',
  TRANSACTIONS: 'bomapay_transactions_v3',
  LEDGER: 'bomapay_ledger_v3',
  DISBURSEMENTS: 'bomapay_disbursements_v3',
  COMMITTEES: 'bomapay_committees_v3',
  PAYOUT_REQUESTS: 'bomapay_payout_requests_v3',
};

class BomaService {
  constructor() {
    if (typeof window !== 'undefined') {
      // Purge all legacy storage keys and any user-created bomas from previous test sessions
      const legacyKeys = [
        'bomapay_bomas_v1', 'bomapay_accounts_v1', 'bomapay_transactions_v1',
        'bomapay_ledger_v1', 'bomapay_disbursements_v1', 'bomapay_committees_v1', 'bomapay_payout_requests_v1',
        'bomapay_bomas_v2', 'bomapay_accounts_v2', 'bomapay_transactions_v2',
        'bomapay_ledger_v2', 'bomapay_disbursements_v2', 'bomapay_committees_v2', 'bomapay_payout_requests_v2',
      ];
      legacyKeys.forEach((key) => {
        try { localStorage.removeItem(key); } catch {}
      });
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private getStore<T>(key: string, initialData: T[]): T[] {
    if (!this.isBrowser()) return initialData;
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
      }
      return JSON.parse(item);
    } catch {
      return initialData;
    }
  }

  private setStore<T>(key: string, data: T[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to persist ${key}:`, e);
    }
  }

  async getCurrentUser(): Promise<{ id: string; name: string; phone?: string; email?: string }> {
    if (this.isBrowser()) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Organizer',
            email: user.email,
            phone: user.user_metadata?.phone,
          };
        }
      } catch { /* Auth provider unavailable: no authenticated user. */ }
    }
    return { id: 'user-guest', name: 'Boma Organizer' };
  }

  // --- BOMA OPERATIONS ---

  async getBomas(options?: { category?: BomaCategory | 'all'; query?: string }): Promise<Boma[]> {
    if (this.isBrowser() && isSupabaseConfigured) {
      const supabase = createClient();
      let query = supabase.from('bomas').select('id,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at').eq('is_public', true).order('created_at', { ascending: false });
      if (options?.category && options.category !== 'all') query = query.eq('category', options.category);
      if (options?.query?.trim()) query = query.or(`title.ilike.%${options.query.trim()}%,description.ilike.%${options.query.trim()}%`);
      const { data, error } = await query;
      if (error) throw new Error('Unable to load funds');
      return (data || []) as Boma[];
    }
    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    let filtered = [...bomas];

    if (options?.category && options.category !== 'all') {
      filtered = filtered.filter((b) => b.category === options.category);
    }

    if (options?.query && options.query.trim().length > 0) {
      const q = options.query.toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.creator_name.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getBomaById(id: string): Promise<{ boma: Boma; account: Account } | null> {
    if (this.isBrowser() && isSupabaseConfigured && /^[0-9a-f-]{36}$/i.test(id)) {
      const supabase = createClient();
      const [{ data: boma, error: bomaError }, { data: account, error: accountError }] = await Promise.all([
        supabase.from('bomas').select('id,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at').eq('id', id).maybeSingle(),
        supabase.from('accounts').select('*').eq('boma_id', id).maybeSingle(),
      ]);
      if (bomaError || accountError) throw new Error('Unable to load fund data');
      if (!boma) return null;
      if (!account) throw new Error('Fund account is not available');
      return { boma: boma as Boma, account: account as Account };
    }
    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    const boma = bomas.find((b) => b.id === id);
    if (!boma) return null;

    const accounts = this.getStore<Account>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    let account = accounts.find((a) => a.boma_id === id);

    if (!account) {
      // Auto-create account if missing
      account = {
        id: `acc-${Date.now()}`,
        boma_id: id,
        currency: boma.currency,
        available_balance: boma.current_amount,
        ledger_balance: boma.current_amount,
        total_received: boma.current_amount,
        total_disbursed: 0,
        last_reconciled_at: new Date().toISOString(),
      };
      this.setStore(STORAGE_KEYS.ACCOUNTS, [...accounts, account]);
    }

    return { boma, account };
  }

  async getBomaWithAccount(id: string): Promise<{ boma: Boma; account: Account } | null> {
    return this.getBomaById(id);
  }

  async createBoma(data: {
    title: string;
    description: string;
    category: BomaCategory;
    target_amount: number;
    currency: Currency;
    deadlineDays: number;
    creator_name: string;
    creator_phone?: string;
    image_url?: string;
  }): Promise<Boma> {
    const activeUser = await this.getCurrentUser();
    if (activeUser.id === 'user-guest' || !isSupabaseConfigured) {
      throw new Error('Sign in with a configured account to create a fund.');
    }
    const supabase = createClient();
    const creatorId = activeUser.id;
    const creatorName = data.creator_name || activeUser.name;
    const creatorPhone = data.creator_phone || activeUser.phone;

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const deadline = new Date(Date.now() + data.deadlineDays * 24 * 60 * 60 * 1000).toISOString();

    const newBoma = {
      title: data.title,
      slug: `${slug}-${Math.random().toString(36).substring(2, 5)}`,
      description: data.description,
      category: data.category,
      target_amount: Number(data.target_amount),
      current_amount: 0,
      currency: data.currency,
      creator_id: creatorId,
      creator_name: creatorName,
      creator_phone: creatorPhone,
      status: 'active',
      deadline,
      image_url: data.image_url && data.image_url.trim() ? data.image_url.trim() : undefined,
      is_public: true,
      contributors_count: 0,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: stored, error } = await supabase.from('bomas').insert({
      ...newBoma, current_amount: 0, is_public: true, contributors_count: 0, verified: false,
    }).select('id,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at').single();
    if (error || !stored) throw new Error('Unable to create fund. Please check your sign-in and try again.');
    return stored as Boma;
  }

  async deleteBoma(bomaId: string): Promise<boolean> {
    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, []).filter((b) => b.id !== bomaId);
    const accounts = this.getStore<Account>(STORAGE_KEYS.ACCOUNTS, []).filter((a) => a.boma_id !== bomaId);
    const transactions = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, []).filter((t) => t.boma_id !== bomaId);
    const ledger = this.getStore<LedgerEntry>(STORAGE_KEYS.LEDGER, []).filter((l) => l.boma_id !== bomaId);
    const disbursements = this.getStore<Disbursement>(STORAGE_KEYS.DISBURSEMENTS, []).filter((d) => d.boma_id !== bomaId);
    const committees = this.getStore<Committee>(STORAGE_KEYS.COMMITTEES, []).filter((c) => c.boma_id !== bomaId);
    const payoutRequests = this.getStore<PayoutRequest>(STORAGE_KEYS.PAYOUT_REQUESTS, []).filter((r) => r.boma_id !== bomaId);

    this.setStore(STORAGE_KEYS.BOMAS, bomas);
    this.setStore(STORAGE_KEYS.ACCOUNTS, accounts);
    this.setStore(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.setStore(STORAGE_KEYS.LEDGER, ledger);
    this.setStore(STORAGE_KEYS.DISBURSEMENTS, disbursements);
    this.setStore(STORAGE_KEYS.COMMITTEES, committees);
    this.setStore(STORAGE_KEYS.PAYOUT_REQUESTS, payoutRequests);

    if (this.isBrowser() && isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.from('bomas').delete().eq('id', bomaId);
      } catch {}
    }

    return true;
  }

  async purgeAllData(): Promise<void> {
    if (!this.isBrowser()) return;
    Object.values(STORAGE_KEYS).forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
  }

  // --- CONTRIBUTION (FINTECH LEDGER PROCESSOR) ---

  async contribute(payload: {
    boma_id: string;
    amount: number;
    contributor_name: string;
    contributor_phone?: string;
    contributor_email?: string;
    is_anonymous: boolean;
    payment_method: PaymentMethod;
    note?: string;
    /** External payment reference (e.g. Paystack). Booked at most once. */
    reference?: string;
  }): Promise<{ transaction: Transaction; ledgerEntry: LedgerEntry }> {
    const amount = Number(payload.amount);
    if (amount <= 0) {
      throw new Error('Contribution amount must be greater than zero.');
    }

    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    const bomaIndex = bomas.findIndex((b) => b.id === payload.boma_id);
    if (bomaIndex === -1) {
      throw new Error('Target fund does not exist.');
    }

    if (payload.reference) {
      const existingTxns = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
      const existing = existingTxns.find((t) => t.reference === payload.reference);
      if (existing) {
        const existingLedger = this.getStore<LedgerEntry>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
        const entry = existingLedger.find((l) => l.transaction_id === existing.id);
        if (entry) return { transaction: existing, ledgerEntry: entry };
      }
    }

    const boma = bomas[bomaIndex];
    const reference = payload.reference || generateReference('BP');
    const idempotencyKey = createIdempotencyKey(
      boma.id, 
      payload.contributor_phone || payload.contributor_email || payload.contributor_name, 
      amount
    );

    const transactionId = `txn-${Date.now()}`;
    const ledgerId = `ledger-${Date.now()}`;

    // 1. Transaction record
    const newTransaction: Transaction = {
      id: transactionId,
      boma_id: boma.id,
      reference,
      idempotency_key: idempotencyKey,
      contributor_name: payload.contributor_name || 'Member',
      contributor_phone: payload.contributor_phone,
      contributor_email: payload.contributor_email,
      is_anonymous: payload.is_anonymous,
      amount,
      fee: 0,
      net_amount: amount,
      currency: boma.currency,
      payment_method: payload.payment_method,
      status: 'completed',
      note: payload.note,
      created_at: new Date().toISOString(),
    };

    // 2. Double-entry Ledger Credit Record
    const accounts = this.getStore<Account>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    let account = accounts.find((a) => a.boma_id === boma.id);
    const prevBalance = account ? Number(account.available_balance) : 0;
    const newBalance = prevBalance + amount;

    const newLedgerEntry: LedgerEntry = {
      id: ledgerId,
      transaction_id: transactionId,
      boma_id: boma.id,
      entry_type: 'credit',
      amount,
      currency: boma.currency,
      balance_after: newBalance,
      description: payload.is_anonymous 
        ? `Anonymous contribution via ${payload.payment_method.toUpperCase()}`
        : `Contribution from ${payload.contributor_name} via ${payload.payment_method.toUpperCase()}`,
      reference_code: reference,
      created_at: new Date().toISOString(),
    };

    // 3. Update Account
    if (account) {
      account.available_balance = newBalance;
      account.ledger_balance = newBalance;
      account.total_received = (Number(account.total_received) || 0) + amount;
      account.last_reconciled_at = new Date().toISOString();
    } else {
      account = {
        id: `acc-${Date.now()}`,
        boma_id: boma.id,
        currency: boma.currency,
        available_balance: newBalance,
        ledger_balance: newBalance,
        total_received: newBalance,
        total_disbursed: 0,
        last_reconciled_at: new Date().toISOString(),
      };
      accounts.push(account);
    }

    // 4. Update Boma total
    boma.current_amount = Number(boma.current_amount) + amount;
    boma.contributors_count = Number(boma.contributors_count) + 1;
    boma.updated_at = new Date().toISOString();

    // Persist all stores atomically
    const transactions = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const ledger = this.getStore<LedgerEntry>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);

    this.setStore(STORAGE_KEYS.BOMAS, bomas);
    this.setStore(STORAGE_KEYS.ACCOUNTS, accounts);
    this.setStore(STORAGE_KEYS.TRANSACTIONS, [newTransaction, ...transactions]);
    this.setStore(STORAGE_KEYS.LEDGER, [newLedgerEntry, ...ledger]);

    return { transaction: newTransaction, ledgerEntry: newLedgerEntry };
  }

  // --- DISBURSEMENT / WITHDRAWAL FLOW ---

  async disburse(payload: {
    boma_id: string;
    amount: number;
    recipient_type: 'mpesa' | 'bank';
    recipient_phone?: string;
    recipient_bank_name?: string;
    recipient_account_number?: string;
    recipient_name: string;
    purpose: string;
  }): Promise<Disbursement> {
    const amount = Number(payload.amount);
    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    const boma = bomas.find((b) => b.id === payload.boma_id);
    if (!boma) throw new Error('Boma not found');

    const accounts = this.getStore<Account>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const account = accounts.find((a) => a.boma_id === payload.boma_id);
    if (!account) throw new Error('Account balance not found');

    if (amount > account.available_balance) {
      throw new Error(`Insufficient funds: requested ${amount} exceeds available balance of ${account.available_balance}`);
    }

    const reference = generateReference('WD');
    const disbursementId = `disb-${Date.now()}`;
    const ledgerId = `ledger-${Date.now()}`;
    const newBalance = account.available_balance - amount;

    // 1. Disbursement record
    const newDisbursement: Disbursement = {
      id: disbursementId,
      boma_id: boma.id,
      requested_by: boma.creator_name,
      amount,
      currency: boma.currency,
      recipient_type: payload.recipient_type,
      recipient_phone: payload.recipient_phone,
      recipient_bank_name: payload.recipient_bank_name,
      recipient_account_number: payload.recipient_account_number,
      recipient_name: payload.recipient_name,
      purpose: payload.purpose,
      status: 'disbursed',
      reference,
      created_at: new Date().toISOString(),
      disbursed_at: new Date().toISOString(),
    };

    // 2. Ledger Debit Entry
    const newLedgerEntry: LedgerEntry = {
      id: ledgerId,
      transaction_id: disbursementId,
      boma_id: boma.id,
      entry_type: 'debit',
      amount,
      currency: boma.currency,
      balance_after: newBalance,
      description: `Disbursement to ${payload.recipient_name} for "${payload.purpose}"`,
      reference_code: reference,
      created_at: new Date().toISOString(),
    };

    // 3. Update Account
    account.available_balance = newBalance;
    account.ledger_balance = newBalance;
    account.total_disbursed = (Number(account.total_disbursed) || 0) + amount;
    account.last_reconciled_at = new Date().toISOString();

    // Persist
    const disbursements = this.getStore<Disbursement>(STORAGE_KEYS.DISBURSEMENTS, INITIAL_DISBURSEMENTS);
    const ledger = this.getStore<LedgerEntry>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);

    this.setStore(STORAGE_KEYS.ACCOUNTS, accounts);
    this.setStore(STORAGE_KEYS.DISBURSEMENTS, [newDisbursement, ...disbursements]);
    this.setStore(STORAGE_KEYS.LEDGER, [newLedgerEntry, ...ledger]);

    return newDisbursement;
  }

  // --- AUDIT & TRANSPARENCY QUERIES ---

  async getBomaTransactions(bomaId: string): Promise<Transaction[]> {
    if (this.isBrowser() && isSupabaseConfigured && /^[0-9a-f-]{36}$/i.test(bomaId)) {
      const supabase = createClient();
      const { data, error } = await supabase.from('transactions').select('*').eq('boma_id', bomaId).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []) as Transaction[];
    }
    const transactions = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    return transactions.filter((t) => t.boma_id === bomaId);
  }

  async getBomaLedger(bomaId: string): Promise<LedgerEntry[]> {
    if (this.isBrowser() && isSupabaseConfigured && /^[0-9a-f-]{36}$/i.test(bomaId)) {
      const supabase = createClient();
      const { data, error } = await supabase.from('ledger_entries').select('*').eq('boma_id', bomaId).order('created_at', { ascending: false });
      if (error) throw new Error('Unable to load ledger');
      return (data || []) as LedgerEntry[];
    }
    const ledger = this.getStore<LedgerEntry>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
    return ledger
      .filter((l) => l.boma_id === bomaId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getBomaDisbursements(bomaId: string): Promise<Disbursement[]> {
    if (this.isBrowser() && isSupabaseConfigured && /^[0-9a-f-]{36}$/i.test(bomaId)) {
      const supabase = createClient();
      const { data, error } = await supabase.from('disbursements').select('*').eq('boma_id', bomaId).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []) as Disbursement[];
    }
    const disbursements = this.getStore<Disbursement>(STORAGE_KEYS.DISBURSEMENTS, INITIAL_DISBURSEMENTS);
    return disbursements
      .filter((d) => d.boma_id === bomaId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getPlatformStats(): Promise<PlatformStats> {
    if (this.isBrowser() && isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const [{ data: bomas }, { data: disbursements }, { count: txCount }] = await Promise.all([
          supabase.from('bomas').select('current_amount, contributors_count, status').eq('is_public', true),
          supabase.from('disbursements').select('id'),
          supabase.from('transactions').select('*', { count: 'exact', head: true }),
        ]);

        const list = bomas || [];
        const totalVolume = list.reduce((acc, b) => acc + (Number(b.current_amount) || 0), 0);
        const totalCount = list.reduce((acc, b) => acc + (Number(b.contributors_count) || 0), 0);

        return {
          total_volume_kes: totalVolume,
          total_contributions: totalCount || txCount || 0,
          active_bomas: list.filter((b) => b.status === 'active').length,
          successful_payouts: disbursements?.length || 0,
          transparency_score: 100,
        };
      } catch (err) {
        console.warn('Failed to query Supabase platform stats:', err);
      }
    }

    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    const transactions = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const disbursements = this.getStore<Disbursement>(STORAGE_KEYS.DISBURSEMENTS, INITIAL_DISBURSEMENTS);

    const totalVolume = bomas.reduce((acc, b) => acc + Number(b.current_amount), 0);
    const totalCount = bomas.reduce((acc, b) => acc + Number(b.contributors_count), 0);

    return {
      total_volume_kes: totalVolume,
      total_contributions: totalCount || transactions.length,
      active_bomas: bomas.filter((b) => b.status === 'active').length,
      successful_payouts: disbursements.length,
      transparency_score: 100,
    };
  }

  /**
   * Dispatch funds via Paystack Transfers, then book the ledger debit.
   * The debit is only booked if the transfer call succeeds.
   */
  async payout(payload: {
    boma_id: string;
    amount: number;
    recipient_type: 'mpesa' | 'bank';
    recipient_phone?: string;
    recipient_bank_name?: string;
    recipient_account_number?: string;
    recipient_name: string;
    purpose: string;
  }): Promise<Disbursement> {
    const found = await this.getBomaById(payload.boma_id);
    if (!found) throw new Error('Boma not found');
    const res = await fetch('/api/payments/paystack/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, currency: found.boma.currency }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Paystack transfer failed');
    }

    const result = await res.json();
    return {
      id: result.reference,
      boma_id: payload.boma_id,
      requested_by: found.boma.creator_name,
      amount: payload.amount,
      currency: found.boma.currency,
      recipient_type: payload.recipient_type,
      recipient_phone: payload.recipient_phone,
      recipient_bank_name: payload.recipient_bank_name,
      recipient_account_number: payload.recipient_account_number,
      recipient_name: payload.recipient_name,
      purpose: payload.purpose,
      status: 'pending',
      reference: result.reference,
      created_at: new Date().toISOString(),
    };
  }

  // --- GOVERNANCE: COMMITTEE & MULTI-SIG PAYOUTS ---

  async getCommittee(bomaId: string): Promise<Committee> {
    const all = this.getStore<Committee>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
    return all.find((c) => c.boma_id === bomaId) || { boma_id: bomaId, members: [], threshold: 1 };
  }

  private saveCommittee(committee: Committee): void {
    const all = this.getStore<Committee>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES).filter(
      (c) => c.boma_id !== committee.boma_id
    );
    this.setStore(STORAGE_KEYS.COMMITTEES, [...all, committee]);
  }

  async addCommitteeMember(
    bomaId: string,
    member: { name: string; phone?: string; role: CommitteeRole }
  ): Promise<Committee> {
    const committee = await this.getCommittee(bomaId);
    committee.members.push({ id: `mem-${Date.now()}`, ...member });
    this.saveCommittee(committee);
    return committee;
  }

  async removeCommitteeMember(bomaId: string, memberId: string): Promise<Committee> {
    const committee = await this.getCommittee(bomaId);
    committee.members = committee.members.filter((m) => m.id !== memberId);
    committee.threshold = Math.max(1, Math.min(committee.threshold, committee.members.length || 1));
    this.saveCommittee(committee);
    return committee;
  }

  async setApprovalThreshold(bomaId: string, threshold: number): Promise<Committee> {
    const committee = await this.getCommittee(bomaId);
    committee.threshold = Math.max(1, Math.min(threshold, committee.members.length || 1));
    this.saveCommittee(committee);
    return committee;
  }

  /** True when payouts must go through committee approval */
  async requiresApproval(bomaId: string): Promise<boolean> {
    const c = await this.getCommittee(bomaId);
    return c.members.length >= 2 && c.threshold >= 2;
  }

  async getPayoutRequests(bomaId: string): Promise<PayoutRequest[]> {
    return this.getStore<PayoutRequest>(STORAGE_KEYS.PAYOUT_REQUESTS, INITIAL_PAYOUT_REQUESTS)
      .filter((r) => r.boma_id === bomaId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async requestPayout(payload: {
    boma_id: string;
    amount: number;
    recipient_type: 'mpesa' | 'bank';
    recipient_name: string;
    recipient_phone?: string;
    recipient_bank_name?: string;
    recipient_account_number?: string;
    purpose: string;
  }): Promise<PayoutRequest> {
    const found = await this.getBomaById(payload.boma_id);
    if (!found) throw new Error('Boma not found');
    if (payload.amount > found.account.available_balance) {
      throw new Error('Requested amount exceeds available balance');
    }
    const user = await this.getCurrentUser();
    const request: PayoutRequest = {
      id: `payreq-${Date.now()}`,
      ...payload,
      currency: found.boma.currency,
      requested_by: user.name,
      status: 'pending',
      approvals: [],
      created_at: new Date().toISOString(),
    };
    const all = this.getStore<PayoutRequest>(STORAGE_KEYS.PAYOUT_REQUESTS, INITIAL_PAYOUT_REQUESTS);
    this.setStore(STORAGE_KEYS.PAYOUT_REQUESTS, [request, ...all]);
    return request;
  }

  /**
   * Record a committee member's decision. Executes the payout (debit ledger
   * entry) automatically once the approval threshold is reached.
   */
  async decidePayout(
    requestId: string,
    memberId: string,
    decision: 'approve' | 'reject'
  ): Promise<PayoutRequest> {
    const all = this.getStore<PayoutRequest>(STORAGE_KEYS.PAYOUT_REQUESTS, INITIAL_PAYOUT_REQUESTS);
    const req = all.find((r) => r.id === requestId);
    if (!req) throw new Error('Payout request not found');
    if (req.status !== 'pending') throw new Error(`Request already ${req.status}`);

    const committee = await this.getCommittee(req.boma_id);
    const member = committee.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Only committee members can vote');
    if (req.approvals.some((a) => a.member_id === memberId)) {
      throw new Error('You have already voted on this request');
    }

    req.approvals.push({
      member_id: member.id,
      member_name: member.name,
      decision,
      at: new Date().toISOString(),
    });

    const approvals = req.approvals.filter((a) => a.decision === 'approve').length;
    const rejections = req.approvals.filter((a) => a.decision === 'reject').length;
    const maxPossible = committee.members.length - rejections;

    if (approvals >= committee.threshold) {
      const disbursement = await this.payout({
        boma_id: req.boma_id,
        amount: req.amount,
        recipient_type: req.recipient_type,
        recipient_name: req.recipient_name,
        recipient_phone: req.recipient_phone,
        recipient_bank_name: req.recipient_bank_name,
        recipient_account_number: req.recipient_account_number,
        purpose: `${req.purpose} (approved ${approvals}/${committee.members.length})`,
      });
      req.status = 'executed';
      req.disbursement_reference = disbursement.reference;
    } else if (maxPossible < committee.threshold) {
      req.status = 'rejected';
    }

    this.setStore(STORAGE_KEYS.PAYOUT_REQUESTS, all);
    return req;
  }
}

export const bomaService = new BomaService();
