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
  PayoutRequest,
  UserProfile,
  UserRole,
  UserStatus,
  SignupRequest,
  Subaccount
} from '../types/fintech';
import { generateReference, createIdempotencyKey } from '../ledger/ledger-service';
import { createClient, isSupabaseConfigured } from '../supabase/client';
import { normalizePhoneNumber, phoneListIncludes } from '../utils/phone';

// Clean initial stores (all dummy data purged)
const INITIAL_USERS: UserProfile[] = [];
const INITIAL_SIGNUP_REQUESTS: SignupRequest[] = [];
const INITIAL_BOMAS: Boma[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_LEDGER: LedgerEntry[] = [];
const INITIAL_ACCOUNTS: Account[] = [];
const INITIAL_DISBURSEMENTS: Disbursement[] = [];
const INITIAL_COMMITTEES: Committee[] = [];
const INITIAL_PAYOUT_REQUESTS: PayoutRequest[] = [];
const INITIAL_SUBACCOUNTS: Subaccount[] = [];

// LocalStorage Keys for client persistence (v4 production clean slate)
const STORAGE_KEYS = {
  BOMAS: 'bomapay_bomas_v4',
  ACCOUNTS: 'bomapay_accounts_v4',
  TRANSACTIONS: 'bomapay_transactions_v4',
  LEDGER: 'bomapay_ledger_v4',
  DISBURSEMENTS: 'bomapay_disbursements_v4',
  COMMITTEES: 'bomapay_committees_v4',
  PAYOUT_REQUESTS: 'bomapay_payout_requests_v4',
  USERS: 'bomapay_users_v4',
  SIGNUP_REQUESTS: 'bomapay_signup_requests_v4',
  SUBACCOUNTS: 'bomapay_subaccounts_v4',
};

class BomaService {
  constructor() {
    if (typeof window !== 'undefined') {
      // Purge all legacy storage keys and mock data from previous test sessions
      const legacyKeys = [
        'bomapay_bomas_v1', 'bomapay_accounts_v1', 'bomapay_transactions_v1',
        'bomapay_ledger_v1', 'bomapay_disbursements_v1', 'bomapay_committees_v1', 'bomapay_payout_requests_v1',
        'bomapay_bomas_v2', 'bomapay_accounts_v2', 'bomapay_transactions_v2',
        'bomapay_ledger_v2', 'bomapay_disbursements_v2', 'bomapay_committees_v2', 'bomapay_payout_requests_v2',
        'bomapay_bomas_v3', 'bomapay_accounts_v3', 'bomapay_transactions_v3',
        'bomapay_ledger_v3', 'bomapay_disbursements_v3', 'bomapay_committees_v3', 'bomapay_payout_requests_v3',
        'bomapay_users_v3', 'bomapay_signup_requests_v3', 'bomapay_subaccounts_v3',
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

    // Resolve sender identity using registered phone numbers & email
    const senderResolution = this.resolveSenderIdentity(
      payload.contributor_phone,
      payload.contributor_email,
      payload.contributor_name
    );
    const resolvedName = senderResolution.matchedUser ? senderResolution.matchedUser.full_name : senderResolution.name;
    const isAnonymous = senderResolution.matchedUser ? false : payload.is_anonymous;

    // 1. Transaction record
    const newTransaction: Transaction = {
      id: transactionId,
      boma_id: boma.id,
      reference,
      idempotency_key: idempotencyKey,
      contributor_name: resolvedName,
      contributor_phone: payload.contributor_phone,
      contributor_email: payload.contributor_email,
      is_anonymous: isAnonymous,
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
      description: isAnonymous 
        ? `Anonymous contribution via ${payload.payment_method.toUpperCase()}`
        : `Contribution from ${resolvedName} via ${payload.payment_method.toUpperCase()}`,
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
      const resultsMap = new Map<string, Transaction>();

      // 1. Fetch transactions table.
      // NOTE: select('*') silently fails for the anon role — Postgres rejects
      // the entire query when any column in * isn't granted (idempotency_key,
      // contributor_email, contributor_phone, fee, metadata are creator-only).
      // The error is swallowed by the catch block, leaving the list empty.
      // Try the full column set first (works for creator); fall back to the
      // public-granted columns for everyone else.
      try {
        const { data: txns, error: txnError } = await supabase
          .from('transactions')
          .select('id,boma_id,reference,idempotency_key,contributor_name,contributor_email,contributor_phone,is_anonymous,amount,fee,net_amount,currency,payment_method,status,note,metadata,created_at')
          .eq('boma_id', bomaId)
          .order('created_at', { ascending: false });

        if (txnError) {
          // Anon / non-creator path: retry with only the publicly-granted columns.
          const { data: publicTxns } = await supabase
            .from('transactions')
            .select('id,boma_id,reference,contributor_name,is_anonymous,amount,net_amount,currency,payment_method,status,note,created_at')
            .eq('boma_id', bomaId)
            .order('created_at', { ascending: false });
          if (publicTxns) {
            for (const t of publicTxns) {
              resultsMap.set(t.reference, { fee: 0, idempotency_key: t.reference, ...t } as Transaction);
            }
          }
        } else if (txns) {
          for (const t of txns) {
            resultsMap.set(t.reference, t as Transaction);
          }
        }
      } catch (err) {
        console.warn('Unable to query transactions table:', err);
      }

      const list = Array.from(resultsMap.values());
      const sorted = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return sorted.map((t) => {
        const resolved = this.resolveSenderIdentity(t.contributor_phone, t.contributor_email, t.contributor_name);
        if (resolved.matchedUser) {
          return {
            ...t,
            contributor_name: resolved.matchedUser.full_name,
            is_anonymous: false,
          };
        }
        return t;
      });
    }
    const transactions = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    return transactions
      .filter((t) => t.boma_id === bomaId)
      .map((t) => {
        const resolved = this.resolveSenderIdentity(t.contributor_phone, t.contributor_email, t.contributor_name);
        if (resolved.matchedUser) {
          return {
            ...t,
            contributor_name: resolved.matchedUser.full_name,
            is_anonymous: false,
          };
        }
        return t;
      });
  }

  async getBomaLedger(bomaId: string): Promise<LedgerEntry[]> {
    if (this.isBrowser() && isSupabaseConfigured && /^[0-9a-f-]{36}$/i.test(bomaId)) {
      const supabase = createClient();
      const { data, error } = await supabase.from('ledger_entries').select('*').eq('boma_id', bomaId).order('created_at', { ascending: false });
      if (error) throw new Error('Unable to load ledger');
      return (data || []) as LedgerEntry[];
    }
    const ledger = this.getStore<LedgerEntry>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
    const transactions = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    return ledger
      .filter((l) => l.boma_id === bomaId)
      .map((l) => {
        if (l.entry_type === 'credit') {
          const tx = transactions.find((t) => t.id === l.transaction_id || t.reference === l.reference_code);
          if (tx) {
            const resolved = this.resolveSenderIdentity(tx.contributor_phone, tx.contributor_email, tx.contributor_name);
            if (resolved.matchedUser) {
              return {
                ...l,
                description: `Contribution from ${resolved.matchedUser.full_name} via ${tx.payment_method.toUpperCase()}`,
              };
            }
          }
        }
        return l;
      })
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

  // =========================================================================
  // --- ADMIN CONTROLS & MULTI-PHONE USER MANAGEMENT ---
  // =========================================================================

  async getUsers(): Promise<UserProfile[]> {
    return this.getStore<UserProfile>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  /** Keep registered Supabase profiles available to the local sender resolver. */
  syncRegisteredUsers(registeredUsers: UserProfile[]): void {
    const existingUsers = this.getStore<UserProfile>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const registeredIds = new Set(registeredUsers.map((user) => user.id));
    const localUsers = existingUsers.filter((user) => !registeredIds.has(user.id));
    this.setStore(STORAGE_KEYS.USERS, [...registeredUsers, ...localUsers]);
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    const users = await this.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  async getUserByPhone(phone: string): Promise<UserProfile | null> {
    const users = await this.getUsers();
    return users.find((u) => phoneListIncludes(u.phones, phone)) || null;
  }

  async addUser(data: {
    full_name: string;
    email: string;
    phones: string[];
    role: UserRole;
    status?: UserStatus;
    notes?: string;
  }): Promise<UserProfile> {
    const users = await this.getUsers();
    const cleanPhones = Array.from(
      new Set(data.phones.map((p) => p.trim()).filter(Boolean))
    );

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      full_name: data.full_name.trim(),
      email: data.email.toLowerCase().trim(),
      phones: cleanPhones.length > 0 ? cleanPhones : ['+254700000000'],
      role: data.role,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      approved_by: 'Admin Console',
      notes: data.notes,
    };

    this.setStore(STORAGE_KEYS.USERS, [newUser, ...users]);
    await this.autoReconcileTransactions();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User account not found');

    const updated: UserProfile = {
      ...users[index],
      ...updates,
      phones: updates.phones
        ? Array.from(new Set(updates.phones.map((p) => p.trim()).filter(Boolean)))
        : users[index].phones,
    };
    users[index] = updated;
    this.setStore(STORAGE_KEYS.USERS, [...users]);
    await this.autoReconcileTransactions();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const users = await this.getUsers();
    this.setStore(STORAGE_KEYS.USERS, users.filter((u) => u.id !== id));
  }

  async addPhoneToUser(userId: string, newPhone: string): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    const trimmed = newPhone.trim();
    if (!trimmed) throw new Error('Phone number is required');
    if (!phoneListIncludes(user.phones, trimmed)) {
      const updatedPhones = [...user.phones, trimmed];
      return this.updateUser(userId, { phones: updatedPhones });
    }
    return user;
  }

  async removePhoneFromUser(userId: string, phoneToRemove: string): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.phones.length <= 1) {
      throw new Error('User must retain at least one associated mobile number');
    }
    const filtered = user.phones.filter(
      (p) => normalizePhoneNumber(p) !== normalizePhoneNumber(phoneToRemove)
    );
    return this.updateUser(userId, { phones: filtered });
  }

  // --- SIGNUP REQUESTS & APPROVAL QUEUE ---

  async getSignupRequests(filterStatus?: UserStatus): Promise<SignupRequest[]> {
    const reqs = this.getStore<SignupRequest>(STORAGE_KEYS.SIGNUP_REQUESTS, INITIAL_SIGNUP_REQUESTS);
    if (filterStatus) {
      return reqs.filter((r) => r.status === filterStatus);
    }
    return reqs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  async submitSignupRequest(req: {
    full_name: string;
    email: string;
    phone: string;
    additional_phones?: string[];
    role?: UserRole;
  }): Promise<SignupRequest> {
    const all = await this.getSignupRequests();
    const newReq: SignupRequest = {
      id: `req-${Date.now()}`,
      full_name: req.full_name.trim(),
      email: req.email.toLowerCase().trim(),
      phone: req.phone.trim(),
      additional_phones: (req.additional_phones || []).map((p) => p.trim()).filter(Boolean),
      role: req.role || 'member',
      status: 'pending_approval',
      submitted_at: new Date().toISOString(),
    };
    this.setStore(STORAGE_KEYS.SIGNUP_REQUESTS, [newReq, ...all]);

    // Also register user profile in pending state so admin can see in full directory
    const allPhones = [req.phone, ...(req.additional_phones || [])].map((p) => p.trim()).filter(Boolean);
    const users = await this.getUsers();
    if (!users.some((u) => u.email.toLowerCase() === req.email.toLowerCase().trim())) {
      const userProfile: UserProfile = {
        id: `usr-pending-${Date.now()}`,
        email: req.email.toLowerCase().trim(),
        full_name: req.full_name.trim(),
        phones: allPhones,
        role: req.role || 'member',
        status: 'pending_approval',
        created_at: new Date().toISOString(),
      };
      this.setStore(STORAGE_KEYS.USERS, [userProfile, ...users]);
    }

    return newReq;
  }

  async approveSignupRequest(
    requestId: string,
    reviewerName = 'Admin',
    role?: UserRole
  ): Promise<UserProfile> {
    const allReqs = await this.getSignupRequests();
    const req = allReqs.find((r) => r.id === requestId);
    if (!req) throw new Error('Signup request not found');

    req.status = 'active';
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = reviewerName;
    if (role) req.role = role;
    this.setStore(STORAGE_KEYS.SIGNUP_REQUESTS, allReqs);

    const users = await this.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === req.email.toLowerCase());
    const allPhones = [req.phone, ...(req.additional_phones || [])].map((p) => p.trim()).filter(Boolean);

    if (existing) {
      existing.status = 'active';
      existing.role = req.role;
      existing.approved_at = new Date().toISOString();
      existing.approved_by = reviewerName;
      allPhones.forEach((p) => {
        if (!phoneListIncludes(existing.phones, p)) {
          existing.phones.push(p);
        }
      });
      this.setStore(STORAGE_KEYS.USERS, users);
      await this.autoReconcileTransactions();
      return existing;
    } else {
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email: req.email.toLowerCase().trim(),
        full_name: req.full_name.trim(),
        phones: allPhones,
        role: req.role,
        status: 'active',
        created_at: req.submitted_at || new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: reviewerName,
      };
      this.setStore(STORAGE_KEYS.USERS, [newUser, ...users]);
      await this.autoReconcileTransactions();
      return newUser;
    }
  }

  async rejectSignupRequest(
    requestId: string,
    reason?: string,
    reviewerName = 'Admin'
  ): Promise<void> {
    const allReqs = await this.getSignupRequests();
    const req = allReqs.find((r) => r.id === requestId);
    if (!req) throw new Error('Signup request not found');

    req.status = 'rejected';
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = reviewerName;
    req.rejection_reason = reason || 'Declined by Administrator';
    this.setStore(STORAGE_KEYS.SIGNUP_REQUESTS, allReqs);

    const users = await this.getUsers();
    const u = users.find((x) => x.email.toLowerCase() === req.email.toLowerCase());
    if (u) {
      u.status = 'rejected';
      this.setStore(STORAGE_KEYS.USERS, users);
    }
  }

  /**
   * Resolves incoming sender identity using registered multi-phone numbers and emails.
   * If an incoming phone matches ANY of a user's associated phone lines, returns their full legal name.
   */
  resolveSenderIdentity(
    phone?: string,
    email?: string,
    fallbackName?: string
  ): { name: string; isAnonymous: boolean; matchedUser?: UserProfile } {
    const users = this.getStore<UserProfile>(STORAGE_KEYS.USERS, INITIAL_USERS);

    // 1. Match phone across any registered user's associated phones
    if (phone) {
      const byPhone = users.find((u) => phoneListIncludes(u.phones, phone));
      if (byPhone) {
        return {
          name: byPhone.full_name,
          isAnonymous: false,
          matchedUser: byPhone,
        };
      }
    }

    // 2. Match email
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const byEmail = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (byEmail) {
        return {
          name: byEmail.full_name,
          isAnonymous: false,
          matchedUser: byEmail,
        };
      }
    }

    // 3. Fallback
    const cleanFallback = fallbackName && fallbackName.trim() && fallbackName !== 'Anonymous' && fallbackName !== 'Member'
      ? fallbackName.trim()
      : 'Member';

    return {
      name: cleanFallback,
      isAnonymous: false,
      matchedUser: undefined,
    };
  }

  /**
   * Automatically reconcile unlinked transactions against all registered users' phone numbers and emails.
   * If a transaction with 'Member' or unlinked phone now matches a user, automatically update it.
   */
  async autoReconcileTransactions(): Promise<number> {
    const users = this.getStore<UserProfile>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const transactions = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const ledger = this.getStore<LedgerEntry>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
    let updatedCount = 0;

    const updatedTxns = transactions.map((tx) => {
      const res = this.resolveSenderIdentity(tx.contributor_phone, tx.contributor_email, tx.contributor_name);
      if (res.matchedUser && tx.contributor_name !== res.matchedUser.full_name) {
        updatedCount++;
        // Update corresponding ledger entry description
        const lIndex = ledger.findIndex((l) => l.transaction_id === tx.id || l.reference_code === tx.reference);
        if (lIndex !== -1) {
          ledger[lIndex].description = `Contribution from ${res.matchedUser.full_name} via ${tx.payment_method.toUpperCase()}`;
        }
        return {
          ...tx,
          contributor_name: res.matchedUser.full_name,
          is_anonymous: false,
        };
      }
      return tx;
    });

    if (updatedCount > 0) {
      this.setStore(STORAGE_KEYS.TRANSACTIONS, updatedTxns);
      this.setStore(STORAGE_KEYS.LEDGER, ledger);
    }

    return updatedCount;
  }

  /**
   * Retrieve all platform transactions across all Bomas with sender resolution applied.
   */
  async getAllTransactions(): Promise<Transaction[]> {
    await this.autoReconcileTransactions();
    const bomas = await this.getBomas();
    const allTxns: Transaction[] = [];

    for (const b of bomas) {
      const txns = await this.getBomaTransactions(b.id);
      allTxns.push(...txns);
    }

    if (allTxns.length === 0) {
      const local = this.getStore<Transaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
      allTxns.push(...local.map((t) => {
        const res = this.resolveSenderIdentity(t.contributor_phone, t.contributor_email, t.contributor_name);
        return res.matchedUser ? { ...t, contributor_name: res.matchedUser.full_name, is_anonymous: false } : t;
      }));
    }

    return allTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- SUBACCOUNTS & SETTLEMENT DESTINATIONS ---

  async getSubaccounts(): Promise<Subaccount[]> {
    return this.getStore<Subaccount>(STORAGE_KEYS.SUBACCOUNTS, INITIAL_SUBACCOUNTS);
  }

  async createSubaccount(payload: {
    business_name: string;
    settlement_bank: string;
    account_number: string;
    currency: Currency;
    type: 'mobile_money' | 'bank_account';
    percentage_charge?: number;
    primary_contact_email?: string;
    primary_contact_name?: string;
    primary_contact_phone?: string;
  }): Promise<Subaccount> {
    const all = await this.getSubaccounts();
    const codeNum = Math.floor(1000000 + Math.random() * 9000000);
    const newSub: Subaccount = {
      id: `sub-${Date.now()}`,
      subaccount_code: `SUB_${codeNum}`,
      business_name: payload.business_name.trim(),
      settlement_bank: payload.settlement_bank.trim(),
      account_number: payload.account_number.trim(),
      currency: payload.currency,
      type: payload.type,
      percentage_charge: payload.percentage_charge || 0,
      primary_contact_email: payload.primary_contact_email?.trim(),
      primary_contact_name: payload.primary_contact_name?.trim(),
      primary_contact_phone: payload.primary_contact_phone?.trim(),
      status: 'active',
      created_at: new Date().toISOString(),
    };
    this.setStore(STORAGE_KEYS.SUBACCOUNTS, [newSub, ...all]);
    return newSub;
  }

  async deleteSubaccount(id: string): Promise<void> {
    const all = await this.getSubaccounts();
    this.setStore(STORAGE_KEYS.SUBACCOUNTS, all.filter((s) => s.id !== id));
  }
}


export const bomaService = new BomaService();
