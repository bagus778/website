'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'

interface Page {
  _id: string
  title: string
  slug: string
  content: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editPage, setEditPage] = useState<Page | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string; title?: string }>({ open: false })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pages', { cache: 'no-store' })
      const data = await response.json()
      if (data.success) setPages(data.data)
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePage = async (id: string) => {
    try {
      const response = await fetch(`/api/pages/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setPages((prev) => prev.filter((p) => p._id !== id))
      } else {
        alert('Failed to delete page')
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      alert('Error deleting page')
    }
  }

  const handleToggleActive = async (page: Page) => {
    const next = !page.isActive
    setPages((prev) => prev.map((p) => (p._id === page._id ? { ...p, isActive: next } : p)))
    try {
      const res = await fetch(`/api/pages/${page._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      if (!res.ok) throw new Error('Failed to update page')
    } catch (err) {
      setPages((prev) => prev.map((p) => (p._id === page._id ? { ...p, isActive: !next } : p)))
      console.error('Error toggling page status:', err)
    }
  }

  return (
    <AdminLayout title="Pages">
      <div className="admin-space-y-6">
        {/* Action Bar */}
        <div className="admin-flex admin-items-center admin-justify-between">
          <button
            onClick={() => setShowCreateModal(true)}
            className="admin-button admin-button-primary"
          >
            + Create Page
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
          </div>
        ) : pages.length === 0 ? (
          <div className="admin-table-empty">
            <div className="admin-mx-auto admin-mb-2 admin-flex admin-h-12 admin-w-12 admin-items-center admin-justify-center admin-rounded-xl admin-bg-gray admin-text-2xl">📄</div>
            <p className="admin-table-empty-text">No pages created yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th className="admin-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page._id}>
                    <td>
                      <div className="admin-text-sm admin-font-semibold admin-text-white">{page.title}</div>
                    </td>
                    <td className="admin-text-gray">{page.slug}</td>
                    <td>
                      <label className="admin-toggle">
                        <input
                          type="checkbox"
                          checked={page.isActive}
                          onChange={() => handleToggleActive(page)}
                          className="admin-toggle-input"
                        />
                        <span className="admin-toggle-slider" />
                        <span className={`admin-toggle-label ${page.isActive ? 'is-active' : ''}`}>
                          {page.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td className="admin-text-right admin-text-sm admin-font-medium">
                      <button
                        onClick={() => setEditPage(page)}
                        className="admin-action-link admin-mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ open: true, id: page._id, title: page.title })}
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
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchPages()
          }}
        />
      ) : null}

      {editPage ? (
        <EditPageModal
          page={editPage}
          onClose={() => setEditPage(null)}
          onSuccess={() => {
            setEditPage(null)
            fetchPages()
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Delete Page"
        message={`Are you sure you want to delete "${confirmDelete.title || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={async () => {
          if (confirmDelete.id) {
            await deletePage(confirmDelete.id)
          }
          setConfirmDelete({ open: false })
        }}
        variant="danger"
      />
    </AdminLayout>
  )
}

function CreatePageModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((s) => ({ ...s, [name]: value }))

    if (name === 'title') {
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
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to create page')
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
          <h2 className="admin-modal-title">Create Page</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>
        <div className="admin-modal-body-scrollable">
          {error && (
            <div className="admin-alert admin-alert-danger admin-mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-space-y-4">
            <div className="admin-grid admin-grid-2">
              <div>
                <label className="admin-form-label">Page Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
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
              <label className="admin-form-label">Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                required
                className="admin-form-textarea"
                placeholder="Enter page content (HTML supported)..."
              />
            </div>

            <div className="admin-grid admin-grid-2">
              <div>
                <label className="admin-form-label">Meta Title (SEO)</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="admin-form-input"
                />
              </div>
              <div>
                <label className="admin-form-label">Meta Description (SEO)</label>
                <input
                  type="text"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className="admin-form-input"
                />
              </div>
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
                {loading ? 'Creating…' : 'Create Page'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditPageModal({ page, onClose, onSuccess }: { page: Page; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: page.title,
    slug: page.slug,
    content: page.content,
    isActive: page.isActive,
    metaTitle: page.metaTitle || '',
    metaDescription: page.metaDescription || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((s) => ({ ...s, [name]: value }))

    if (name === 'title') {
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
      const response = await fetch(`/api/pages/${page._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update page')
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
          <h2 className="admin-modal-title">Edit Page</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>
        <div className="admin-modal-body-scrollable">
          {error && (
            <div className="admin-alert admin-alert-danger admin-mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-space-y-4">
            <div className="admin-grid admin-grid-2">
              <div>
                <label className="admin-form-label">Page Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
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
              <label className="admin-form-label">Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                required
                className="admin-form-textarea"
                placeholder="Enter page content (HTML supported)..."
              />
            </div>

            <div className="admin-grid admin-grid-2">
              <div>
                <label className="admin-form-label">Meta Title (SEO)</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="admin-form-input"
                />
              </div>
              <div>
                <label className="admin-form-label">Meta Description (SEO)</label>
                <input
                  type="text"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className="admin-form-input"
                />
              </div>
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
                {loading ? 'Updating…' : 'Update Page'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
