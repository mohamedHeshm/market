import type { OrderStatus, UserRole, PaymentMethod } from '@/types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'بانتظار تأكيد المتجر',
  CONFIRMED: 'تم تأكيد الطلب',
  PREPARING: 'جاري تجهيز الطلب',
  READY_FOR_DELIVERY: 'جاهز للتوصيل',
  ASSIGNED: 'تم إسناد الطلب لمندوب',
  ON_THE_WAY: 'المندوب في الطريق',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
  REJECTED: 'مرفوض',
}

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_DELIVERY',
  'ASSIGNED',
  'ON_THE_WAY',
  'DELIVERED',
]

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'عميل',
  ADMIN: 'مدير النظام',
  STORE: 'متجر',
  DELIVERY: 'مندوب توصيل',
}

export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  USER: '/',
  ADMIN: '/admin',
  STORE: '/store',
  DELIVERY: '/delivery',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_WALLET: 'الدفع بالمحفظة الإلكترونية',
  CASH_ON_DELIVERY: 'الدفع عند الاستلام',
}

export const DELIVERY_FEE_DEFAULT = 15

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  stores: 'stores',
  products: 'products',
  categories: 'categories',
  paymentProofs: 'payment-proofs',
} as const

export const CART_STORAGE_KEY = 'wasla_cart_v1'
