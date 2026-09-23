/**
 * Centralized store-hours logic, mirroring the database's own check
 * inside create_order() so the Checkout preview always agrees with what
 * the server will actually enforce.
 */

export interface StoreHours {
  opens_at: string | null
  closes_at: string | null
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * True when the store is open right now, based on the browser's local
 * time. A store with no hours configured (either field null) is treated
 * as always open — same fallback as the database, so stores that haven't
 * set hours yet are never unexpectedly blocked.
 */
export function isStoreOpenNow(hours: StoreHours, now: Date = new Date()): boolean {
  if (!hours.opens_at || !hours.closes_at) return true

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = toMinutes(hours.opens_at)
  const closeMinutes = toMinutes(hours.closes_at)

  if (openMinutes <= closeMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes
  }
  // Hours span past midnight (e.g. opens 18:00, closes 02:00)
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes
}

/** Formats "18:00:00" (as returned by Postgres) into "06:00 م" for display. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}