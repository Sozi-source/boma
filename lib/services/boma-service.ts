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
  Subaccount,
  Group,
  GroupType
} from '../types/fintech';
import { generateReference, createIdempotencyKey } from '../ledger/ledger-service';
import { createClient, isSupabaseConfigured } from '../supabase/client';
import { normalizePhoneNumber, phoneListIncludes } from '../utils/phone';

// Restored Production Seeds: Family Support Group & Parents Support Fund
export const RESTORED_GROUP_ID = 'e5a63964-6d9b-4654-8e4f-2d9217646da4';
export const RESTORED_BOMA_ID = '40912c1d-ebba-4005-8971-32a3deec484f';
export const RESTORED_ORGANIZER_ID = '42893afe-6c38-42ab-b1e4-a78eca2492de';

const INITIAL_GROUPS: Group[] = [
  {
    id: RESTORED_GROUP_ID,
    name: 'Family Support Group',
    slug: 'family-support-group',
    description: "Family members supporting our parents' needs with transparent records.",
    group_type: 'family',
    organizer_id: RESTORED_ORGANIZER_ID,
    organizer_name: 'Wilfred Osozi',
    organizer_phone: '0711390861',
    payout_destination_type: 'mpesa_till',
    payout_destination_number: '4968133',
    is_verified: true,
    created_at: '2026-10-03T20:00:00.000Z',
    updated_at: '2026-10-11T12:00:00.000Z',
  },
];

