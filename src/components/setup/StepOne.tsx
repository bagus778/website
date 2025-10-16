import { CURRENCIES } from '@/lib/currencies'

interface StepOneProps {
  formData: {
    storeName: string
    mongodbUri: string
    siteUrl: string
    currency: string
    currencySymbol: string
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export default function StepOne({ formData, onChange }: StepOneProps) {
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCurrency = CURRENCIES.find((c) => c.code === e.target.value)
    if (selectedCurrency) {
      // Create synthetic events for both fields
      const currencyEvent = {
        target: { name: 'currency', value: selectedCurrency.code }
      } as React.ChangeEvent<HTMLInputElement>
      const symbolEvent = {
        target: { name: 'currencySymbol', value: selectedCurrency.symbol }
      } as React.ChangeEvent<HTMLInputElement>

      onChange(currencyEvent)
      onChange(symbolEvent)
    }
  }

  return (
    <div className="setup-form-section">
      <div className="setup-form-field">
        <label className="setup-form-label">
          Store Name <span className="setup-form-required">*</span>
        </label>
        <input
          type="text"
          name="storeName"
          value={formData.storeName}
          onChange={onChange}
          placeholder="My Awesome Store"
          className="setup-form-input"
          required
        />
        <p className="setup-form-hint">
          This will be displayed across your store
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          MongoDB Connection URI <span className="setup-form-required">*</span>
        </label>
        <input
          type="text"
          name="mongodbUri"
          value={formData.mongodbUri}
          onChange={onChange}
          placeholder="mongodb://localhost:27017/moonchunk-store"
          className="setup-form-input"
          style={{ fontFamily: 'ui-monospace, monospace' }}
          required
        />
        <p className="setup-form-hint">
          Your MongoDB database connection string
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          Site URL <span className="setup-form-required">*</span>
        </label>
        <input
          type="url"
          name="siteUrl"
          value={formData.siteUrl}
          onChange={onChange}
          placeholder="http://localhost:3000"
          className="setup-form-input"
          required
        />
        <p className="setup-form-hint">
          The URL where your store will be accessible
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          Currency
        </label>
        <select
          value={formData.currency}
          onChange={handleCurrencyChange}
          className="setup-form-select"
        >
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
        <p className="setup-form-hint">
          Selected: <span style={{ fontWeight: 600 }}>{formData.currencySymbol} {formData.currency}</span>
        </p>
      </div>
    </div>
  )
}