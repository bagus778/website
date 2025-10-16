'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'

interface Command {
  _id: string
  order: {
    _id: string
    orderNumber: string
    customer: {
      username: string
    }
    items: Array<{
      productName: string
      optionLabel?: string
    }>
  }
  orderNumber: string
  product: string
  player: string
  command: string
  status: 'pending' | 'processing' | 'executed' | 'failed'
  attempts: number
  maxAttempts: number
  scheduledFor: string
  executedAt?: string
  error?: string
  createdAt: string
  updatedAt: string
}

export default function AdminCommandsPage() {
  const [commands, setCommands] = useState<Command[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmRetry, setConfirmRetry] = useState<{ open: boolean; command?: Command }>({ open: false })

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'executed' | 'failed'>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    fetchCommands()

    if (autoRefresh) {
      const interval = setInterval(fetchCommands, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchCommands = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/commands?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setCommands(data.data)
      }
    } catch (err) {
      console.error('Error fetching commands:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetryCommand = async (command: Command) => {
    try {
      // Reset command to pending status
      const res = await fetch(`/api/admin/commands/${command._id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        await fetchCommands() // Refresh the list
      } else {
        alert('Failed to retry command')
      }
    } catch (err) {
      console.error('Error retrying command:', err)
      alert('Error retrying command')
    }
  }


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return commands
      .filter((cmd) => (statusFilter === 'all' ? true : cmd.status === statusFilter))
      .filter((cmd) =>
        !q
          ? true
          : [cmd.orderNumber, cmd.player, cmd.command, cmd.product]
            .filter(Boolean)
            .some((x) => x!.toLowerCase().includes(q))
      )
  }, [commands, query, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'admin-table-badge admin-table-badge-warning'
      case 'processing': return 'admin-table-badge admin-table-badge-info'
      case 'executed': return 'admin-table-badge admin-table-badge-success'
      case 'failed': return 'admin-table-badge admin-table-badge-danger'
      default: return 'admin-table-badge admin-table-badge-default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      processing: 0,
      executed: 0,
      failed: 0,
    }
    commands.forEach(cmd => {
      counts[cmd.status]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  const getProductWithOption = (command: Command) => {
    // Find the matching order item by product name
    const orderItem = command.order.items?.find(item => item.productName === command.product)
    if (orderItem?.optionLabel) {
      return `${command.product} (${orderItem.optionLabel})`
    }
    return command.product
  }

  return (
    <AdminLayout title="Command Queue">
      <div className="admin-space-y-6">
        {/* Status Overview */}
        <div>
          <h3 className="admin-section-heading">Queue Status</h3>
          <div className="admin-grid admin-grid-4">
            <div className="admin-card admin-card-warning">
              <div className="admin-text-2xl admin-font-bold admin-text-warning">{statusCounts.pending}</div>
              <div className="admin-text-sm admin-text-warning-light">Pending</div>
            </div>
            <div className="admin-card admin-card-info">
              <div className="admin-text-2xl admin-font-bold admin-text-info">{statusCounts.processing}</div>
              <div className="admin-text-sm admin-text-info-light">Processing</div>
            </div>
            <div className="admin-card admin-card-success">
              <div className="admin-text-2xl admin-font-bold admin-text-success">{statusCounts.executed}</div>
              <div className="admin-text-sm admin-text-success-light">Executed</div>
            </div>
            <div className="admin-card admin-card-danger">
              <div className="admin-text-2xl admin-font-bold admin-text-danger">{statusCounts.failed}</div>
              <div className="admin-text-sm admin-text-danger-light">Failed</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="admin-flex admin-flex-col admin-gap-4 admin-md-flex-row admin-md-items-center admin-md-justify-between">
          <div className="admin-flex admin-items-center admin-gap-4">
            <button
              onClick={fetchCommands}
              className="admin-button admin-button-primary"
            >
              🔄 Refresh
            </button>
            <label className="admin-flex admin-items-center admin-gap-2 admin-text-sm admin-text-gray-light">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="admin-form-checkbox"
              />
              Auto-refresh (5s)
            </label>
          </div>

          <div className="admin-flex admin-items-center admin-gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="admin-form-select"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="executed">Executed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="admin-relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order number, player, command, or product…"
            className="admin-form-input admin-form-input-with-icon"
          />
          <svg className="admin-form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">
            <p className="admin-table-empty-text">No commands match your filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Player</th>
                  <th>Command</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Scheduled</th>
                  <th className="admin-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((command) => (
                  <tr key={command._id}>
                    <td>
                      <div className="admin-text-sm admin-font-semibold admin-text-white">{command.orderNumber}</div>
                      <div className="admin-text-xs admin-text-gray">{command.order.customer.username}</div>
                    </td>
                    <td>
                      <div className="admin-font-medium">{command.player}</div>
                      <div className="admin-text-xs admin-text-gray">{getProductWithOption(command)}</div>
                    </td>
                    <td>
                      <div className="admin-text-sm admin-text-gray-light admin-font-mono admin-bg-gray-darkest admin-p-2 admin-rounded admin-max-w-md admin-truncate" title={command.command}>
                        {command.command}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadge(command.status)}>
                        {command.status}
                      </span>
                      {command.error && (
                        <div className="admin-text-xs admin-text-danger admin-mt-1 admin-max-w-xs admin-truncate" title={command.error}>
                          {command.error}
                        </div>
                      )}
                    </td>
                    <td>
                      {command.attempts}/{command.maxAttempts}
                    </td>
                    <td>
                      {formatDate(command.scheduledFor)}
                      {command.executedAt && (
                        <div className="admin-text-xs admin-text-success admin-mt-1">
                          Executed: {formatDate(command.executedAt)}
                        </div>
                      )}
                    </td>
                    <td className="admin-text-right admin-text-sm admin-font-medium">
                      {command.status === 'failed' && command.attempts < command.maxAttempts && (
                        <button
                          onClick={() => setConfirmRetry({ open: true, command })}
                          className="admin-action-link"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmRetry.open}
        title="Retry Command"
        message={`Are you sure you want to retry this command for player "${confirmRetry.command?.player}"?`}
        confirmLabel="Retry"
        onClose={() => setConfirmRetry({ open: false })}
        onConfirm={() => {
          if (confirmRetry.command) {
            handleRetryCommand(confirmRetry.command)
          }
          setConfirmRetry({ open: false })
        }}
        variant="default"
      />
    </AdminLayout>
  )
}