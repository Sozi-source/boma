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
  if (!configuredOrigin) return false;

  let expected: URL;
  try {
    expected = new URL(configuredOrigin);
  } catch {
    return false;
  }

  const isAllowedHost =
    expected.protocol === 'https:' ||
    ['localhost', '127.0.0.1'].includes(expected.hostname);

  if (!isAllowedHost) return false;

  const origin = request.headers.get('origin');
  // Same-origin fetches from certain browsers/environments omit the Origin
  // header (e.g. some server-side fetch paths). Fall back to Host matching.
  if (!origin) {
    const host = request.headers.get('host') || '';
    return host === expected.host;
  }

  try {
    return new URL(origin).origin === expected.origin;
  } catch {
    return false;
  }
}


export function validReference(value: unknown): value is string {
  return typeof value === 'string' && /^BP-[A-Z0-9-]{8,48}$/.test(value);
}
