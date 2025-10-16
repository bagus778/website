'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProductCard from '@/components/ProductCard'

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  images: string[]
  category: {
    _id: string
    name: string
    slug: string
    isActive?: boolean
  }
  options?: Array<{ label: string; price: number; commands?: Array<{ command: string; delay?: number; order?: number }> }>
  stock?: number
  isUnlimited: boolean
  isActive: boolean
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem, items } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.slug])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/products?slug=${params.slug}`)
      const data = await res.json()

      if (data.success && data.data.length > 0) {
        const currentProduct = data.data[0]
        setProduct(currentProduct)

        // Auto-select first option if product has options
        if (currentProduct.options && currentProduct.options.length > 0) {
          setSelectedOption(0)
        } else {
          setSelectedOption(null)
        }

        // Fetch related products from the same category
        const relatedRes = await fetch(`/api/products?active=true`)
        const relatedData = await relatedRes.json()
        if (relatedData.success) {
          const related = relatedData.data
            .filter((p: Product) => p._id !== currentProduct._id && p.category._id === currentProduct.category._id)
            .slice(0, 4)
          setRelatedProducts(related)
        }
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    if (!actionsEnabled) return

    const optIndex = selectedOption !== null ? selectedOption : undefined
    const price = optIndex !== undefined && product.options?.[optIndex] ? product.options[optIndex].price : product.price
    const optionLabel = optIndex !== undefined && product.options?.[optIndex] ? product.options[optIndex].label : undefined

    addItem(
      {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price,
        image: product.images[0],
        key: `${product._id}${optIndex !== undefined ? `|opt:${optIndex}` : ''}`,
        optionIndex: optIndex,
        optionLabel,
      },
      quantity
    )

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    if (!product) return
    if (!actionsEnabled) return

    const optIndex = selectedOption !== null ? selectedOption : undefined
    const price = optIndex !== undefined && product.options?.[optIndex] ? product.options[optIndex].price : product.price
    const optionLabel = optIndex !== undefined && product.options?.[optIndex] ? product.options[optIndex].label : undefined

    addItem(
      {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price,
        image: product.images[0],
        key: `${product._id}${optIndex !== undefined ? `|opt:${optIndex}` : ''}`,
        optionIndex: optIndex,
        optionLabel,
      },
      quantity
    )

    router.push('/cart')
  }

  const cartItem = items.find((item) => item._id === product?._id)
  const cartQuantity = cartItem?.quantity || 0

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <LoadingSpinner text="Loading item..." />
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return null
  }

  const maxQuantity = product.isUnlimited ? 99 : (product.stock || 0)
  const inStock = product.isUnlimited || (product.stock && product.stock > 0)
  const categoryActive = product.category?.isActive ?? true
  const isActive = product.isActive
  const canPurchase = isActive && categoryActive && inStock
  const optionRequired = !!(product.options && product.options.length > 0 && selectedOption === null)
  const actionsEnabled = canPurchase && !optionRequired

  return (
    <div className="page-container">
      <Navbar />

      <main className="main-content">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <Link href={`/?category=${product.category._id}`} className="breadcrumb-link">
            {product.category.name}
          </Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="product-layout">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="product-main-image">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="pixelated"
                />
              ) : (
                <div className="product-main-image-placeholder">📦</div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="product-image-controls">
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)}
                  className="mc-button"
                >
                  ◀ Previous
                </button>
                <span className="product-image-counter">{selectedImage + 1} / {product.images.length}</span>
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % product.images.length)}
                  className="mc-button"
                >
                  Next ▶
                </button>
              </div>
            )}

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="product-thumbnails">
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`product-thumbnail ${selectedImage === idx ? 'product-thumbnail-active' : 'product-thumbnail-inactive'}`}
                  >
                    <img src={image} alt={`${product.name} ${idx + 1}`} className="pixelated" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div>
              <div className="product-category-badge">
                <span>⚔️</span>
                {product.category.name}
              </div>
              <h1 className="product-name">{product.name}</h1>
              <p className="product-price">
                {formatPrice(selectedOption !== null && product.options?.[selectedOption] ? product.options[selectedOption].price : (product.options?.[0]?.price ?? product.price))}
              </p>
            </div>

            {/* Options */}
            {product.options && product.options.length > 0 && (
              <div className="product-options-container">
                <label className="product-options-label">Select Option</label>
                <div className="product-options-list">
                  {product.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`mc-button product-option ${(selectedOption ?? 0) === idx ? 'product-option-active' : 'product-option-inactive'}`}
                      type="button"
                    >
                      {opt.label} — {formatPrice(opt.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-description-container">
              {(!isActive || !categoryActive) && (
                <div
                  style={{
                    border: '2px solid',
                    borderColor: !isActive ? 'var(--theme-danger)' : 'var(--theme-warning)',
                    background: !isActive ? 'rgba(217, 83, 79, 0.2)' : 'rgba(240, 173, 78, 0.2)',
                    color: !isActive ? 'var(--theme-text-red)' : 'var(--theme-text-yellow)',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                  }}>
                  {!isActive ? '⚠️ Item Unavailable' : '⚠️ Category Inactive'}
                </div>
              )}
              <p className="product-description">{product.description}</p>
            </div>

            {/* Stock Status */}
            <div className="product-stock">
              {inStock ? (
                <>
                  <div
                    style={{
                      height: '0.75rem',
                      width: '0.75rem',
                      background: 'var(--theme-success)',
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }} />
                  <span className="product-stock-text product-stock-in-stock">
                    {product.isUnlimited ? 'Unlimited Stock' : `${product.stock} Available`}
                  </span>
                </>
              ) : (
                <>
                  <div
                    style={{
                      height: '0.75rem',
                      width: '0.75rem',
                      background: 'var(--theme-danger)',
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                    }} />
                  <span className="product-stock-text product-stock-out-of-stock">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {inStock && canPurchase && (
              <div className="product-quantity-section">
                <div className="product-quantity-controls">
                  <label className="product-quantity-label">Quantity:</label>
                  <div className="product-quantity-buttons">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="product-quantity-button"
                      disabled={quantity <= 1 || !actionsEnabled}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        setQuantity(Math.max(1, Math.min(maxQuantity, val)))
                      }}
                      className="product-quantity-input"
                      disabled={!actionsEnabled}
                      min={1}
                      max={maxQuantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      className="product-quantity-button"
                      disabled={quantity >= maxQuantity || !actionsEnabled}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="product-actions">
                  <button
                    onClick={handleAddToCart}
                    disabled={!actionsEnabled}
                    className={`mc-button product-action-button ${addedToCart ? 'product-action-add-to-cart-added' : 'product-action-add-to-cart'}`}
                  >
                    {addedToCart ? '✓ Added to Cart' : '+ Add to Cart'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={!actionsEnabled}
                    className="mc-button product-action-button product-action-buy-now"
                  >
                    Buy Now
                  </button>
                </div>

                {cartQuantity > 0 && (
                  <p className="product-cart-count">
                    {cartQuantity} {cartQuantity === 1 ? 'Item' : 'Items'} in cart
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* More Products Section */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <div className="related-products-header">
              <h2 className="related-products-title">
                ⚔️ Related Items
              </h2>
              <Link
                href={`/?category=${product.category._id}`}
                className="related-products-view-all"
              >
                View All →
              </Link>
            </div>
            <div className="related-products-grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
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