'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useMinecraftUser } from '@/contexts/MinecraftUserContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!)

interface Product {
  _id: string
  name: string
  price: number
  images: string[]
  isActive: boolean
  category?: { _id: string; name: string; slug: string; isActive?: boolean }
  options?: Array<{ label: string; price: number }>
}

interface CheckoutItem { product: Product; quantity: number; optionIndex: number | undefined; unitPrice: number; optionLabel: string | undefined }

// Payment Form Component
function PaymentForm({
  items,
  formData,
  totalAmount,
  onSuccess
}: {
  items: CheckoutItem[]
  formData: { email: string }
  totalAmount: number
  onSuccess: (orderId: string, orderNumber: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { username } = useMinecraftUser()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!username) {
      setError('Please login with your Minecraft username before completing checkout.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Create order first (without processing it)
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            username: username,
            email: formData.email,
          },
          items: items.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            optionIndex: item.optionIndex
          })),
          paymentProvider: 'stripe',
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Failed to create order')
      }

      const orderId = orderData.data._id
      const orderNumber = orderData.data.orderNumber

      // Confirm payment with Stripe
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order=${orderNumber}`,
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        setSubmitting(false)
        return
      }

      // Process order (generate commands) after successful payment
      const processResponse = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' }),
      })

      if (!processResponse.ok) {
        throw new Error('Failed to process order')
      }

      // Success!
      onSuccess(orderId, orderNumber)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-form-group">
        <label className="checkout-form-label">
          Payment Information
        </label>
        <div style={{
          padding: '12px',
          border: '1px solid #333',
          borderRadius: '4px',
          backgroundColor: '#1a1a1a'
        }}>
          <PaymentElement />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !stripe || !elements || !username}
        className="checkout-form-submit"
      >
        {submitting
          ? 'Processing Payment...'
          : `Pay ${formatPrice(totalAmount)}`}
      </button>

      <p className="checkout-form-terms">
        By completing this purchase, you agree to our terms of service
      </p>
    </form>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const { username } = useMinecraftUser()

  const [items, setItems] = useState<CheckoutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card')
  const [processingCrypto, setProcessingCrypto] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
  })

  useEffect(() => {
    loadCheckoutItems()
  }, [])

  const loadCheckoutItems = async () => {
    try {
      setLoading(true)
      const itemsParam = searchParams.get('items')
      let checkoutItems: CheckoutItem[] = []

      if (itemsParam) {
        const entries = itemsParam.split(',').map((pair) => {
          const [id, qty, opt] = pair.split(':')
          return { id, qty: parseInt(qty || '1'), opt: opt !== undefined ? parseInt(opt) : undefined }
        })
        const products = await Promise.all(
          entries.map(async (e) => {
            const res = await fetch(`/api/products/${e.id}`)
            const data = await res.json()
            return data.success ? (data.data as Product) : null
          })
        )
        checkoutItems = entries
          .map((entry, idx) => {
            const product = products[idx]
            if (!product) return null
            const optIndex = entry.opt
            const opt = typeof optIndex === 'number' && product.options?.[optIndex] ? product.options[optIndex] : undefined
            const unitPrice = opt ? opt.price : product.price
            const optionLabel = opt ? opt.label : undefined
            return { product, quantity: entry.qty, optionIndex: optIndex, unitPrice, optionLabel }
          })
          .filter((item): item is CheckoutItem => item !== null) as CheckoutItem[]
      } else {
        const productId = searchParams.get('product')
        if (productId) {
          const res = await fetch(`/api/products/${productId}`)
          const data = await res.json()
          if (data.success) {
            const product = data.data as Product
            checkoutItems = [{ product, quantity: 1, optionIndex: undefined, unitPrice: product.price, optionLabel: undefined }]
          }
        }
      }

      setItems(checkoutItems)

      // Create payment intent if there are items
      if (checkoutItems.length > 0) {
        const totalAmount = checkoutItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        const paymentIntentResponse = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            metadata: {
              itemsCount: checkoutItems.length,
            },
          }),
        })

        const paymentIntentData = await paymentIntentResponse.json()
        if (paymentIntentData.success) {
          setClientSecret(paymentIntentData.clientSecret)
        } else {
          setError('Failed to initialize payment. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error loading checkout items:', error)
      setError('Failed to load checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePaymentSuccess = (orderId: string, orderNumber: string) => {
    // Clear cart if items came from cart
    if (searchParams.get('items')) {
      clearCart()
    }

    // Redirect to success page
    router.push(`/checkout/success?order=${orderNumber}`)
  }

  const handleCryptoPayment = async () => {
    if (!username) {
      setError('Please login with your Minecraft username before completing checkout.')
      return
    }

    if (!formData.email) {
      setError('Please enter your email address.')
      return
    }

    setProcessingCrypto(true)
    setError('')

    try {
      // Create order first (without processing it)
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            username: username,
            email: formData.email,
          },
          items: items.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            optionIndex: item.optionIndex
          })),
          paymentProvider: 'coinbase',
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Failed to create order')
      }

      const orderId = orderData.data._id
      const orderNumber = orderData.data.orderNumber

      // Create Coinbase charge
      const chargeResponse = await fetch('/api/coinbase/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          orderId: orderId,
          orderNumber: orderNumber,
          customerEmail: formData.email,
          description: `${items.length} item(s) for Minecraft player ${username}`,
        }),
      })

      const chargeData = await chargeResponse.json()

      if (!chargeResponse.ok) {
        throw new Error(chargeData.message || 'Failed to create crypto payment')
      }

      // Redirect to Coinbase hosted payment page
      window.location.href = chargeData.hostedUrl
    } catch (err: any) {
      setError(err.message)
      setProcessingCrypto(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const unavailableItems = items.filter((item) => !item.product?.isActive || item.product?.category?.isActive === false)

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <LoadingSpinner text="Loading checkout..." />
        </main>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="empty-state">
            <h3 className="empty-state-title">No Items Selected</h3>
            <p className="empty-state-message">Please add items to your cart to checkout.</p>
            <Link href="/" className="mc-button">
              Browse Items
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-container">
      <Navbar />

      <main className="checkout-container">
        <h1 className="checkout-title">
          Final Checkout
        </h1>

        <div className="checkout-layout">
          {/* Checkout Form */}
          <div className="checkout-form-column">
            <div className="checkout-form-container">
              <h2 className="checkout-form-title">Player Information</h2>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              {unavailableItems.length > 0 && (
                <div className="alert alert-danger">
                  <p>Some items unavailable</p>
                  <ul className="alert-list">
                    {unavailableItems.map((i, idx) => (
                      <li key={`${i.product._id}-${i.optionIndex ?? 'base'}-${idx}`} className="alert-list-item">{i.product.name} — {i.product.isActive ? 'Category inactive' : 'Product unavailable'}</li>
                    ))}
                  </ul>
                  <p>Remove them from cart to continue.</p>
                </div>
              )}

              <div className="checkout-form-group">
                <label className="checkout-form-label">
                  Minecraft Username
                </label>
                <div className="checkout-form-input-readonly">
                  {username ? (
                    <span className="checkout-form-input-value">{username}</span>
                  ) : (
                    <span className="checkout-form-input-placeholder">Not set — please login</span>
                  )}
                </div>
                <p className="checkout-form-help">
                  Order will be fulfilled to this player
                </p>
              </div>

              <div className="checkout-form-group">
                <label className="checkout-form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="steve@minecraft.net"
                  className="checkout-form-input"
                  required
                />
                <p className="checkout-form-help">
                  For order confirmation
                </p>
              </div>

              <div className="checkout-form-group">
                <label className="checkout-form-label">
                  Payment Method
                </label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={paymentMethod === 'card' ? 'mc-button' : 'mc-button-secondary'}
                    style={{ flex: 1 }}
                  >
                    💳 Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={paymentMethod === 'crypto' ? 'mc-button' : 'mc-button-secondary'}
                    style={{ flex: 1 }}
                  >
                    ₿ Cryptocurrency
                  </button>
                </div>
                <p className="checkout-form-help">
                  {paymentMethod === 'card'
                    ? 'Pay with credit/debit card via Stripe'
                    : 'Pay with Bitcoin, Ethereum, USDC, and more'}
                </p>
              </div>

              {paymentMethod === 'card' ? (
                !clientSecret ? (
                  <div className="checkout-form-loading">
                    <LoadingSpinner text="Initializing payment..." />
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      items={items}
                      formData={formData}
                      totalAmount={totalAmount}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={handleCryptoPayment}
                    disabled={processingCrypto || unavailableItems.length > 0 || !username}
                    className="checkout-form-submit"
                  >
                    {processingCrypto
                      ? 'Redirecting to payment...'
                      : unavailableItems.length > 0
                        ? 'Unavailable Items'
                        : !username
                          ? 'Login Required'
                          : `Pay with Crypto - ${formatPrice(totalAmount)}`}
                  </button>
                  <p className="checkout-form-terms">
                    You'll be redirected to Coinbase Commerce to complete your payment
                  </p>
                  <p className="checkout-form-terms">
                    By completing this purchase, you agree to our terms of service
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-summary-column">
            <div className="order-summary">
              <h2 className="order-summary-title">Order Summary</h2>

              <div className="order-summary-items">
                {items.map((item, index) => (
                  <div key={`${item.product._id}-${item.optionIndex ?? 'base'}-${index}`} className="order-summary-item">
                    <div className="order-summary-item-image">
                      {item.product.images[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="pixelated" />
                      ) : (
                        <div className="order-summary-item-image-placeholder">📦</div>
                      )}
                    </div>
                    <div className="order-summary-item-details">
                      <h3 className="order-summary-item-name">{item.product.name}</h3>
                      {item.optionLabel ? (
                        <p className="order-summary-item-option">Option: {item.optionLabel}</p>
                      ) : null}
                      <p className="order-summary-item-price">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                      <p className="order-summary-item-total">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary-totals">
                <div className="order-summary-row">
                  <span>Items</span>
                  <span className="order-summary-row-value">{totalItems}</span>
                </div>
                <div className="order-summary-row">
                  <span>Subtotal</span>
                  <span className="order-summary-row-value">{formatPrice(totalAmount)}</span>
                </div>

                <div className="order-summary-total">
                  <div className="order-summary-total-row">
                    <span>Total</span>
                    <span className="order-summary-total-value">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
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
