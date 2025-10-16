'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

interface StoreSettings {
    _id?: string
    name: string
    description?: string
    logo?: string
    currency: string
    currencySymbol: string
    primaryColor: string
    secondaryColor: string
    features: {
        maintenanceMode: boolean
    }
    minecraft?: {
        serverIp: string
        serverPort: number
    }
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<StoreSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('general')
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/settings')
            const data = await response.json()
            if (data.success) {
                setSettings(data.data)
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            setMessage({ type: 'error', text: 'Failed to load settings' })
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        if (!settings) return

        try {
            setSaving(true)
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' })
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save settings' })
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            setMessage({ type: 'error', text: 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    const updateSettings = (updates: Partial<StoreSettings>) => {
        if (settings) {
            setSettings({ ...settings, ...updates })
        }
    }

    const updateNestedSettings = (path: string, value: any) => {
        if (!settings) return

        const keys = path.split('.')
        const updated = { ...settings }

        let current: any = updated
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {}
            current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value

        setSettings(updated)
    }

    if (loading) {
        return (
            <AdminLayout title="Settings">
                <div className="admin-loading">
                    <div className="admin-loading-spinner" />
                </div>
            </AdminLayout>
        )
    }

    if (!settings) {
        return (
            <AdminLayout title="Settings">
                <div className="admin-table-empty">
                    <p className="admin-table-empty-text">Failed to load settings</p>
                </div>
            </AdminLayout>
        )
    }

    const tabs = [
        { id: 'general', name: 'General' },
        { id: 'features', name: 'Features' },
        { id: 'minecraft', name: 'Minecraft' },
    ]

    return (
        <AdminLayout title="Settings">
            <div className="admin-space-y-6">
                {/* Header */}
                <div className="admin-flex admin-items-center admin-justify-between">
                    <div>
                        <h1 className="admin-text-2xl admin-font-bold admin-text-white">Store Settings</h1>
                        <p className="admin-text-gray admin-mt-1">Configure your store settings and preferences</p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="admin-button admin-button-primary"
                    >
                        {saving ? (
                            <>
                                <div className="admin-loading-spinner admin-h-4 admin-w-4" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={message.type === 'success' ? 'admin-alert admin-alert-success' : 'admin-alert admin-alert-danger'}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="admin-card">
                    <nav className="admin-flex admin-gap-2 admin-p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`admin-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="admin-card admin-p-6">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="admin-space-y-6">
                            <h3 className="admin-section-heading">General Settings</h3>

                            <div className="admin-grid admin-grid-2">
                                <div>
                                    <label className="admin-form-label">
                                        Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.name}
                                        onChange={(e) => updateSettings({ name: e.target.value })}
                                        className="admin-form-input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="admin-form-label">
                                        Currency
                                    </label>
                                    <select
                                        value={settings.currency}
                                        onChange={(e) => updateSettings({ currency: e.target.value })}
                                        className="admin-form-select"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="CAD">CAD (C$)</option>
                                        <option value="AUD">AUD (A$)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="admin-form-label">
                                    Store Description
                                </label>
                                <textarea
                                    value={settings.description || ''}
                                    onChange={(e) => updateSettings({ description: e.target.value })}
                                    rows={3}
                                    className="admin-form-textarea"
                                    placeholder="Brief description of your store..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Features Settings */}
                    {activeTab === 'features' && (
                        <div className="admin-space-y-6">
                            <h3 className="admin-section-heading">Feature Settings</h3>

                            <div className="admin-space-y-4">
                                <div className="admin-flex admin-items-center admin-justify-between admin-p-4 admin-card-feature">
                                    <div>
                                        <h4 className="admin-text-sm admin-font-medium admin-text-white">Maintenance Mode</h4>
                                        <p className="admin-text-xs admin-text-gray admin-mt-1">Put the store in maintenance mode</p>
                                    </div>
                                    <label className="admin-toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.features.maintenanceMode}
                                            onChange={(e) => updateNestedSettings('features.maintenanceMode', e.target.checked)}
                                            className="admin-toggle-input"
                                        />
                                        <span className="admin-toggle-slider" style={{ width: '2.75rem', height: '1.5rem' }} />
                                        <span className={`admin-toggle-label ${settings.features.maintenanceMode ? 'is-active' : ''}`}>
                                            {settings.features.maintenanceMode ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Minecraft Settings */}
                    {activeTab === 'minecraft' && (
                        <div className="admin-space-y-6">
                            <h3 className="admin-section-heading">Minecraft Server Settings</h3>

                            <div className="admin-grid admin-grid-2">
                                <div>
                                    <label className="admin-form-label">
                                        Server IP Address
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.minecraft?.serverIp || ''}
                                        onChange={(e) => updateNestedSettings('minecraft.serverIp', e.target.value)}
                                        className="admin-form-input"
                                        placeholder="mc.yourserver.com"
                                    />
                                </div>

                                <div>
                                    <label className="admin-form-label">
                                        Server Port
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.minecraft?.serverPort || 25565}
                                        onChange={(e) => updateNestedSettings('minecraft.serverPort', parseInt(e.target.value))}
                                        className="admin-form-input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}