import { Currency, LedgerEntry, Transaction, Account } from '../types/fintech';

/**
 * Generate a unique, audit-compliant transaction reference
 * Format: BP-YYYYMM-XXXXX (e.g. BP-202609-F839K)
 */
export function generateReference(prefix = 'BP'): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${yearMonth}-${randomChars}`;
}

/**
 * Format currency with proper locale symbols and standard fintech conventions
 */
export function formatCurrency(amount: number, currency: Currency = 'KES'): string {
  if (currency === 'KES') {
    return `KES ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Verify accounting integrity between ledger entries and account balances
 * Fundamental Fintech Rule: Available Balance == Sum(Credits) - Sum(Debits)
 */
export function verifyLedgerIntegrity(
  account: Account,
  entries: LedgerEntry[]
): {
  isValid: boolean;
  computedBalance: number;
  recordedBalance: number;
  discrepancy: number;
} {
  const computedBalance = entries.reduce((acc, entry) => {
    if (entry.entry_type === 'credit') {
      return acc + Number(entry.amount);
    } else {
      return acc - Number(entry.amount);
    }
  }, 0);

  const recordedBalance = Number(account.available_balance);
  const discrepancy = Math.abs(computedBalance - recordedBalance);

  return {
    isValid: discrepancy < 0.01,
    computedBalance,
    recordedBalance,
    discrepancy,
  };
}

/**
 * Mask sensitive identity for anonymous contributions while keeping audit trail intact
 */
export function formatContributorName(name: string, isAnonymous: boolean): string {
  if (!isAnonymous) return name;
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0][0] + '*** (Member)';
  }
  return `${parts[0][0]}*** ${parts[1][0]}*** (Anonymous Friend)`;
}

/**
 * Generates an idempotent payment request payload
 */
export function createIdempotencyKey(bomaId: string, phoneOrEmail: string, amount: number): string {
  const timestampWindow = Math.floor(Date.now() / 60000); // 1-minute window
  return `IDEMP-${bomaId}-${phoneOrEmail}-${amount}-${timestampWindow}`;
}
