interface StepTwoProps {
  formData: {
    jwtSecret: string
    pluginApiKey: string
    stripeSecretKey: string
    stripePublicKey: string
    stripeWebhookSecret: string
    coinbaseApiKey: string
    coinbaseWebhookSecret: string
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onGenerateKey: (fieldName: 'jwtSecret' | 'pluginApiKey') => void
}

export default function StepTwo({ formData, onChange, onGenerateKey }: StepTwoProps) {
  return (
    <div className="setup-form-section">
      <div className="setup-info-box">
        <p className="setup-info-text">
          <strong>Security Keys:</strong> Click "Generate" to create secure random keys. You can modify them after generation if needed.
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          JWT Secret <span className="setup-form-required">*</span>
        </label>
        <div className="setup-flex setup-gap-2">
          <input
            type="text"
            name="jwtSecret"
            value={formData.jwtSecret}
            onChange={onChange}
            disabled={!formData.jwtSecret}
            className="setup-form-input"
            style={{ flex: 1, fontFamily: 'ui-monospace, monospace' }}
            required
          />
          <button
            type="button"
            onClick={() => onGenerateKey('jwtSecret')}
            className="setup-button setup-button-primary setup-button-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            {formData.jwtSecret ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        <p className="setup-form-hint">
          Secret key for JWT token signing
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          Plugin API Key <span className="setup-form-required">*</span>
        </label>
        <div className="setup-flex setup-gap-2">
          <input
            type="text"
            name="pluginApiKey"
            value={formData.pluginApiKey}
            onChange={onChange}
            disabled={!formData.pluginApiKey}
            className="setup-form-input"
            style={{ flex: 1, fontFamily: 'ui-monospace, monospace' }}
            required
          />
          <button
            type="button"
            onClick={() => onGenerateKey('pluginApiKey')}
            className="setup-button setup-button-primary setup-button-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            {formData.pluginApiKey ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        <p className="setup-form-hint">
          API key for the Minecraft plugin to communicate with the store
        </p>
      </div>

      <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <h3 className="setup-form-label" style={{ marginBottom: '1rem' }}>Payment Settings (Optional)</h3>

        <div className="setup-form-section" style={{ gap: '1rem' }}>
          <h4 className="setup-form-label" style={{ fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>💳 Stripe - Credit/Debit Cards</h4>

          <div className="setup-form-field">
            <label className="setup-form-label">
              Stripe Secret Key
            </label>
            <input
              type="text"
              name="stripeSecretKey"
              value={formData.stripeSecretKey}
              onChange={onChange}
              placeholder="sk_test_..."
              className="setup-form-input"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            />
            <p className="setup-form-hint">
              Get from: https://dashboard.stripe.com/test/apikeys
            </p>
          </div>

          <div className="setup-form-field">
            <label className="setup-form-label">
              Stripe Public Key
            </label>
            <input
              type="text"
              name="stripePublicKey"
              value={formData.stripePublicKey}
              onChange={onChange}
              placeholder="pk_test_..."
              className="setup-form-input"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            />
          </div>

          <div className="setup-form-field">
            <label className="setup-form-label">
              Stripe Webhook Secret
            </label>
            <input
              type="text"
              name="stripeWebhookSecret"
              value={formData.stripeWebhookSecret}
              onChange={onChange}
              placeholder="whsec_..."
              className="setup-form-input"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            />
            <p className="setup-form-hint">
              Get from: https://dashboard.stripe.com/test/webhooks
            </p>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }} />

          <h4 className="setup-form-label" style={{ fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>₿ Coinbase Commerce - Cryptocurrency</h4>
          <p className="setup-form-hint" style={{ marginTop: 0 }}>
            Accept Bitcoin, Ethereum, USDC, and more. NO merchant fees!
          </p>

          <div className="setup-form-field">
            <label className="setup-form-label">
              Coinbase Commerce API Key
            </label>
            <input
              type="text"
              name="coinbaseApiKey"
              value={formData.coinbaseApiKey}
              onChange={onChange}
              placeholder="Your Coinbase Commerce API Key"
              className="setup-form-input"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            />
            <p className="setup-form-hint">
              Get from: https://commerce.coinbase.com/dashboard/settings
            </p>
          </div>

          <div className="setup-form-field">
            <label className="setup-form-label">
              Coinbase Webhook Secret
            </label>
            <input
              type="text"
              name="coinbaseWebhookSecret"
              value={formData.coinbaseWebhookSecret}
              onChange={onChange}
              placeholder="Your Coinbase Webhook Secret"
              className="setup-form-input"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            />
            <p className="setup-form-hint">
              Create webhook at: https://commerce.coinbase.com/dashboard/settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}