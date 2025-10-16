'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  _id: string
  name: string
  slug: string
  price: number
  image?: string
  quantity: number
  key: string
  optionIndex?: number
  optionLabel?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes (but only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existingItem = prev.find((i) => i.key === (item as any).key)
      if (existingItem) {
        return prev.map((i) => (i.key === (item as any).key ? { ...i, quantity: i.quantity + quantity } : i))
      }
      return [...prev, { ...item, quantity }]
    })
  }

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(key)
      return
    }
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}