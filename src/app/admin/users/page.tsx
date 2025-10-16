'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'customer'
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.set('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users
      .filter((user) => (roleFilter === 'all' ? true : user.role === roleFilter))
      .filter((user) =>
        !q
          ? true
          : [user.username, user.email]
            .filter(Boolean)
            .some((x) => x!.toLowerCase().includes(q))
      )
  }, [users, query, roleFilter])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'admin-table-badge admin-table-badge-danger'
      case 'customer': return 'admin-table-badge admin-table-badge-info'
      default: return 'admin-table-badge admin-table-badge-default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getRoleCounts = () => {
    const counts = {
      admin: 0,
      customer: 0,
    }
    users.forEach(user => {
      counts[user.role]++
    })
    return counts
  }

  const roleCounts = getRoleCounts()

  return (
    <AdminLayout title="Users">
      <div className="admin-space-y-6">
        {/* Statistics Overview */}
        <div>
          <h3 className="admin-section-heading">User Statistics</h3>
          <div className="admin-grid admin-grid-3">
            <div className="admin-card">
              <div className="admin-text-2xl admin-font-bold admin-text-white">{users.length}</div>
              <div className="admin-text-sm admin-text-gray">Total Users</div>
            </div>
            <div className="admin-card admin-card-danger">
              <div className="admin-text-2xl admin-font-bold admin-text-danger">{roleCounts.admin}</div>
              <div className="admin-text-sm admin-text-danger-light">Admins</div>
            </div>
            <div className="admin-card admin-card-info">
              <div className="admin-text-2xl admin-font-bold admin-text-info">{roleCounts.customer}</div>
              <div className="admin-text-sm admin-text-info-light">Customers</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="admin-flex admin-flex-col admin-gap-4 admin-md-flex-row admin-md-items-center admin-md-justify-between">
          <div className="admin-flex admin-items-center admin-gap-4">
            <button
              onClick={fetchUsers}
              className="admin-button admin-button-primary"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="admin-flex admin-items-center admin-gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="admin-form-select"
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="customer">Customers</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="admin-relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username or email…"
            className="admin-form-input admin-form-input-with-icon"
          />
          <svg className="admin-form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">
            <p className="admin-table-empty-text">No users match your filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="admin-text-sm admin-font-semibold admin-text-white">{user.username}</div>
                    </td>
                    <td>
                      {user.email}
                    </td>
                    <td>
                      <span className={getRoleBadge(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {formatDate(user.createdAt)}
                    </td>
                    <td>
                      {formatDate(user.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}