'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  // UI helpers
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories', { cache: 'no-store' })
      const data = await response.json()
      if (data.success) setCategories(data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setCategories((prev) => prev.filter((c) => c._id !== id))
      } else {
        alert('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setCategories((prev) => prev.filter((c) => c._id !== id))
      } else {
        alert('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const handleToggleActive = async (category: Category) => {
    const next = !category.isActive
    // optimistic update
    setCategories((prev) => prev.map((c) => (c._id === category._id ? { ...c, isActive: next } : c)))
    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      if (!res.ok) throw new Error('Failed to update category')
    } catch (err) {
      // rollback
      setCategories((prev) => prev.map((c) => (c._id === category._id ? { ...c, isActive: !next } : c)))
      console.error('Error toggling category status:', err)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return categories
      .filter((c) => (statusFilter === 'all' ? true : statusFilter === 'active' ? c.isActive : !c.isActive))
      .filter((c) => (!q ? true : [c.name, c.slug, c.description].filter(Boolean).some((x) => x!.toLowerCase().includes(q))))
  }, [categories, query, statusFilter])

  return (
    <AdminLayout title="Categories">
      <div className="admin-space-y-6">
        {/* Action Bar */}
        <div className="admin-flex admin-items-center admin-justify-between">
          <button
            onClick={() => setShowCreateModal(true)}
            className="admin-button admin-button-primary"
          >
            + Create Category
          </button>
        </div>

        {/* Toolbar */}
        <div className="admin-flex admin-flex-col admin-gap-4 admin-md-flex-row admin-md-items-center">
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
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">
            <div className="admin-mx-auto admin-mb-2 admin-flex admin-h-12 admin-w-12 admin-items-center admin-justify-center admin-rounded-xl admin-bg-gray admin-text-2xl">🗂️</div>
            <p className="admin-table-empty-text">No categories match your filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="admin-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="admin-flex admin-items-center admin-gap-3">
                        <div>
                          <div className="admin-text-sm admin-font-semibold admin-text-white">{category.name}</div>
                          <div className="admin-text-xs admin-text-gray">{category.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-max-w-28">
                      <span className="admin-line-clamp-2 admin-block">
                        {category.description || '—'}
                      </span>
                    </td>
                    <td>
                      <label className="admin-toggle">
                        <input
                          type="checkbox"
                          checked={category.isActive}
                          onChange={() => handleToggleActive(category)}
                          className="admin-toggle-input"
                        />
                        <span className="admin-toggle-slider" />
                        <span className={`admin-toggle-label ${category.isActive ? 'is-active' : ''}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td className="admin-text-right admin-text-sm admin-font-medium">
                      <button
                        onClick={() => setEditCategory(category)}
                        className="admin-action-link admin-mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ open: true, id: category._id, name: category.name })}
                        className="admin-action-link-danger"
                      >
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

      {showCreateModal ? (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchCategories()
          }}
        />
      ) : null}

      {editCategory ? (
        <EditCategoryModal
          category={editCategory}
          onClose={() => setEditCategory(null)}
          onSuccess={() => {
            setEditCategory(null)
            fetchCategories()
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Delete Category"
        message={`Are you sure you want to delete "${confirmDelete.name || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={async () => {
          if (confirmDelete.id) {
            await deleteCategory(confirmDelete.id)
          }
          setConfirmDelete({ open: false })
        }}
        variant="danger"
      />
    </AdminLayout>
  )
}

function CreateCategoryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((s) => ({ ...s, [name]: value }))

    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to create category')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card admin-max-w-md">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Create Category</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>
        <div className="admin-modal-body">
          {error && (
            <div className="admin-alert admin-alert-danger admin-mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-space-y-4">
            <div>
              <label className="admin-form-label">Category Name *</label>
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
            <div>
              <label className="admin-form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="admin-form-textarea"
              />
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
                {loading ? 'Creating…' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditCategoryModal({ category, onClose, onSuccess }: { category: Category; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    isActive: category.isActive,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((s) => ({ ...s, [name]: value }))

    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update category')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card admin-max-w-md">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Edit Category</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>
        <div className="admin-modal-body">
          {error && (
            <div className="admin-alert admin-alert-danger admin-mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-space-y-4">
            <div>
              <label className="admin-form-label">Category Name *</label>
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
            <div>
              <label className="admin-form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="admin-form-textarea"
              />
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
                {loading ? 'Updating…' : 'Update Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}