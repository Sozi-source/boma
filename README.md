# Openhand ? Group contributions, made clear

> **"A seamless way of contributing toward a common cause with confidence and transparency."**

Openhand is a group contribution platform engineered for collective contributions (family welfare, medical emergencies, community infrastructure, chamas, weddings, and educational funds).

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Supabase**, Openhand replaces opaque offline spreadsheets and unverified mobile money screenshots with an **immutable double-entry ledger** and group records that are public only after an organizer publishes them.

---

## 🏛️ Fintech Architecture Core

```
                         ┌────────────────────────────────────┐
                         │   Openhand Application Frontend     │
                         │  (Next.js 16 App Router + React 19)│
                         └─────────────────┬──────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │     Fintech Domain Service Layer    │
                        │        (lib/services/boma-service)   │
                        └──────────────────┬──────────────────┘
                                           │
              ┌────────────────────────────┴───────────────────────────┐
              ▼                                                        ▼
┌───────────────────────────┐                            ┌───────────────────────────┐
│   Double-Entry Accounting  │                            │     Data Persistence      │
│  (lib/ledger/ledger-service)│                            │    (Supabase PostgreSQL   │
│ - Credit/Debit Balancing   │                            │      + Hybrid Mock Store) │
│ - Reference Generator      │                            │ - schema.sql (RLS, DDL)   │
│ - Integrity Verification   │                            │ - Instant Browser Run     │
└───────────────────────────┘                            └───────────────────────────┘
```

### 1. Double-Entry Ledger Principles
- **No in-place balance overwrites**: Balances are calculated and reconciled from matched credit/debit records.
- **Credit (Inflows)**: When a supporter contributes, a credit entry is posted to the group's account, logging contributor details (or anonymous token), timestamp, and payment rail.
- **Debit (Outflows)**: When an organizer disburses funds, a debit entry is posted with mandatory justification (e.g. hospital invoice, contractor quote) and destination details.
- **Integrity Check**:
  $$\text{Available Balance} = \sum(\text{Credits}) - \sum(\text{Debits})$$

### 2. M-Pesa Till Contributions
Contributions use Paystack M-Pesa to send an STK prompt to the contributor's Kenyan number. Paystack splits successful payments between Openhand and the organizer's verified M-Pesa Till or Paybill subaccount. M-Pesa contributions require a KES fund.

### 3. Group visibility and audit feed
Groups start private and only the organizer can see them. Publishing makes a group's goal, progress, and safe contribution records visible to the public. Private group records remain protected by Supabase row-level security.

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment
Your `.env.local` is already configured with your Supabase endpoint:
```env
NEXT_PUBLIC_SUPABASE_URL=https://yxptfbulmvbbfzzqzefs.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> Payment and group creation require a configured Supabase project and authenticated organizer. No sample contributions or demo groups are preloaded. New groups are private until their organizer publishes them.

---

## 🗄️ Supabase Database Migration

To enable payments, apply all SQL files in order. The security migration removes permissive starter policies, and the final migration adds group Paystack subaccounts and fee-aware contribution settlement:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Run the base schema:
   ```
   supabase/schema.sql
   ```
4. Then run:
   ```
   supabase/migrations/20261003_enterprise_payment_security.sql
   ```
5. Run the public-read migrations in timestamp order:
   ```
   supabase/migrations/20261004000000_restore_public_boma_reads.sql
   supabase/migrations/20261005000000_public_transactions_read.sql
   ```
6. Then run:
   ```
   supabase/migrations/20261010_paystack_group_subaccounts.sql
   ```
7. Finally run `supabase/migrations/20261010000001_private_groups_by_default.sql` to make existing groups private and scope related financial records to public groups or their organizer.
Do not enable payment routes until all scripts have succeeded. The base schema creates:
- `bomas` (causes & community pools)
- `accounts` (financial wallets & balances)
- `transactions` (payment receipts & metadata)
- `ledger_entries` (immutable double-entry log)
- `disbursements` (withdrawal requests & justifications)
- Complete Row-Level Security (RLS) policies and indexes.

The security migration intentionally stops if existing group totals do not reconcile to ledger entries. Reconcile historical balances before retrying it. Ensure your hosting proxy overwrites `x-real-ip` before the app uses it for payment rate limits. Payouts remain reserved until a signed Paystack settlement webhook arrives; investigate any long-pending payout against Paystack before changing its state. Charge disputes and processed refunds are recorded in the private `payment_incidents` table for manual review. Since the organizer's share settles directly to its Till/Paybill, do not automatically reverse the group's net ledger when Clarix processes a refund; Clarix bears Paystack's refund/dispute liability.

Configure these server environment variables in your deployment secret manager. Never expose service credentials with a `NEXT_PUBLIC_` prefix:
```env
APP_URL=https://your-production-domain.example
SUPABASE_SERVICE_ROLE_KEY=...
PAYSTACK_ENV=live
PAYSTACK_SECRET_KEY=...
PAYSTACK_PLATFORM_FEE_PERCENT=2.5
```
Contributors approve an M-Pesa prompt through Paystack. Each organizer registers a group M-Pesa Till or Paybill as a Paystack subaccount. Openhand keeps 2.5% and the remaining share settles to that subaccount. Clarix must verify each new or changed destination in the Paystack Dashboard before its first payout. Configure the Paystack webhook URL as `/api/payments/paystack/webhook`; Paystack processing charges and refunds/disputes are borne by Clarix's main account.
Payouts also require Supabase MFA to be enabled and enrolled for the organizer account; requests without an `aal2` session are rejected. Update the hosted Supabase Auth password policy to at least 12 characters with upper/lowercase letters, digits, and symbols to match `supabase/config.toml`.

---

## 📁 Key File Structure

```
bomapay/
├── app/
│   ├── page.tsx               # Homepage with live financial metrics & urgent causes
│   ├── layout.tsx             # Root layout with navbar and footer
│   ├── bomas/
│   │   ├── page.tsx           # Causes directory with filters & search
│   │   ├── create/page.tsx    # Multi-step cause creation & ledger setup
│   │   └── [id]/page.tsx      # Dynamic cause detail, progress & transparent ledger
│   └── dashboard/page.tsx     # Personal fintech dashboard (My Groups & Receipts)
├── components/
│   ├── navbar.tsx             # Sticky navigation with live ledger indicator
│   ├── boma-card.tsx          # Cause card with progress bar and action triggers
│   ├── contribution-modal.tsx # Paystack M-Pesa contribution flow
│   ├── disbursement-modal.tsx # Withdrawal modal requiring documented justification
│   ├── transparent-ledger.tsx # Real-time public audit table & CSV export
│   └── ui/icons.tsx           # Clean, zero-dependency fintech SVG icons
├── lib/
│   ├── types/fintech.ts       # Strict domain types
│   ├── ledger/ledger-service.ts # Accounting logic & reference generator
│   ├── services/boma-service.ts # Group and payment operations service
│   └── supabase/client.ts     # Supabase client helper
└── supabase/
    └── schema.sql             # Production PostgreSQL DDL & RLS schema
```

---

## 🔮 Roadmap for Advanced Features

As outlined in our architecture plan, the foundation is built to seamlessly layer on:
1. **Organizer payout account management** (change and re-verify group settlement destinations).
2. **Multi-Sig Escrow Approvals** (requiring 2 of 3 committee members to sign off on large disbursements).
3. **Automated WhatsApp / SMS Receipts** (instant notification to contributors with reference link).
4. **Milestone-Based Fund Releases** (disbursing funds only upon milestone verification).