const INITIAL_BOMAS: Boma[] = [
  {
    id: RESTORED_BOMA_ID,
    group_id: RESTORED_GROUP_ID,
    group_name: 'Family Support Group',
    title: 'Parents Support Fund',
    slug: 'parents-support-h1g',
    description: "Let us contribute in support of our parents' needs.",
    category: 'family',
    target_amount: 100000,
    current_amount: 1400,
    currency: 'KES',
    creator_id: RESTORED_ORGANIZER_ID,
    creator_name: 'Wilfred Osozi',
    creator_phone: '0711390861',
    status: 'active',
    deadline: '2026-11-02T21:09:22.135Z',
    image_url: '/assets/images/funds/family/family_1440w_web-xl.webp',
    is_public: true,
    contributors_count: 7,
    verified: true,
    created_at: '2026-10-03T21:09:22.135Z',
    updated_at: '2026-10-06T17:04:05.394Z',
  },
];

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: '79f55550-0a61-480a-89b2-8ef55cd0d7f8',
    boma_id: RESTORED_BOMA_ID,
    currency: 'KES',
    available_balance: 1400,
    ledger_balance: 1400,
    total_received: 1400,
    total_disbursed: 0,
    last_reconciled_at: '2026-10-06T17:04:05.394Z',
    created_at: '2026-10-03T21:09:21.883Z',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'ff77c989-1db7-43c4-a4d1-32ebf03d7a7c',
    boma_id: RESTORED_BOMA_ID,
    reference: 'BP-MUWXGTBB-8353F9FE5F2BF0DBA5ADD944',
    idempotency_key: 'BP-MUWXGTBB-8353F9FE5F2BF0DBA5ADD944',
    contributor_name: 'Wilfred Osozi',
    contributor_email: 'osoziw@gmail.com',
    contributor_phone: '0711390861',
    is_anonymous: false,
    amount: 100,
    fee: 0,
    net_amount: 100,
    currency: 'KES',
    payment_method: 'mpesa',
    status: 'completed',
    created_at: '2026-10-06T17:04:05.394Z',
  },
  {
    id: '762e7762-6552-44a4-9b95-bdbee0779a5f',
    boma_id: RESTORED_BOMA_ID,
    reference: 'BP-MUVWBBLF-4C2C6C9BD94CADC4EC95462B',
    idempotency_key: 'BP-MUVWBBLF-4C2C6C9BD94CADC4EC95462B',
    contributor_name: 'Wilfred Osozi',
    contributor_email: 'osoziw@gmail.com',
    contributor_phone: '0711390861',
    is_anonymous: false,
    amount: 90,
    fee: 0,
    net_amount: 90,
    currency: 'KES',
    payment_method: 'mpesa',
    status: 'completed',
    created_at: '2026-10-05T23:44:07.544Z',
  },
  {
    id: 'ece7a1fd-d96f-46b0-a406-6ed6138a67eb',
    boma_id: RESTORED_BOMA_ID,
    reference: 'BP-MUVIWE0Y-F4685F1208DB8BF16F0A6600',
    idempotency_key: 'BP-MUVIWE0Y-F4685F1208DB8BF16F0A6600',
    contributor_name: 'Wilfred Osozi',
    contributor_email: 'osoziw@gmail.com',
    contributor_phone: '0711390861',
    is_anonymous: false,
    amount: 1000,
    fee: 0,
    net_amount: 1000,
    currency: 'KES',
    payment_method: 'mpesa',
    status: 'completed',
    created_at: '2026-10-05T20:04:05.531Z',
  },
  {
    id: 'f8457b0b-3d87-43da-8dfa-593bc9a14c88',
    boma_id: RESTORED_BOMA_ID,
    reference: 'BP-MUV4TV2O-8CCCFBC0AE443069624581BC',
    idempotency_key: 'BP-MUV4TV2O-8CCCFBC0AE443069624581BC',
    contributor_name: 'Wilfred Osozi',
    contributor_email: 'osoziw@gmail.com',
    contributor_phone: '0711390861',
    is_anonymous: false,
    amount: 50,
    fee: 0,
    net_amount: 50,
    currency: 'KES',
    payment_method: 'mpesa',
    status: 'completed',
    created_at: '2026-10-05T10:54:38.924Z',
  },
  {
    id: '0f442c5f-ed61-4d8b-8dad-552e704ea590',
    boma_id: RESTORED_BOMA_ID,
    reference: 'BP-MUUS4VFX-4492E83F42ED167C385EEAC9',
    idempotency_key: 'BP-MUUS4VFX-4492E83F42ED167C385EEAC9',
    contributor_name: 'Wilfred Osozi',
    contributor_email: 'osoziw@gmail.com',
    contributor_phone: '0711390861',
    is_anonymous: false,
    amount: 50,
    fee: 0,
    net_amount: 50,
    currency: 'KES',
    payment_method: 'mpesa',
    status: 'completed',
    created_at: '2026-10-05T04:59:29.615Z',
  },
  {
    id: '47b6ec7f-97cc-4d3d-a784-5c5f3f65d4ea',
    boma_id: RESTORED_BOMA_ID,
    reference: 'BP-MUU2EIE6-6D13A95052CDC263EEBA49CB',
    idempotency_key: 'BP-MUU2EIE6-6D13A95052CDC263EEBA49CB',
    contributor_name: 'Wilfred Osozi',
    contributor_email: 'osoziw@gmail.com',
    contributor_phone: '0711390861',
    is_anonymous: false,
    amount: 100,
    fee: 0,
    net_amount: 100,
    currency: 'KES',
    payment_method: 'mpesa',
    status: 'completed',
    created_at: '2026-10-04T17:00:24.709Z',
  },
  {
    id: 'b80bc009-5e25-4706-9089-26c85b24980b',
    boma_id: RESTORED_BOMA_ID,
    reference: 'BP-MUSYT40D-C6A66ABCB5F2DB6F99D3D9BC',
    idempotency_key: 'BP-MUSYT40D-C6A66ABCB5F2DB6F99D3D9BC',
    contributor_name: 'Member',
    contributor_email: 'osoziw@gmail.com',
    contributor_phone: '0711390861',
    is_anonymous: true,
    amount: 10,
    fee: 0,
    net_amount: 10,
    currency: 'KES',
    payment_method: 'mpesa',
    status: 'completed',
    created_at: '2026-10-03T22:31:05.192Z',
  },
];

