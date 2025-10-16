'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'

interface Category {
  _id: string
  name: string
  slug: string
}

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  images: string[]
  category: Category
  commands: Array<{
    command: string
    delay: number
    order: number
  }>
  isActive: boolean
  isUnlimited: boolean
  stock?: number
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  // ui helpers
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Error deleting product')
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Error deleting product')
    }
  }

  const handleToggleActive = async (product: Product) => {
    const next = !product.isActive
    // optimistic
    setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isActive: next } : p)))
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch (err) {
      // rollback
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isActive: !next } : p)))
      console.error('Error toggling product status:', err)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => (statusFilter === 'all' ? true : statusFilter === 'active' ? p.isActive : !p.isActive))
      .filter((p) => (categoryFilter === 'all' ? true : p.category?._id === categoryFilter))
      .filter((p) =>
        !q
          ? true
          : [p.name, p.slug, p.description, p.category?.name]
            .filter(Boolean)
            .some((x) => x!.toLowerCase().includes(q))
      )
  }, [products, query, statusFilter, categoryFilter])

  return (
    <AdminLayout title="Products">
      <div className="admin-space-y-6">
        {/* Action Bar */}
        <div className="admin-flex admin-items-center admin-justify-between">
          <button
            onClick={() => setShowCreateModal(true)}
            className="admin-button admin-button-primary"
          >
            + Create Product
          </button>
        </div>

        {/* Toolbar */}
        <div className="admin-flex admin-flex-col admin-gap-4">
          <div className="admin-flex-1">
            <div className="admin-relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, slug, description…"
                className="admin-form-input admin-form-input-with-icon"
              />
              <svg className="admin-form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          <div className="admin-flex admin-items-center admin-gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="admin-form-select"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-form-select"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">
            <p className="admin-table-empty-text">No products match your filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Commands</th>
                  <th className="admin-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="admin-product-cell">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="admin-product-image" />
                        ) : (
                          <div className="admin-product-image-placeholder">📦</div>
                        )}
                        <div>
                          <div className="admin-product-name">{product.name}</div>
                          <div className="admin-product-slug">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.category?.name}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.isUnlimited ? '∞' : product.stock ?? 0}</td>
                    <td>
                      <label className="admin-toggle">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={() => handleToggleActive(product)}
                          className="admin-toggle-input"
                        />
                        <span className="admin-toggle-slider" />
                        <span className={`admin-toggle-label ${product.isActive ? 'is-active' : ''}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td>{product.commands?.length || 0}</td>
                    <td className="admin-text-right admin-text-sm admin-font-medium">
                      <button
                        onClick={() => setEditProduct(product)}
                        className="admin-action-link admin-mr-4"
                      >
                        Edit
                      </button>
                      <button onClick={() => setConfirmDelete({ open: true, id: product._id, name: product.name })} className="admin-action-link-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchProducts()
          }}
        />
      )}

      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSuccess={() => {
            setEditProduct(null)
            fetchProducts()
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete.name || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={async () => {
          if (confirmDelete.id) {
            await deleteProduct(confirmDelete.id)
          }
          setConfirmDelete({ open: false })
        }}
        variant="danger"
      />
    </AdminLayout>
  )
}

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

function CreateProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    isActive: true,
    isUnlimited: true,
    stock: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [commands, setCommands] = useState<Array<{ command: string; delay: number; order: number }>>([
    { command: '', delay: 0, order: 1 },
  ])
  const [options, setOptions] = useState<Array<{
    label: string
    price: string
    commands: Array<{ command: string; delay: number; order: number }>
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))

    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      }))
    }
  }

  const handleCommandChange = (index: number, field: string, value: string | number) => {
    setCommands((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'products')
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data?.success && data.url) {
          newUrls.push(data.url as string)
        }
      } catch (e) {
        console.error('Upload failed', e)
      }
    }
    if (newUrls.length) setImages((prev) => [...prev, ...newUrls])
  }

  const removeImageAt = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))
  const moveImage = (idx: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev]
      const newIndex = Math.max(0, Math.min(prev.length - 1, idx + dir))
      const [item] = next.splice(idx, 1)
      next.splice(newIndex, 0, item)
      return next
    })

  const addCommand = () => setCommands((prev) => [...prev, { command: '', delay: 0, order: prev.length + 1 }])
  const removeCommand = (index: number) => setCommands((prev) => prev.filter((_, i) => i !== index))

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { label: '', price: '', commands: [{ command: '', delay: 0, order: 1 }] },
    ])
  }
  const removeOption = (index: number) => setOptions((prev) => prev.filter((_, i) => i !== index))
  const updateOptionField = (index: number, field: 'label' | 'price', value: string) =>
    setOptions((prev) => {
      const next = [...prev]
        ; (next[index] as any)[field] = value
      return next
    })
  const updateOptionCommand = (
    optIndex: number,
    cmdIndex: number,
    field: 'command' | 'delay' | 'order',
    value: string
  ) =>
    setOptions((prev) => {
      const next = [...prev]
      const cmds = [...next[optIndex].commands]
      const v = field === 'delay' || field === 'order' ? parseInt(value || '0') : value
      cmds[cmdIndex] = { ...cmds[cmdIndex], [field]: v as any }
      next[optIndex] = { ...next[optIndex], commands: cmds }
      return next
    })
  const addOptionCommand = (optIndex: number) =>
    setOptions((prev) => {
      const next = [...prev]
      const cmds = [...next[optIndex].commands, { command: '', delay: 0, order: next[optIndex].commands.length + 1 }]
      next[optIndex] = { ...next[optIndex], commands: cmds }
      return next
    })
  const removeOptionCommand = (optIndex: number, cmdIndex: number) =>
    setOptions((prev) => {
      const next = [...prev]
      const cmds = next[optIndex].commands.filter((_, i) => i !== cmdIndex)
      next[optIndex] = { ...next[optIndex], commands: cmds }
      return next
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const filteredOptions = options
        .filter((o) => o.label.trim() !== '' && o.price !== '')
        .map((o) => ({
          label: o.label.trim(),
          price: parseFloat(o.price),
          commands: o.commands.filter((c) => c.command.trim() !== ''),
        }))

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images,
          price: filteredOptions.length > 0 ? 0 : parseFloat(formData.price),
          stock: formData.isUnlimited ? undefined : parseInt(formData.stock) || 0,
          commands: filteredOptions.length > 0 ? [] : commands.filter((c) => c.command.trim() !== ''),
          options: filteredOptions,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create product')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card-large">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Create Product</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>

        <div className="admin-modal-body-scrollable">
          {error && (
            <div className="admin-alert admin-alert-danger admin-mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-space-y-4">
            {/* Images */}
            <div>
              <div className="admin-mb-2 admin-flex admin-items-center admin-justify-between">
                <label className="admin-form-label">Images</label>
                <span className="admin-text-xs admin-text-gray">First image is used as cover</span>
              </div>
              <div className="admin-image-gallery">
                {images.map((url, idx) => (
                  <div key={url + idx} className="admin-image-item">
                    <img src={url} alt={`Image ${idx + 1}`} />
                    <div className="admin-image-controls">
                      <button type="button" onClick={() => moveImage(idx, -1)} className="admin-image-control-btn">◀</button>
                      <span className="admin-image-label">{idx === 0 ? 'Cover' : idx + 1}</span>
                      <button type="button" onClick={() => moveImage(idx, 1)} className="admin-image-control-btn">▶</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="admin-image-remove"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="admin-image-add-button">
                  <input type="file" accept="image/*" multiple onChange={(e) => uploadFiles(e.target.files)} className="admin-hidden" />
                  <span className="admin-text-sm">+ Add</span>
                </label>
              </div>
            </div>

            <div className="admin-grid admin-grid-2">
              <div>
                <label className="admin-form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="admin-form-input"
                />
              </div>
              <div>
                <label className="admin-form-label">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label className="admin-form-label">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                required
                className="admin-form-textarea"
              />
            </div>

            <div className="admin-grid admin-grid-2">
              {options.length === 0 && (
                <div>
                  <label className="admin-form-label">Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="admin-form-input"
                  />
                </div>
              )}
              <div>
                <label className="admin-form-label">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="admin-form-select"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-grid admin-grid-2">
              <div className="admin-flex admin-items-center admin-gap-2 admin-rounded-xl admin-border admin-bg-gray admin-p-3">
                <input
                  type="checkbox"
                  name="isUnlimited"
                  checked={formData.isUnlimited}
                  onChange={(e) => setFormData((s) => ({ ...s, isUnlimited: e.target.checked }))}
                  className="admin-form-checkbox"
                />
                <label className="admin-text-sm admin-text-gray">Unlimited Stock</label>
              </div>

              {!formData.isUnlimited && (
                <div>
                  <label className="admin-form-label">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="admin-form-input"
                  />
                </div>
              )}
            </div>

            {options.length === 0 && (
              <div>
                <div className="admin-form-section-header">
                  <label className="admin-form-section-title">Commands</label>
                  <button
                    type="button"
                    onClick={addCommand}
                    className="admin-form-section-link"
                  >
                    + Add Command
                  </button>
                </div>
                <div className="admin-space-y-4">
                  {commands.map((cmd, index) => (
                    <div key={index} className="admin-command-row">
                      <input
                        type="text"
                        value={cmd.command}
                        onChange={(e) => handleCommandChange(index, 'command', e.target.value)}
                        placeholder="give {player} diamond 10"
                        className="admin-command-input admin-form-input"
                      />
                      <input
                        type="number"
                        value={cmd.delay}
                        onChange={(e) => handleCommandChange(index, 'delay', parseInt(e.target.value) || 0)}
                        placeholder="Delay (s)"
                        className="admin-command-delay admin-form-input"
                      />
                      {commands.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCommand(index)}
                          className="admin-command-remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="admin-mt-1 admin-text-xs admin-text-gray">Use placeholders: {'{player}'}, {'{product}'}, {'{order}'}</p>
              </div>
            )}

            {/* Options (optional) */}
            <div className="admin-form-section">
              <div className="admin-form-section-header">
                <label className="admin-form-section-title">Options (optional)</label>
                <button type="button" onClick={addOption} className="admin-form-section-link">
                  + Add Option
                </button>
              </div>
              {options.length === 0 ? (
                <p className="admin-text-sm admin-text-gray">No options added</p>
              ) : (
                <div className="admin-space-y-4">
                  {options.map((opt, oi) => (
                    <div key={oi} className="admin-option-card">
                      <div className="admin-option-card-header">
                        <div className="admin-option-card-inputs">
                          <input
                            type="text"
                            placeholder="Option label (e.g., Monthly)"
                            value={opt.label}
                            onChange={(e) => updateOptionField(oi, 'label', e.target.value)}
                            className="admin-form-input"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                            value={opt.price}
                            onChange={(e) => updateOptionField(oi, 'price', e.target.value)}
                            className="admin-form-input"
                          />
                        </div>
                        <button type="button" onClick={() => removeOption(oi)} className="admin-option-card-remove">Remove</button>
                      </div>
                      <div>
                        <div className="admin-form-section-header">
                          <label className="admin-form-label">Commands for this option</label>
                          <button type="button" onClick={() => addOptionCommand(oi)} className="admin-form-section-link">+ Add Command</button>
                        </div>
                        <div className="admin-space-y-4">
                          {opt.commands.map((cmd, ci) => (
                            <div key={ci} className="admin-command-row">
                              <input
                                type="text"
                                value={cmd.command}
                                onChange={(e) => updateOptionCommand(oi, ci, 'command', e.target.value)}
                                placeholder="give {player} diamond 10"
                                className="admin-command-input admin-form-input"
                              />
                              <input
                                type="number"
                                value={cmd.delay}
                                onChange={(e) => updateOptionCommand(oi, ci, 'delay', e.target.value)}
                                placeholder="Delay (s)"
                                className="admin-command-delay admin-form-input"
                              />
                              {opt.commands.length > 1 && (
                                <button type="button" onClick={() => removeOptionCommand(oi, ci)} className="admin-command-remove">Remove</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-form-button-group pt-2">
              <button
                type="button"
                onClick={onClose}
                className="admin-button admin-button-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="admin-button admin-button-primary"
              >
                {loading ? <span className="admin-loading-spinner h-4 w-4" /> : null}
                {loading ? 'Creating…' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditProductModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    category: product.category._id,
    isActive: product.isActive,
    isUnlimited: product.isUnlimited,
    stock: product.stock?.toString() || '',
  })
  const [images, setImages] = useState<string[]>(product.images || [])
  const [commands, setCommands] = useState(product.commands.length > 0 ? product.commands : [{ command: '', delay: 0, order: 1 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))

    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      }))
    }
  }

  const handleCommandChange = (index: number, field: string, value: string | number) => {
    setCommands((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'products')
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok && data?.success && data.url) {
          newUrls.push(data.url as string)
        }
      } catch (e) {
        console.error('Upload failed', e)
      }
    }
    if (newUrls.length) setImages((prev) => [...prev, ...newUrls])
  }

  const removeImageAt = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))
  const moveImage = (idx: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev]
      const newIndex = Math.max(0, Math.min(prev.length - 1, idx + dir))
      const [item] = next.splice(idx, 1)
      next.splice(newIndex, 0, item)
      return next
    })

  const addCommand = () => setCommands((prev) => [...prev, { command: '', delay: 0, order: prev.length + 1 }])
  const removeCommand = (index: number) => setCommands((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images,
          price: parseFloat(formData.price),
          stock: formData.isUnlimited ? undefined : parseInt(formData.stock) || 0,
          commands: commands.filter((c) => c.command.trim() !== ''),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update product')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card-large">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Edit Product</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>

        <div className="admin-modal-body-scrollable">
          {error && (
            <div className="admin-alert admin-alert-danger admin-mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-space-y-4">
            {/* Images */}
            <div>
              <div className="admin-mb-2 admin-flex admin-items-center admin-justify-between">
                <label className="admin-form-label">Images</label>
                <span className="admin-text-xs admin-text-gray">First image is used as cover</span>
              </div>
              <div className="admin-image-gallery">
                {images.map((url, idx) => (
                  <div key={url + idx} className="admin-image-item">
                    <img src={url} alt={`Image ${idx + 1}`} />
                    <div className="admin-image-controls">
                      <button type="button" onClick={() => moveImage(idx, -1)} className="admin-image-control-btn">◀</button>
                      <span className="admin-image-label">{idx === 0 ? 'Cover' : idx + 1}</span>
                      <button type="button" onClick={() => moveImage(idx, 1)} className="admin-image-control-btn">▶</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="admin-image-remove"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="admin-image-add-button">
                  <input type="file" accept="image/*" multiple onChange={(e) => uploadFiles(e.target.files)} className="admin-hidden" />
                  <span className="admin-text-sm">+ Add</span>
                </label>
              </div>
            </div>

            <div className="admin-grid admin-grid-2">
              <div>
                <label className="admin-form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="admin-form-input"
                />
              </div>
              <div>
                <label className="admin-form-label">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="admin-form-input"
                />
              </div>
            </div>

            <div>
              <label className="admin-form-label">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                required
                className="admin-form-textarea"
              />
            </div>

            <div className="admin-grid admin-grid-2">
              <div>
                <label className="admin-form-label">Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="admin-form-input"
                />
              </div>
              <div>
                <label className="admin-form-label">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="admin-form-select"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-grid admin-grid-2">
              <div className="admin-flex admin-items-center admin-gap-2 admin-rounded-xl admin-border admin-bg-gray admin-p-3">
                <input
                  type="checkbox"
                  name="isUnlimited"
                  checked={formData.isUnlimited}
                  onChange={(e) => setFormData((s) => ({ ...s, isUnlimited: e.target.checked }))}
                  className="admin-form-checkbox"
                />
                <label className="admin-text-sm admin-text-gray">Unlimited Stock</label>
              </div>

              {!formData.isUnlimited && (
                <div>
                  <label className="admin-form-label">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="admin-form-input"
                  />
                </div>
              )}
            </div>

            {/* Commands */}
            <div>
              <div className="admin-form-section-header">
                <label className="admin-form-section-title">Commands</label>
                <button
                  type="button"
                  onClick={addCommand}
                  className="admin-form-section-link"
                >
                  + Add Command
                </button>
              </div>
              <div className="admin-space-y-4">
                {commands.map((cmd, index) => (
                  <div key={index} className="admin-command-row">
                    <input
                      type="text"
                      value={cmd.command}
                      onChange={(e) => handleCommandChange(index, 'command', e.target.value)}
                      placeholder="give {player} diamond 10"
                      className="admin-command-input admin-form-input"
                    />
                    <input
                      type="number"
                      value={cmd.delay}
                      onChange={(e) => handleCommandChange(index, 'delay', parseInt(e.target.value) || 0)}
                      placeholder="Delay (s)"
                      className="admin-command-delay admin-form-input"
                    />
                    {commands.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCommand(index)}
                        className="admin-command-remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="admin-mt-1 admin-text-xs admin-text-gray">Use placeholders: {'{player}'}, {'{product}'}, {'{order}'}</p>
            </div>

            <div className="admin-form-button-group admin-pt-2">
              <button
                type="button"
                onClick={onClose}
                className="admin-button admin-button-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="admin-button admin-button-primary"
              >
                {loading ? <span className="admin-loading-spinner admin-h-4 admin-w-4" /> : null}
                {loading ? 'Updating…' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
