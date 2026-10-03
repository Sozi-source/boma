const CURRENCIES = new Set(['KES', 'NGN', 'GHS', 'ZAR', 'USD']);

export function parseMoney(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 1 || amount > 10_000_000) return null;
  if (Math.round(amount * 100) !== amount * 100) return null;
  return amount;
}

export function parseCurrency(value: unknown): string | null {
  return typeof value === 'string' && CURRENCIES.has(value.toUpperCase())
    ? value.toUpperCase()
    : null;
}

export function sameOrigin(request: Request): boolean {
  const configuredOrigin = process.env.APP_URL;
  const origin = request.headers.get('origin');
  if (!configuredOrigin || !origin) return false;
  try {
    const expected = new URL(configuredOrigin);
    return (expected.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(expected.hostname))
      && new URL(origin).origin === expected.origin;
  } catch {
    return false;
  }
}

export function validReference(value: unknown): value is string {
  return typeof value === 'string' && /^BP-[A-Z0-9-]{8,48}$/.test(value);
}