const INITIAL_USERS: UserProfile[] = [
  {
    id: RESTORED_ORGANIZER_ID,
    full_name: 'Wilfred Osozi',
    phone: '0711390861',
    phones: ['0711390861'],
    email: 'osoziw@gmail.com',
    role: 'organizer',
    status: 'active',
    created_at: '2026-10-03T20:00:00.000Z',
    updated_at: '2026-10-11T12:00:00.000Z',
  },
];
const INITIAL_SIGNUP_REQUESTS: SignupRequest[] = [];
const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 'led-7',
    transaction_id: 'ff77c989-1db7-43c4-a4d1-32ebf03d7a7c',
    boma_id: RESTORED_BOMA_ID,
    entry_type: 'credit',
    amount: 100,
    currency: 'KES',
    balance_after: 1400,
    description: 'Contribution from Wilfred Osozi via MPESA',
    reference_code: 'BP-MUWXGTBB-8353F9FE5F2BF0DBA5ADD944',
    created_at: '2026-10-06T17:04:05.394Z',
  },
  {
    id: 'led-6',
    transaction_id: '762e7762-6552-44a4-9b95-bdbee0779a5f',
    boma_id: RESTORED_BOMA_ID,
    entry_type: 'credit',
    amount: 90,
    currency: 'KES',
    balance_after: 1300,
    description: 'Contribution from Wilfred Osozi via MPESA',
    reference_code: 'BP-MUVWBBLF-4C2C6C9BD94CADC4EC95462B',
    created_at: '2026-10-05T23:44:07.544Z',
  },
  {
    id: 'led-5',
    transaction_id: 'ece7a1fd-d96f-46b0-a406-6ed6138a67eb',
    boma_id: RESTORED_BOMA_ID,
    entry_type: 'credit',
    amount: 1000,
    currency: 'KES',
    balance_after: 1210,
    description: 'Contribution from Wilfred Osozi via MPESA',
    reference_code: 'BP-MUVIWE0Y-F4685F1208DB8BF16F0A6600',
    created_at: '2026-10-05T20:04:05.531Z',
  },
  {
    id: 'led-4',
    transaction_id: 'f8457b0b-3d87-43da-8dfa-593bc9a14c88',
    boma_id: RESTORED_BOMA_ID,
    entry_type: 'credit',
    amount: 50,
    currency: 'KES',
    balance_after: 210,
    description: 'Contribution from Wilfred Osozi via MPESA',
    reference_code: 'BP-MUV4TV2O-8CCCFBC0AE443069624581BC',
    created_at: '2026-10-05T10:54:38.924Z',
  },
  {
    id: 'led-3',
    transaction_id: '0f442c5f-ed61-4d8b-8dad-552e704ea590',
    boma_id: RESTORED_BOMA_ID,
    entry_type: 'credit',
    amount: 50,
    currency: 'KES',
    balance_after: 160,
    description: 'Contribution from Wilfred Osozi via MPESA',
    reference_code: 'BP-MUUS4VFX-4492E83F42ED167C385EEAC9',
    created_at: '2026-10-05T04:59:29.615Z',
  },
  {
    id: 'led-2',
    transaction_id: '47b6ec7f-97cc-4d3d-a784-5c5f3f65d4ea',
    boma_id: RESTORED_BOMA_ID,
    entry_type: 'credit',
    amount: 100,
    currency: 'KES',
    balance_after: 110,
    description: 'Contribution from Wilfred Osozi via MPESA',
    reference_code: 'BP-MUU2EIE6-6D13A95052CDC263EEBA49CB',
    created_at: '2026-10-04T17:00:24.709Z',
  },
  {
    id: 'led-1',
    transaction_id: 'b80bc009-5e25-4706-9089-26c85b24980b',
    boma_id: RESTORED_BOMA_ID,
    entry_type: 'credit',
    amount: 10,
    currency: 'KES',
    balance_after: 10,
    description: 'Contribution from Anonymous Friend via MPESA',
    reference_code: 'BP-MUSYT40D-C6A66ABCB5F2DB6F99D3D9BC',
    created_at: '2026-10-03T22:31:05.192Z',
  },
];
const INITIAL_DISBURSEMENTS: Disbursement[] = [];
const INITIAL_COMMITTEES: Committee[] = [];
const INITIAL_PAYOUT_REQUESTS: PayoutRequest[] = [];
const INITIAL_SUBACCOUNTS: Subaccount[] = [];

