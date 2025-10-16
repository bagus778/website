'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useMinecraftUser } from '@/contexts/MinecraftUserContext'
import MinecraftLoginModal from '@/components/MinecraftLoginModal'
import '@/theme/store/cart.css'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const { isLoggedIn } = useMinecraftUser()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingCheckout, setPendingCheckout] = useState(false)
  const [invalidItems, setInvalidItems] = useState<Record<string, string>>({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  const itemsParam = useMemo(() => {
    return items.map((item) => {
      const optPart = item.optionIndex !== undefined ? `:${item.optionIndex}` : ''
      return `${item._id}:${item.quantity}${optPart}`
    }).join(',')
  }, [items])

  // Validate availability of cart items (product and category active)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (items.length === 0) {
        setInvalidItems({})
        return
      }
      setAvailabilityLoading(true)
      try {
        const results = await Promise.all(
          items.map(async (i) => {
            try {
              const res = await fetch(`/api/products/${i._id}`)
              if (!res.ok) return { id: i._id, ok: false, reason: 'unavailable' }
              const data = await res.json()
              const p = data?.data
              const categoryActive = p?.category?.isActive !== false
              const productActive = p?.isActive !== false
              const ok = !!(categoryActive && productActive)
              return { id: i._id, ok, reason: ok ? '' : !productActive ? 'Product unavailable' : 'Category inactive' }
            } catch {
              return { id: i._id, ok: false, reason: 'unavailable' }
            }
          })
        )
        if (cancelled) return
        const invalid: Record<string, string> = {}
        for (const r of results) {
          if (!r.ok) invalid[r.id] = r.reason
        }
        setInvalidItems(invalid)
      } finally {
        if (!cancelled) setAvailabilityLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [items])

  const handleCheckout = async () => {
    if (items.length === 0) return

    // Block checkout if any invalid items
    if (Object.keys(invalidItems).length > 0) {
      return
    }

    if (!isLoggedIn) {
      setPendingCheckout(true)
      setShowLoginModal(true)
      return
    }

    setCheckingOut(true)
    try {
      router.push(`/checkout?items=${encodeURIComponent(itemsParam)}`)
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckingOut(false)
    }
  }

  useEffect(() => {
    if (pendingCheckout && isLoggedIn && items.length > 0) {
      setPendingCheckout(false)
      setShowLoginModal(false)
      setCheckingOut(true)
      router.push(`/checkout?items=${encodeURIComponent(itemsParam)}`)
    }
  }, [pendingCheckout, isLoggedIn, items.length, itemsParam, router])

  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">
        <div className="cart-header">
          <h1 className="cart-title">
            Your Inventory
          </h1>
          <p className="cart-subtitle">
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <h3 className="cart-empty-title">Empty Cart</h3>
            <p className="cart-empty-message">Add some legendary gear to your inventory.</p>
            <Link href="/" className="mc-button">
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items-column">
              <div className="cart-items-list">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="cart-item"
                >
                  <div className="cart-item-content">
                    {/* Product Image */}
                    <Link
                      href={`/product/${item.slug}`}
                      className="cart-item-image"
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="pixelated" />
                      ) : (
                        <div className="cart-item-image-placeholder">📦</div>
                      )}
                    </Link>

                    {/* Product Info */}
                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <div className="cart-item-details">
                          <Link
                            href={`/product/${item.slug}`}
                            className="cart-item-name"
                          >
                            {item.name}
                          </Link>
                          {item.optionLabel ? (
                            <p className="cart-item-option">Option: {item.optionLabel}</p>
                          ) : null}
                          <p className="cart-item-price">{formatPrice(item.price)} each</p>
                        </div>
                        <p className="cart-item-total">{formatPrice(item.price * item.quantity)}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="cart-item-bottom">
                        <div className="cart-item-quantity">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="cart-item-qty-button"
                          >
                            −
                          </button>
                          <span className="cart-item-qty-display">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="cart-item-qty-button"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.key)}
                          className="cart-item-remove"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              <button
                onClick={clearCart}
                className="cart-clear-button"
              >
                Clear Inventory
              </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="cart-summary-column">
              <div className="cart-summary">
                <h2 className="cart-summary-title">Order Summary</h2>

                <div className="cart-summary-details">
                  <div className="cart-summary-row">
                    <span>Items</span>
                    <span className="cart-summary-row-value">{totalItems}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span className="cart-summary-row-value">{formatPrice(totalPrice)}</span>
                  </div>

                  <div className="cart-summary-total">
                    <div className="cart-summary-total-row">
                      <span>Total</span>
                      <span className="cart-summary-total-value">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {Object.keys(invalidItems).length > 0 && (
                  <div className="cart-invalid-items">
                    <p>Some items unavailable</p>
                    <ul>
                      {items.filter(i => invalidItems[i._id]).map((i) => (
                        <li key={i.key}>{i.name} — {invalidItems[i._id]}</li>
                      ))}
                    </ul>
                    <p>Remove them to proceed.</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || Object.keys(invalidItems).length > 0 || availabilityLoading}
                  className="cart-summary-checkout"
                >
                  {checkingOut ? 'Processing...' : (Object.keys(invalidItems).length > 0 ? 'Unavailable Items' : 'Proceed to Checkout')}
                </button>

                <Link
                  href="/"
                  className="cart-summary-continue"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <MinecraftLoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false)
          if (!isLoggedIn) {
            setPendingCheckout(false)
          }
        }}
      />
    </div>
  )
}

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}