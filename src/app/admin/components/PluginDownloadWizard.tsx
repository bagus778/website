'use client'

import { useState } from 'react'

interface PluginDownloadWizardProps {
  apiEndpoint: string
}

type Platform = 'server' | 'velocity' | 'bungeecord'

export default function PluginDownloadWizard({ apiEndpoint }: PluginDownloadWizardProps) {
  const [platform, setPlatform] = useState<Platform>('server')
  const [versionKey, setVersionKey] = useState<string>('1.16-1.21')

  const serverVersions: { key: string; label: string; link: string }[] = [
    {
      key: '1.7-1.8',
      label: '1.7.x – 1.8.x (Legacy)',
      link: 'https://github.com/Moonchunk/moonchunk-plugin/releases/download/0.1/moonchunk-0.1-bukkit-legacy.jar',
    },
    {
      key: '1.9-1.12',
      label: '1.9.x – 1.12.x',
      link: 'https://github.com/Moonchunk/moonchunk-plugin/releases/download/0.1/moonchunk-0.1-bukkit-v9-12.jar',
    },
    {
      key: '1.13-1.16',
      label: '1.13.x – 1.16.x',
      link: 'https://github.com/Moonchunk/moonchunk-plugin/releases/download/0.1/moonchunk-0.1-bukkit-v13-16.jar',
    },
    {
      key: '1.16-1.21',
      label: '1.16.x – 1.21.x (Modern) - Folia Supported',
      link: 'https://github.com/Moonchunk/moonchunk-plugin/releases/download/0.1/moonchunk-0.1-bukkit-modern.jar',
    },
  ]

  const velocity: { link: string } = {
    link: 'https://github.com/Moonchunk/moonchunk-plugin/releases/download/0.1/moonchunk-0.1-velocity.jar',
  }
  const bungeecord: { link: string } = {
    link: 'https://github.com/Moonchunk/moonchunk-plugin/releases/download/0.1/moonchunk-0.1-bungeecord.jar',
  }

  const selectedUrl = (() => {
    if (platform === 'server') {
      const v = serverVersions.find((v) => v.key === versionKey)
      if (!v) return ''
      return v.link
    }
    if (platform === 'velocity') return velocity.link
    if (platform === 'bungeecord') return bungeecord.link
    return ''
  })()

  return (
    <div className="admin-wizard-card">
      <div className="admin-wizard-grid">
        <div className="admin-space-y-4">
          <div className="admin-wizard-field">
            <label className="admin-wizard-label">Server type</label>
            <div className="admin-wizard-button-group">
              <button
                type="button"
                onClick={() => setPlatform('server')}
                className={`admin-wizard-button ${platform === 'server' ? 'admin-wizard-button-selected' : ''}`}
              >
                Standalone
              </button>
              <button
                type="button"
                onClick={() => setPlatform('velocity')}
                className={`admin-wizard-button ${platform === 'velocity' ? 'admin-wizard-button-selected' : ''}`}
              >
                Velocity
              </button>
              <button
                type="button"
                onClick={() => setPlatform('bungeecord')}
                className={`admin-wizard-button ${platform === 'bungeecord' ? 'admin-wizard-button-selected' : ''}`}
              >
                BungeeCord
              </button>
            </div>
          </div>

          {platform === 'server' && (
            <div className="admin-wizard-field">
              <label className="admin-wizard-label">Minecraft version</label>
              <select
                value={versionKey}
                onChange={(e) => setVersionKey(e.target.value)}
                className="admin-wizard-select"
              >
                {serverVersions.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="admin-wizard-preview">
          <div>
            <p className="admin-wizard-preview-label">Download ready</p>
            <h3 className="admin-wizard-preview-title">
              {platform === 'server'
                ? `${serverVersions.find((v) => v.key === versionKey)?.label}`
                : platform === 'velocity'
                  ? 'Velocity plugin'
                  : 'BungeeCord plugin'}
            </h3>
            <div className="admin-wizard-preview-details">
              <div className="admin-wizard-preview-detail">
                <span className="admin-font-medium">Endpoint</span>:{' '}
                <code className="admin-wizard-code">{apiEndpoint}</code>
              </div>
              <div className="admin-wizard-preview-detail">
                <span className="admin-font-medium">API Key</span>:{' '}
                <code className="admin-wizard-code">in your .env file</code>
              </div>
            </div>
          </div>

          <div>
            <a
              href={selectedUrl}
              download
              className="admin-wizard-download"
            >
              <svg className="admin-wizard-download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Plugin
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}