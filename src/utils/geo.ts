/**
 * Centralized geo logic. Every place that needs to check whether an
 * address falls inside a store's delivery area must go through this file
 * instead of re-implementing the distance math locally — mirroring the
 * pattern used for pricing in `utils/pricing.ts`.
 *
 * The formula here is kept identical, on purpose, to the `haversine_km()`
 * function in the database (see database_changes.sql), so the client-side
 * preview in Checkout always agrees with the server's own authoritative
 * check inside create_order().
 */

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface GeoPoint {
  latitude: number | null
  longitude: number | null
}

export interface ServiceAreaStore extends GeoPoint {
  service_radius_km: number | null
}

export interface ServiceAreaResult {
  /** True when we can't determine the distance (missing data) OR the address is within range. */
  withinArea: boolean
  /** Null when the store or the address is missing location data — nothing to enforce, matches server fallback. */
  distanceKm: number | null
}

/**
 * Checks whether an address is inside a store's delivery area. If the
 * store hasn't set a location/radius yet, or the address has no captured
 * location, this deliberately does NOT block anything — same fallback
 * behavior as the database function, so an incomplete setup never breaks
 * checkout for stores that haven't configured a service area.
 */
export function checkServiceArea(store: ServiceAreaStore, address: GeoPoint): ServiceAreaResult {
  if (
    store.latitude == null ||
    store.longitude == null ||
    store.service_radius_km == null ||
    address.latitude == null ||
    address.longitude == null
  ) {
    return { withinArea: true, distanceKm: null }
  }

  const distanceKm = haversineKm(store.latitude, store.longitude, address.latitude, address.longitude)
  return { withinArea: distanceKm <= store.service_radius_km, distanceKm }
}

/** Wraps the browser Geolocation API in a promise for easy use in forms. */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم تحديد الموقع'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
  })
}