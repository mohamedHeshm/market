export * from './database'

export interface CartItem {
  productId: string
  storeId: string
  name: string
  /** Final price actually charged (after discount, if any) — used for totals. */
  price: number
  /** Pre-discount price. Equals `price` when the product has no discount. */
  originalPrice: number
  imageUrl: string | null
  quantity: number
}

export interface CartState {
  storeId: string | null
  storeName: string | null
  items: CartItem[]
}

export interface OrderWithDetails {
  id: string
  status: import('./database').OrderStatus
  total: number
  subtotal: number
  delivery_fee: number
  created_at: string
  store: { id: string; name: string; image_url: string | null } | null
  items: Array<{ id: string; name: string; quantity: number; price: number; total: number }>
}
