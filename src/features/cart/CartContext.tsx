import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { CART_STORAGE_KEY } from '@/constants'
import type { CartItem, CartState } from '@/types'
import { useAuth } from '@/features/auth/AuthContext'

const emptyCart: CartState = { storeId: null, storeName: null, items: [] }

interface CartContextValue {
  cart: CartState
  addItem: (item: CartItem, storeName: string, onConflict: () => void) => void
  removeItem: (productId: string) => void
  increment: (productId: string) => void
  decrement: (productId: string) => void
  clear: () => void
  replaceWith: (item: CartItem, storeName: string) => void
  subtotal: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

/**
 * The cart is scoped to whoever is actually signed in (or a shared
 * "guest" bucket while signed out), so two different accounts using the
 * same browser never see each other's cart. Previously this used one
 * fixed key for the whole browser, which is what caused carts to "leak"
 * between different users on the same device.
 */
function storageKeyFor(userId: string | null): string {
  return `${CART_STORAGE_KEY}:${userId ?? 'guest'}`
}

function loadCart(key: string): CartState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyCart
    return JSON.parse(raw) as CartState
  } catch {
    return emptyCart
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const storageKey = storageKeyFor(userId)

  const [cart, setCart] = useState<CartState>(() => loadCart(storageKey))

  // Whenever the signed-in user changes (login, logout, or switching to a
  // different account on the same browser), swap in THAT user's own cart
  // instead of continuing to show whatever was in memory a moment ago.
  useEffect(() => {
    setCart(loadCart(storageKey))
  }, [storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart))
    } catch {
      // storage unavailable (private mode, quota) — fail silently, cart stays in-memory
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, cart])

  function addItem(item: CartItem, storeName: string, onConflict: () => void) {
    setCart((prev) => {
      if (prev.storeId && prev.storeId !== item.storeId && prev.items.length > 0) {
        onConflict()
        return prev
      }
      const existing = prev.items.find((i) => i.productId === item.productId)
      const items = existing
        ? prev.items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...prev.items, item]
      return { storeId: item.storeId, storeName, items }
    })
  }

  function replaceWith(item: CartItem, storeName: string) {
    setCart({ storeId: item.storeId, storeName, items: [item] })
  }

  function removeItem(productId: string) {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.productId !== productId)
      return items.length ? { ...prev, items } : emptyCart
    })
  }

  function increment(productId: string) {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i)),
    }))
  }

  function decrement(productId: string) {
    setCart((prev) => {
      const items = prev.items
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
      return items.length ? { ...prev, items } : emptyCart
    })
  }

  function clear() {
    setCart(emptyCart)
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, increment, decrement, clear, replaceWith, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}