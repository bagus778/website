'use client'

import { useEffect, useMemo, useState } from 'react'
import StoreLayout from '@/components/layouts/StoreLayout'
import ProductCard from '@/components/ProductCard'
import CategoryPill from '@/components/CategoryPill'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
}

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
  }
  options?: Array<{ label: string; price: number }>
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [dataFetched, setDataFetched] = useState(false)
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number } | null>(null)

  useEffect(() => {
    // Only fetch if we haven't fetched yet
    if (!dataFetched) {
      fetchData()
    }
  }, [dataFetched])

  const fetchData = async () => {
    try {
      // Fetch store data, categories, and products in parallel
      const [settingsRes, categoriesRes, productsRes] = await Promise.all([
        fetch('/api/admin/settings', {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        fetch('/api/categories?active=true', {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        fetch('/api/products?active=true', {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        }),
      ])

      const [settingsData, categoriesData, productsData] = await Promise.all([
        settingsRes.json(),
        categoriesRes.json(),
        productsRes.json()
      ])

      // Set server info if available
      if (settingsData.success && settingsData.data?.minecraft) {
        setServerInfo({
          ip: settingsData.data.minecraft.serverIp,
          port: settingsData.data.minecraft.serverPort || 25565
        })
      }

      if (categoriesData.success) setCategories(categoriesData.data || [])
      if (productsData.success) setAllProducts(productsData.data || [])

      setDataFetched(true)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays on error to prevent infinite loading
      setCategories([])
      setAllProducts([])
      setServerInfo(null)
      setDataFetched(true)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = allProducts

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category._id === selectedCategory)
    }

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter((p) =>
        [p.name, p.description, p.category?.name].some((x) => x?.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [allProducts, selectedCategory, query])

  return (
    <StoreLayout showSearch searchQuery={query} onSearchChange={setQuery}>
      {loading ? (
        <LoadingSpinner text="Loading store..." />
      ) : (
        <>
          {/* Server Info */}
          {serverInfo && (
            <section id="server-info" className="server-info-section">
              <div className="server-info-box">
                <h3 className="server-info-title">Join Our Server</h3>
                <p className="server-info-ip">
                  IP: {serverInfo.ip}{serverInfo.port !== 25565 ? `:${serverInfo.port}` : ''}
                </p>
                <p className="server-info-description">
                  Connect to our Minecraft server and start your adventure!
                </p>
              </div>
            </section>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <section id="categories" className="categories-section">
              <div className="categories-header">
                <h2 className="categories-title">Shop by Category</h2>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`categories-reset ${selectedCategory ? 'categories-reset-inactive' : 'categories-reset-active'}`}
                  aria-pressed={!selectedCategory}
                >
                  ↺ Reset
                </button>
              </div>

              <div className="categories-list">
                <CategoryPill active={!selectedCategory} label="All Items" onClick={() => setSelectedCategory(null)} />
                {categories.map((category) => (
                  <CategoryPill
                    key={category._id}
                    active={selectedCategory === category._id}
                    label={category.name}
                    image={category.image}
                    onClick={() => setSelectedCategory(category._id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Products */}
          <section id="products" className="products-section">
            <div className="products-header">
              <div className="products-header-content">
                <h2 className="products-title">Featured Items</h2>
                <p className="products-subtitle">Legendary gear for your adventures</p>
              </div>
              {allProducts.length > 0 && (
                <p className="products-count">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
                </p>
              )}
            </div>

            {allProducts.length === 0 && categories.length === 0 ? (
              <div className="empty-inventory">
                <h3 className="empty-inventory-title">Empty Inventory</h3>
                <p className="empty-inventory-message">Start by adding categories and products in the admin panel.</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="no-items-found">
                <h3 className="no-items-title">No Items Found</h3>
                <p className="no-items-message">Try a different search or reset your filters.</p>
                {query && (
                  <button onClick={() => setQuery('')} className="mc-button">
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </StoreLayout>
  )
}