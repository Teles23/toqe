const PUBLIC_BOOKING_ROUTE = /^\/b\/[a-z0-9-]+$/i;
const CLIENTE_BARBEARIA_ROUTE = /^\/\(cliente\)\/barbearia\/[a-z0-9-]+$/i;

export function normalizeReturnTo(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const decoded = decodeURIComponent(trimmed);
    if (
      PUBLIC_BOOKING_ROUTE.test(decoded) ||
      CLIENTE_BARBEARIA_ROUTE.test(decoded)
    ) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