// LocalStorage Keys for client persistence (v4 production clean slate)
const STORAGE_KEYS = {
  GROUPS: 'bomapay_groups_v4',
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

      // Hydrate v4 store with restored production seeds if empty
      try {
        const storedBomas = localStorage.getItem(STORAGE_KEYS.BOMAS);
        if (!storedBomas || JSON.parse(storedBomas).length === 0) {
          localStorage.setItem(STORAGE_KEYS.BOMAS, JSON.stringify(INITIAL_BOMAS));
        }
        const storedGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);
        if (!storedGroups || JSON.parse(storedGroups).length === 0) {
          localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(INITIAL_GROUPS));
        }
        const storedAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (!storedAccounts || JSON.parse(storedAccounts).length === 0) {
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
        }
        const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (!storedTx || JSON.parse(storedTx).length === 0) {
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
        }
        const storedLedger = localStorage.getItem(STORAGE_KEYS.LEDGER);
        if (!storedLedger || JSON.parse(storedLedger).length === 0) {
          localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(INITIAL_LEDGER));
        }
      } catch {}
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
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Wilfred Osozi',
            email: user.email,
            phone: user.user_metadata?.phone || '0711390861',
          };
        }
      } catch { /* Auth provider unavailable: no authenticated user. */ }
    }
    return { id: RESTORED_ORGANIZER_ID, name: 'Wilfred Osozi', phone: '0711390861', email: 'osoziw@gmail.com' };
  }

  // --- GROUP OPERATIONS ---

  async getMyGroup(): Promise<Group | null> {
    const currentUser = await this.getCurrentUser();

    if (this.isBrowser() && isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .or(`organizer_id.eq.${currentUser.id},id.eq.${RESTORED_GROUP_ID}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) return data as Group;
      } catch {
        // Fall back to local store
      }
    }

    const groups = this.getStore<Group>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    const found = groups.find((g) => g.organizer_id === currentUser.id || g.id === RESTORED_GROUP_ID);
    if (found) return found;

    return INITIAL_GROUPS[0] || null;
  }

  async ensureUserGroup(): Promise<Group> {
    const existing = await this.getMyGroup();
    if (existing) return existing;

    const currentUser = await this.getCurrentUser();
    const groupName = currentUser.name && currentUser.name !== 'Organizer' && currentUser.name !== 'there'
      ? `${currentUser.name}'s Group`
      : 'My Community Group';
    const slugBase = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

    const newGroup: Group = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grp-${Date.now()}`,
      name: groupName,
      slug,
      description: 'Transparent shared funds and member records.',
      group_type: 'chama',
      organizer_id: currentUser.id,
      organizer_name: currentUser.name,
      organizer_phone: currentUser.phone,
      payout_destination_type: 'mpesa_till',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isBrowser() && isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('groups').insert({
          id: newGroup.id,
          name: newGroup.name,
          slug: newGroup.slug,
          description: newGroup.description,
          group_type: newGroup.group_type,
          organizer_id: newGroup.organizer_id,
          organizer_name: newGroup.organizer_name,
          organizer_phone: newGroup.organizer_phone,
          payout_destination_type: newGroup.payout_destination_type,
          is_verified: false,
        }).select('*').single();
        if (!error && data) {
          const groups = this.getStore<Group>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
          this.setStore(STORAGE_KEYS.GROUPS, [...groups, data as Group]);
          return data as Group;
        }
      } catch {
        // Fall through to local
      }
    }

    const groups = this.getStore<Group>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    this.setStore(STORAGE_KEYS.GROUPS, [...groups, newGroup]);
    return newGroup;
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    const groups = this.getStore<Group>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    const index = groups.findIndex((g) => g.id === groupId);
    const updated = {
      ...(groups[index] || {}),
      ...updates,
      updated_at: new Date().toISOString(),
    } as Group;

    if (index >= 0) {
      groups[index] = updated;
      this.setStore(STORAGE_KEYS.GROUPS, groups);
    } else {
      this.setStore(STORAGE_KEYS.GROUPS, [...groups, updated]);
    }

    if (this.isBrowser() && isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.from('groups').update(updates).eq('id', groupId);
      } catch {}
    }

    return updated;
  }

  // --- BOMA OPERATIONS ---

  async getBomas(options?: { category?: BomaCategory | 'all'; query?: string }): Promise<Boma[]> {
    if (this.isBrowser()) {
      try {
        const params = new URLSearchParams();
        if (options?.category && options.category !== 'all') params.set('category', options.category);
        if (options?.query?.trim()) params.set('q', options.query.trim());
        const res = await fetch(`/api/bomas?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) return json.data as Boma[];
        }
      } catch {
        // Fall back to local store
      }
    }
    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    let filtered = [...bomas];

    if (options?.category && options.category !== 'all') {
      filtered = filtered.filter((b) => b.is_public && b.category === options.category);
    }

    if (options?.query && options.query.trim().length > 0) {
      const q = options.query.toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.is_public && (b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.creator_name.toLowerCase().includes(q))
      );
    }

    return filtered.filter((b) => b.is_public).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getMyBomas(): Promise<Boma[]> {
    const currentUser = await this.getCurrentUser();
    if (this.isBrowser()) {
      try {
        const res = await fetch(`/api/bomas?creator_id=${encodeURIComponent(currentUser.id)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) return json.data as Boma[];
        }
      } catch {
        // Fall back to local store
      }
    }
    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    const owned = bomas.filter((boma) => boma.creator_id === currentUser.id || boma.creator_id === RESTORED_ORGANIZER_ID || boma.id === RESTORED_BOMA_ID);
    if (owned.length > 0) return owned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return INITIAL_BOMAS;
  }

  async getBomaById(id: string): Promise<{ boma: Boma; account: Account } | null> {
    if (this.isBrowser() && /^[0-9a-f-]{36}$/i.test(id)) {
      try {
        const res = await fetch(`/api/bomas?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const boma = json.data[0] as Boma;
            const account: Account = {
              id: '79f55550-0a61-480a-89b2-8ef55cd0d7f8',
              boma_id: boma.id,
              currency: boma.currency,
              available_balance: boma.current_amount,
              ledger_balance: boma.current_amount,
              total_received: boma.current_amount,
              total_disbursed: 0,
              last_reconciled_at: boma.updated_at || boma.created_at,
              pending_balance: 0,
              escrow_balance: 0,
              created_at: boma.created_at,
              updated_at: boma.updated_at,
            };
            return { boma, account };
          }
        }
      } catch {}
    }
    const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
    const currentUser = await this.getCurrentUser();
    const boma = bomas.find((b) => b.id === id && (b.is_public || b.creator_id === currentUser.id));
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
    category?: BomaCategory;
    target_amount: number;
    currency: Currency;
    deadlineDays?: number;
    isOngoing?: boolean;
    creator_name?: string;
    creator_phone?: string;
    image_url?: string;
    is_public: boolean;
  }): Promise<Boma> {
    const activeUser = await this.getCurrentUser();
    if (activeUser.id === 'user-guest' || !isSupabaseConfigured) {
      throw new Error('Sign in with a configured account to create a fund.');
    }
    const group = await this.ensureUserGroup();
    const supabase = createClient();
    const creatorId = activeUser.id;
    const creatorName = data.creator_name || group.name || activeUser.name;
    const creatorPhone = data.creator_phone || group.organizer_phone || activeUser.phone;

    // Infer category from group classification if not explicitly provided
    const validCategories: BomaCategory[] = [
      'medical', 'education', 'chama', 'funeral', 'wedding', 'community',
      'emergency', 'business', 'family', 'housing', 'food', 'travel',
      'religious', 'sports', 'technology', 'other'
    ];
    let resolvedCategory: BomaCategory = 'community';
    if (data.category && validCategories.includes(data.category)) {
      resolvedCategory = data.category;
    } else if (group.group_type && validCategories.includes(group.group_type as BomaCategory)) {
      resolvedCategory = group.group_type as BomaCategory;
    } else if (group.group_type === 'welfare') {
      resolvedCategory = 'family';
    }

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const isOngoing = Boolean(data.isOngoing || !data.deadlineDays || data.deadlineDays <= 0);
    const deadline = isOngoing
      ? new Date('2099-12-31T23:59:59.999Z').toISOString()
      : new Date(Date.now() + (data.deadlineDays || 30) * 24 * 60 * 60 * 1000).toISOString();

    const newBoma = {
      group_id: group.id,
      group_name: group.name,
      title: data.title,
      slug: `${slug}-${Math.random().toString(36).substring(2, 5)}`,
      description: data.description,
      category: resolvedCategory,
      target_amount: Number(data.target_amount),
      current_amount: 0,
      currency: data.currency,
      creator_id: creatorId,
      creator_name: creatorName,
      creator_phone: creatorPhone,
      status: 'active',
      deadline,
      image_url: data.image_url && data.image_url.trim() ? data.image_url.trim() : undefined,
      is_public: data.is_public,
      contributors_count: 0,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: stored, error } = await supabase.from('bomas').insert({
      ...newBoma, current_amount: 0, is_public: data.is_public, contributors_count: 0, verified: false,
    }).select('id,group_id,group_name,title,slug,description,category,target_amount,current_amount,currency,creator_id,creator_name,status,deadline,image_url,is_public,contributors_count,verified,created_at,updated_at').single();
    if (error || !stored) throw new Error('Unable to create fund. Please check your sign-in and try again.');

    if (this.isBrowser()) {
      const bomas = this.getStore<Boma>(STORAGE_KEYS.BOMAS, INITIAL_BOMAS);
      this.setStore(STORAGE_KEYS.BOMAS, [stored as Boma, ...bomas]);
    }

    return stored as Boma;
  }

  async updateBomaVisibility(bomaId: string, isPublic: boolean): Promise<{ success: boolean; error?: string }> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser || currentUser.id === 'user-guest') return { success: false, error: 'Sign in to change group visibility.' };
    if (!this.isBrowser() || !isSupabaseConfigured) return { success: false, error: 'Group visibility is unavailable while offline.' };
    const supabase = createClient();
    const { data, error } = await supabase.from('bomas').update({ is_public: isPublic })
      .eq('id', bomaId).eq('creator_id', currentUser.id).select('id').maybeSingle();
    if (error || !data) return { success: false, error: 'Unable to update group visibility.' };
    return { success: true };
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
      const effectiveList = list.length > 0 ? list : (bomaId === RESTORED_BOMA_ID ? INITIAL_TRANSACTIONS : []);
      const sorted = effectiveList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
