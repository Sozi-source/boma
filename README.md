# Boma Pay — Transparent Cause & Community Banking

> **"A seamless way of contributing toward a common cause with confidence and transparency."**

Boma Pay is a modern fintech platform engineered for collective contributions (family welfare, medical emergencies, community infrastructure, chamas, weddings, and educational funds).

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Supabase**, Boma Pay replaces opaque offline spreadsheets and unverified mobile money screenshots with an **immutable double-entry ledger** and **real-time public audit feeds**.

---

## 🏛️ Fintech Architecture Core

```
                         ┌────────────────────────────────────┐
                         │   Boma Pay Application Frontend     │
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
- **Credit (Inflows)**: When a supporter contributes, a credit entry is posted to the Boma pool's account, logging contributor details (or anonymous token), timestamp, and payment rail.
- **Debit (Outflows)**: When an organizer disburses funds, a debit entry is posted with mandatory justification (e.g. hospital invoice, contractor quote) and destination details.
- **Integrity Check**:
  $$\text{Available Balance} = \sum(\text{Credits}) - \sum(\text{Debits})$$

### 2. Multi-Rail Contribution Gateway
Supports multi-rail payment flows with instant simulated authorization and receipt issuance:
- **M-Pesa STK Push** (Safaricom mobile money prompt)
- **Credit / Debit Cards** (Visa, Mastercard)
- **Direct Bank Transfer** (EFT / PesaLink)

### 3. Transparent Audit Feed
Every Boma has a **Public Transparent Ledger** tab allowing any contributor or community member to inspect all transactions, running balances, and export signed CSV audit reports.

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
> Boma Pay includes an intelligent dual-persistence engine. You can immediately create causes, simulate M-Pesa contributions, request disbursements, and inspect ledgers right out of the box in your browser!

---

## 🗄️ Supabase Database Migration

Whenever you want to persist data to your live Supabase cloud database:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy and run the complete migration script located at:
   ```
   supabase/schema.sql
   ```
This script creates:
- `bomas` (causes & community pools)
- `accounts` (financial wallets & balances)
- `transactions` (payment receipts & metadata)
- `ledger_entries` (immutable double-entry log)
- `disbursements` (withdrawal requests & justifications)
- Complete Row-Level Security (RLS) policies and indexes.

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
│   └── dashboard/page.tsx     # Personal fintech dashboard (My Bomas & Receipts)
├── components/
│   ├── navbar.tsx             # Sticky navigation with live ledger indicator
│   ├── boma-card.tsx          # Cause card with progress bar and action triggers
│   ├── contribution-modal.tsx # Multi-rail payment modal with M-Pesa STK simulation
│   ├── disbursement-modal.tsx # Withdrawal modal requiring documented justification
│   ├── transparent-ledger.tsx # Real-time public audit table & CSV export
│   └── ui/icons.tsx           # Clean, zero-dependency fintech SVG icons
├── lib/
│   ├── types/fintech.ts       # Strict domain types
│   ├── ledger/ledger-service.ts # Accounting logic & reference generator
│   ├── services/boma-service.ts # Unified Boma & payment operations service
│   └── supabase/client.ts     # Supabase client helper
└── supabase/
    └── schema.sql             # Production PostgreSQL DDL & RLS schema
```

---

## 🔮 Roadmap for Advanced Features

As outlined in our architecture plan, the foundation is built to seamlessly layer on:
1. **Live Daraja M-Pesa API integration** (STK push callbacks, C2B paybill validation).
2. **Multi-Sig Escrow Approvals** (requiring 2 of 3 committee members to sign off on large disbursements).
3. **Automated WhatsApp / SMS Receipts** (instant notification to contributors with reference link).
4. **Milestone-Based Fund Releases** (disbursing funds only upon milestone verification).
