/**
 * Phone Number Normalization and Multi-Phone Resolution Utilities
 * Handles Kenyan and East African mobile formats (+254, 07xx, 01xx, 254xx)
 */

export function normalizePhoneNumber(raw?: string | null): string {
  if (!raw) return '';
  // Strip all non-digit and non-plus characters
  let digits = raw.replace(/[\s\-\(\)\.]/g, '');
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  // If local format: 07XXXXXXXX or 01XXXXXXXX (10 digits) -> 254XXXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '254' + digits.slice(1);
  } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    digits = '254' + digits;
  }

  return digits;
}

export function formatPhoneDisplay(raw?: string | null): string {
  if (!raw) return '';
  const norm = normalizePhoneNumber(raw);
  if (norm.startsWith('254') && norm.length === 12) {
    return `+254 ${norm.slice(3, 6)} ${norm.slice(6, 9)} ${norm.slice(9)}`;
  }
  return raw;
}

export function phoneMatches(phoneA?: string | null, phoneB?: string | null): boolean {
  if (!phoneA || !phoneB) return false;
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  if (!normA || !normB) return false;
  return normA === normB;
}

export function phoneListIncludes(phoneList: string[], targetPhone?: string | null): boolean {
  if (!targetPhone || !phoneList || phoneList.length === 0) return false;
  const targetNorm = normalizePhoneNumber(targetPhone);
  if (!targetNorm) return false;
  return phoneList.some((p) => normalizePhoneNumber(p) === targetNorm);
}
