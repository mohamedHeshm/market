export type UserRole = 'USER' | 'ADMIN' | 'STORE' | 'DELIVERY'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_DELIVERY'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED'

export type PaymentMethod = 'CASH_WALLET' | 'CASH_ON_DELIVERY'
export type PaymentStatus = 'UNPAID' | 'WAITING_VERIFICATION' | 'PAID' | 'REJECTED'
export type DiscountType = 'PERCENTAGE'

export interface Profile {
  id: string
  name: string
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  owner_id: string | null
  name: string
  description: string | null
  image_url: string | null
  phone: string | null
  address: string | null
  /** Delivery fee this store charges, set by the store owner (or admin). */
  delivery_fee: number
  /** Daily opening time, e.g. "10:00:00". Null (with closes_at) means no schedule set — always open. */
  opens_at: string | null
  /** Daily closing time. Can be earlier than opens_at for hours spanning past midnight. */
  closes_at: string | null
  /** Store's own location, set by the store owner, used for the delivery service area. */
  latitude: number | null
  longitude: number | null
  /** Delivery service radius around the store's location, in kilometers. Null means no area restriction. */
  service_radius_km: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  /** Nullable — null means the product has no active discount. */
  discount_type: DiscountType | null
  /** For discount_type = 'PERCENTAGE', a value between 0 (exclusive) and 100. */
  discount_value: number | null
  /**
   * Computed by the database (generated column) from price + discount_type
   * + discount_value. Read-only — never send this in an insert/update payload.
   */
  final_price: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  title: string | null
  address: string
  phone: string | null
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  store_id: string
  delivery_id: string | null
  address_id: string
  phone: string
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus | null
  payment_transaction_reference: string | null
  payment_proof_url: string | null
  wallet_phone_used: string | null
  notes: string | null
  accepted_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  /** Unit price actually charged on this order (after any discount at order time). */
  price: number
  /** Unit price before discount at order time. Equals `price` when no discount applied. */
  original_price: number
  total: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string | null
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  store_id: string
  order_id: string | null
  rating: number
  comment: string | null
  created_at: string
}

export interface PaymentSettings {
  id: string
  wallet_enabled: boolean
  wallet_phone: string | null
  updated_at: string
  updated_by: string | null
}

// Minimal Database interface shape for the supabase-js generic client.
// A full generated version can replace this via `supabase gen types`.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      stores: { Row: Store; Insert: Partial<Store>; Update: Partial<Store> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      addresses: { Row: Address; Insert: Partial<Address>; Update: Partial<Address> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
      orders_view: { Row: Order; Insert: never; Update: never }
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> }
      payment_settings: { Row: PaymentSettings; Insert: Partial<PaymentSettings>; Update: Partial<PaymentSettings> }
    }
  }
}