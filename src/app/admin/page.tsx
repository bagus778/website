'use client'

import { useMemo, useEffect, useState } from 'react'
import AdminLayout from './components/AdminLayout'
import PluginDownloadWizard from './components/PluginDownloadWizard'

interface DashboardStats {
  overview: {
    products: number
    orders: number
    revenue: number
    users: number
  }
  orderStats: {
    pending: number
    processing: number
    completed: number
    failed: number
    refunded: number
  }
  commandStats: {
    pending: number
    processing: number
    executed: number
    failed: number
  }
  recentActivity: Array<{
    id: string
    orderNumber: string
    customer: string
    amount: number
    status: string
    createdAt: string
  }>
}

export default function AdminPage() {
  const siteUrl = useMemo(() => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''), [])
  const apiEndpoint = `${siteUrl}/api`

  const [stats, setStats] = useState<DashboardStats>({
    overview: {
      products: 0,
      orders: 0,
      revenue: 0,
      users: 0,
    },
    orderStats: {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
    },
    commandStats: {
      pending: 0,
      processing: 0,
      executed: 0,
      failed: 0,
    },
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) => {
    const colorClass = color === 'bg-blue-600' ? 'admin-stat-card-icon-blue' :
                       color === 'bg-green-600' ? 'admin-stat-card-icon-green' :
                       color === 'bg-yellow-600' ? 'admin-stat-card-icon-yellow' :
                       color === 'bg-purple-600' ? 'admin-stat-card-icon-purple' :
                       color === 'bg-orange-600' ? 'admin-stat-card-icon-orange' :
                       color === 'bg-red-600' ? 'admin-stat-card-icon-red' : ''

    return (
      <div className="admin-stat-card">
        <div className="admin-stat-card-content">
          <div>
            <p className="admin-stat-card-label">{title}</p>
            <p className="admin-stat-card-value">
              {loading ? '...' : value}
            </p>
          </div>
          <div className={`admin-stat-card-icon ${colorClass}`}>
            <span className="admin-stat-card-icon-text">{icon}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="admin-space-y-8">
        {/* Statistics Grid */}
        <div>
          <h3 className="admin-section-heading">Overview</h3>
          <div className="admin-grid admin-grid-4">
            <StatCard
              title="Total Products"
              value={stats.overview.products}
              icon="📦"
              color="bg-blue-600"
            />
            <StatCard
              title="Total Orders"
              value={stats.overview.orders}
              icon="🛒"
              color="bg-green-600"
            />
            <StatCard
              title="Revenue"
              value={`$${stats.overview.revenue.toFixed(2)}`}
              icon="💰"
              color="bg-yellow-600"
            />
            <StatCard
              title="Users"
              value={stats.overview.users}
              icon="👥"
              color="bg-purple-600"
            />
          </div>
        </div>

        {/* Detailed Statistics */}
        <div>
          <h3 className="admin-section-heading">Detailed Statistics</h3>
          <div className="admin-grid admin-grid-4">
            <StatCard
              title="Pending Orders"
              value={stats.orderStats.pending}
              icon="⏳"
              color="bg-orange-600"
            />
            <StatCard
              title="Processing Orders"
              value={stats.orderStats.processing}
              icon="🔄"
              color="bg-blue-600"
            />
            <StatCard
              title="Pending Commands"
              value={stats.commandStats.pending}
              icon="⚡"
              color="bg-yellow-600"
            />
            <StatCard
              title="Failed Commands"
              value={stats.commandStats.failed}
              icon="❌"
              color="bg-red-600"
            />
          </div>
        </div>

        <div>
          <div className="admin-section-card">
            <div className="admin-section-card-header">
              <h3 className="admin-section-card-title">Plugin Downloads</h3>
              <p className="admin-section-card-subtitle">
                Download the Moonchunk plugin for your Minecraft server
              </p>
            </div>
            <PluginDownloadWizard apiEndpoint={apiEndpoint} />
          </div>
        </div>

        <div className="admin-info-card">
          <h3 className="admin-info-card-title">Quick Integration Guide</h3>
          <div className="admin-info-card-content admin-info-card-list">
            <p><strong>1.</strong> Download the plugin above and place it in your server's <code className="admin-info-card-code">plugins/</code> folder</p>
            <p><strong>2.</strong> Restart your server to generate the configuration files</p>
            <p><strong>3.</strong> Edit <code className="admin-info-card-code">plugins/Moonchunk/config.yml</code> with your API endpoint and key</p>
            <p><strong>4.</strong> Use <code className="admin-info-card-code">/moonchunk reload</code> or restart your server</p>
            <p><strong>5.</strong> Your store is now connected to your Minecraft server!</p>
          </div>
        </div>

        <div className="admin-section-card">
          <h3 className="admin-section-heading">Recent Activity</h3>
          {stats.recentActivity.length === 0 ? (
            <div className="admin-dashboard-activity-empty">
              <p className="admin-dashboard-activity-empty-title">No recent activity to display.</p>
              <p className="admin-dashboard-activity-empty-subtitle">Activity will appear here as customers make purchases.</p>
            </div>
          ) : (
            <div className="admin-dashboard-activity-list">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="admin-activity-item">
                  <div className="admin-activity-item-left">
                    <div className="admin-activity-item-avatar">
                      {activity.customer.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="admin-activity-item-title">
                        Order {activity.orderNumber}
                      </p>
                      <p className="admin-activity-item-subtitle">
                        {activity.customer}
                      </p>
                    </div>
                  </div>
                  <div className="admin-activity-item-right">
                    <p className="admin-activity-item-value">
                      ${activity.amount.toFixed(2)}
                    </p>
                    <p className="admin-activity-item-status">
                      {activity.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
