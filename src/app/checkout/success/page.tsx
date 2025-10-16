'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import StoreLayout from '@/components/layouts/StoreLayout'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <StoreLayout>
      <div className="success-container">
        <div className="success-box">
          <div className="success-icon-wrapper">
            <div className="success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="success-title">Purchase Complete</h1>
            <p className="success-subtitle">Thank you for your purchase!</p>
          </div>

          {orderNumber && (
            <div className="success-order-number">
              <p className="success-order-label">Order Number</p>
              <p className="success-order-value">{orderNumber}</p>
            </div>
          )}

          <div className="success-message">
            <p className="success-message-text">
              Your order will be fulfilled on our Minecraft server shortly.
            </p>
          </div>

          <Link
            href="/"
            className="mc-button success-continue"
          >
            Continue Shopping
          </Link>

          <div className="success-footer">
            <p className="success-footer-text">Questions? Contact our support team.</p>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}