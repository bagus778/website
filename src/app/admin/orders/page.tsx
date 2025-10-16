'use client'

import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

interface Order {
  _id: string
  orderNumber: string
  customer: {
    username: string
    email: string
  }
  items: Array<{
    productName: string
    quantity: number
    price: number
    optionIndex?: number
    optionLabel?: string
  }>
  totalAmount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

interface Command {
  _id: string
  order: string
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

interface OrderWithCommands extends Order {
  commands: Command[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithCommands[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  // UI helpers
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'paid' | 'failed' | 'refunded'>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders?limit=100', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        const orders = data.data

        // Extract all order IDs and fetch commands in a single request
        const orderIds = orders.map((order: Order) => order._id).join(',')
        const commandsRes = await fetch(`/api/admin/commands?orderIds=${orderIds}`)
        const commandsData = await commandsRes.json()

        // Group commands by order ID
        const commandsByOrder: { [key: string]: any[] } = {}
        if (commandsData.success) {
          commandsData.data.forEach((command: any) => {
            const orderId = command.order._id || command.order
            if (!commandsByOrder[orderId]) {
              commandsByOrder[orderId] = []
            }
            commandsByOrder[orderId].push(command)
          })
        }

        // Map commands to orders
        const ordersWithCommands = orders.map((order: Order) => ({
          ...order,
          commands: commandsByOrder[order._id] || []
        }))

        setOrders(ordersWithCommands)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders
      .filter((order) => (statusFilter === 'all' ? true : order.status === statusFilter))
      .filter((order) => (paymentFilter === 'all' ? true : order.paymentStatus === paymentFilter))
      .filter((order) =>
        !q
          ? true
          : [order.orderNumber, order.customer.username, order.customer.email]
            .filter(Boolean)
            .some((x) => x!.toLowerCase().includes(q))
      )
  }, [orders, query, statusFilter, paymentFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'admin-table-badge admin-table-badge-warning'
      case 'processing': return 'admin-table-badge admin-table-badge-info'
      case 'executed': return 'admin-table-badge admin-table-badge-success'
      case 'completed': return 'admin-table-badge admin-table-badge-success'
      case 'failed': return 'admin-table-badge admin-table-badge-danger'
      case 'refunded': return 'admin-table-badge admin-table-badge-default'
      case 'paid': return 'admin-table-badge admin-table-badge-success'
      default: return 'admin-table-badge admin-table-badge-default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <AdminLayout title="Orders">
      <div className="admin-space-y-6">
        {/* Toolbar */}
        <div className="admin-flex admin-flex-col admin-gap-4 admin-md-flex-row admin-md-items-center">
          <div className="admin-flex-1">
            <div className="admin-relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order number, username, email…"
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
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="admin-form-select"
            >
              <option value="all">All payments</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Payment Failed</option>
              <option value="refunded">Refunded</option>
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
            <p className="admin-table-empty-text">No orders match your filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Commands</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr className="admin-cursor-pointer" onClick={() => toggleOrderExpansion(order._id)}>
                      <td>
                        <div className="admin-text-sm admin-font-semibold admin-text-white">{order.orderNumber}</div>
                      </td>
                      <td>
                        <div>{order.customer.username}</div>
                        <div className="admin-text-xs admin-text-gray">{order.customer.email}</div>
                      </td>
                      <td>
                        {order.items.map((item) => (item.quantity))} item{order.items.map((item) => (item.quantity) !== 1 ? 's' : '')}
                      </td>
                      <td>
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td>
                        <span className={getStatusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(order.paymentStatus)}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {order.commands.length}
                      </td>
                      <td>
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                    {expandedOrders.has(order._id) && (
                      <tr>
                        <td colSpan={8} className="admin-px-6 admin-py-4 admin-bg-gray-darker">
                          <div className="admin-space-y-4">
                            {/* Order Items */}
                            <div>
                              <h4 className="admin-text-sm admin-font-medium admin-text-white admin-mb-2">Items</h4>
                              <div className="admin-space-y-4">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="admin-text-sm admin-text-gray-light">
                                    <div className="admin-flex admin-items-center admin-gap-2">
                                      <span>{item.productName}</span>
                                      {item.optionLabel && (
                                        <span className="admin-table-badge admin-table-badge-info">
                                          {item.optionLabel}
                                        </span>
                                      )}
                                      <span className="admin-text-gray">× {item.quantity}</span>
                                      <span className="admin-text-gray">- ${item.price.toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Commands */}
                            <div>
                              <h4 className="admin-text-sm admin-font-medium admin-text-white admin-mb-2">Commands ({order.commands.length})</h4>
                              {order.commands.length === 0 ? (
                                <p className="admin-text-sm admin-text-gray">No commands found</p>
                              ) : (
                                <div className="admin-space-y-4">
                                  {order.commands.map((cmd) => (
                                    <div key={cmd._id} className="admin-rounded-lg admin-border admin-bg-gray-darker admin-p-3">
                                      <div className="admin-flex admin-items-center admin-justify-between admin-mb-2">
                                        <div className="admin-flex admin-items-center admin-gap-2">
                                          <span className={getStatusBadge(cmd.status)}>
                                            {cmd.status}
                                          </span>
                                          <span className="admin-text-sm admin-text-gray-light">Player: {cmd.player}</span>
                                        </div>
                                        <div className="admin-text-xs admin-text-gray">
                                          Attempts: {cmd.attempts}/{cmd.maxAttempts}
                                        </div>
                                      </div>
                                      <div className="admin-text-sm admin-text-gray-light admin-font-mono admin-bg-gray-darkest admin-p-2 admin-rounded">
                                        {cmd.command}
                                      </div>
                                      {cmd.error && (
                                        <div className="admin-mt-2 admin-text-sm admin-text-danger">
                                          Error: {cmd.error}
                                        </div>
                                      )}
                                      <div className="admin-mt-2 admin-text-xs admin-text-gray">
                                        Scheduled: {formatDate(cmd.scheduledFor)}
                                        {cmd.executedAt && ` | Executed: ${formatDate(cmd.executedAt)}`}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}