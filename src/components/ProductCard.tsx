'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  images: string[]
  category?: {
    _id: string
    name: string
    slug: string
    isActive?: boolean
  }
  options?: Array<{ label: string; price: number }>
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [isAdded, setIsAdded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const hasOptions = product.options && product.options.length > 0
  const priceRange = hasOptions
    ? {
      min: Math.min(...product.options!.map(o => o.price)),
      max: Math.max(...product.options!.map(o => o.price))
    }
    : null

  const handleAddToCart = () => {
    const categoryActive = product.category?.isActive ?? true
    if (!categoryActive) return
    addItem({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0],
      key: `${product._id}`,
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const isCategoryInactive = product.category?.isActive === false

  return (
    <article
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card-hover-shadow" />

      <Link href={`/product/${product.slug}`}>
        <div className="product-card-image-wrapper">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className={`product-card-image pixelated ${isHovered ? 'scale-110 brightness-110' : ''}`}
            />
          ) : (
            <div className="product-card-image-placeholder">
              <svg className="product-card-image-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="14" rx="2" />
                <path d="M3 17l4-4m14 4l-6-6M7 13l4-4 6 6" />
              </svg>
            </div>
          )}
          {product.category && (
            <div className="product-card-category-badge">
              {product.category.name}
            </div>
          )}
          {isHovered && <div className="product-card-image-overlay" />}
        </div>
      </Link>

      <div className="product-card-content">
        <div className="product-card-title-wrapper">
          <h3 className="product-card-title">
            <Link href={`/product/${product.slug}`} className="product-card-title-link">
              {product.name}
            </Link>
          </h3>
        </div>

        <p className="product-card-description">{product.description}</p>

        <div className="product-card-price-wrapper">
          <div className="product-card-price">
            {hasOptions && priceRange
              ? `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`
              : formatPrice(product.price)
            }
          </div>
        </div>

        <div className="product-card-actions">
          {hasOptions ? (
            <Link
              href={`/product/${product.slug}`}
              className="product-card-button product-card-button-secondary"
            >
              View Options
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isCategoryInactive}
              className={`product-card-button ${
                isAdded
                  ? 'product-card-button-added'
                  : isCategoryInactive
                    ? 'product-card-button-disabled'
                    : 'product-card-button-primary'
              }`}
              aria-label={`Add ${product.name} to cart`}
            >
              {isAdded ? '✓ Added!' : isCategoryInactive ? 'Unavailable' : '+ Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}
