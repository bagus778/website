'use client'

interface ReviewStepProps {
  formData: {
    storeName: string
    siteUrl: string
    mongodbUri: string
    currency: string
    currencySymbol: string
    adminUsername: string
    adminEmail: string
    jwtSecret: string
    pluginApiKey: string
    stripeSecretKey: string
    stripePublicKey: string
  }
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  const maskSecret = (secret: string) => {
    if (secret.length <= 8) return '••••••••'
    return secret.substring(0, 4) + '••••' + secret.substring(secret.length - 4)
  }

  return (
    <div className="setup-review-grid">
      {/* Compact Summary Card */}
      <div className="setup-review-card" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
        <h3 className="setup-review-title">Configuration Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '1.5rem', rowGap: '0.5rem', fontSize: '0.75rem' }}>
          <div>
            <dt className="setup-review-label">Store Name</dt>
            <dd className="setup-review-value" style={{ fontWeight: 600, fontFamily: 'inherit', marginTop: '0.125rem' }}>{formData.storeName}</dd>
          </div>
          <div>
            <dt className="setup-review-label">Currency</dt>
            <dd className="setup-review-value" style={{ fontWeight: 600, fontFamily: 'inherit', marginTop: '0.125rem' }}>{formData.currencySymbol} {formData.currency}</dd>
          </div>
          <div>
            <dt className="setup-review-label">Admin Username</dt>
            <dd className="setup-review-value" style={{ fontWeight: 600, fontFamily: 'inherit', marginTop: '0.125rem' }}>{formData.adminUsername}</dd>
          </div>
          <div>
            <dt className="setup-review-label">Admin Email</dt>
            <dd className="setup-review-value" style={{ fontWeight: 600, fontFamily: 'inherit', marginTop: '0.125rem' }}>{formData.adminEmail}</dd>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <dt className="setup-review-label">Database</dt>
            <dd className="setup-review-value" style={{ fontSize: '0.625rem', marginTop: '0.125rem', wordBreak: 'break-all' }}>{formData.mongodbUri}</dd>
          </div>
        </div>
      </div>

      {/* Security Keys with Tooltips */}
      <div className="setup-review-card" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
        <h3 className="setup-review-title">Security Keys</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div
            className="setup-flex setup-items-center"
            style={{ position: 'relative', justifyContent: 'space-between', padding: '0.375rem 0' }}
          >
            <dt className="setup-review-label">JWT Secret</dt>
            <dd className="setup-review-value" style={{ fontSize: '0.625rem' }}>{maskSecret(formData.jwtSecret)}</dd>
          </div>
          <div
            className="setup-flex setup-items-center"
            style={{ position: 'relative', justifyContent: 'space-between', padding: '0.375rem 0' }}
          >
            <dt className="setup-review-label">Plugin API Key</dt>
            <dd className="setup-review-value" style={{ fontSize: '0.625rem' }}>{maskSecret(formData.pluginApiKey)}</dd>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      {(formData.stripeSecretKey || formData.stripePublicKey) && (
        <div style={{ borderRadius: '0.75rem', border: '1px solid #bbf7d0', background: '#f0fdf4', padding: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#15803d' }}>
            <strong>✓ Stripe Payment Gateway Configured</strong>
          </p>
        </div>
      )}

      {/* Ready Message */}
      <div className="setup-review-card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#475569' }}>
          <strong>Ready to launch!</strong> Click below to complete setup and access your admin panel.
        </p>
      </div>
    </div>
  )
}