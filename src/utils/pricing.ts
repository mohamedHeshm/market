import type { DiscountType } from '@/types'

/**
 * Centralized pricing logic. Every place in the app that needs to show or
 * compute a product's price (Product Card, Product Details, Cart, Checkout,
 * Order Summary, Admin/Store product forms, ...) must go through this file
 * instead of re-implementing the discount math locally.
 *
 * The formula here is kept identical, on purpose, to the `final_price`
 * generated column in the database (see database_changes.sql):
 *
 *   final_price = round(price * (100 - discount_value) / 100, 2)
 *
 * This file is only ever used to compute a live PREVIEW on the client
 * (e.g. while an admin/store owner is editing a discount, or to render a
 * product card). The actual price an order is billed at is always the
 * database's own `final_price` / `create_order()` RPC — this file never
 * has the final say over money that changes hands.
 */

export interface Discountable {
  price: number
  discount_type: DiscountType | null
  discount_value: number | null
}

export interface PricingResult {
  originalPrice: number
  finalPrice: number
  hasDiscount: boolean
  /** The raw discount percentage (e.g. 20), null when there is no discount. */
  discountPercent: number | null
  /** Ready-to-render label, e.g. "خصم 20%". Null when there is no discount. */
  discountLabel: string | null
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Returns just the final price after any discount, rounded to 2 decimals. */
export function getFinalPrice(item: Discountable): number {
  if (item.discount_type === 'PERCENTAGE' && item.discount_value != null && item.discount_value > 0) {
    return roundCurrency((item.price * (100 - item.discount_value)) / 100)
  }
  return item.price
}

/** Full pricing breakdown for a product, ready to feed into <PriceTag>. */
export function getPricing(item: Discountable): PricingResult {
  const originalPrice = item.price
  const finalPrice = getFinalPrice(item)
  const hasDiscount = finalPrice < originalPrice

  return {
    originalPrice,
    finalPrice,
    hasDiscount,
    discountPercent: hasDiscount ? item.discount_value : null,
    discountLabel: hasDiscount && item.discount_value ? `خصم ${trimTrailingZero(item.discount_value)}%` : null,
  }
}

function trimTrailingZero(n: number): string {
  // "20.00" -> "20", "12.50" -> "12.5"
  return String(Number(n.toFixed(2)))
}

/** Centralized currency formatting so every screen displays prices identically. */
export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} ج.م`
}
