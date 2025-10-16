'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/setup/ProgressBar'
import StepOne from '@/components/setup/StepOne'
import StepTwo from '@/components/setup/StepTwo'
import StepThree from '@/components/setup/StepThree'
import ReviewStep from '@/components/setup/ReviewStep'
import { generateSecureKey, getStepTitle } from '@/lib/setupUtils'

interface SetupFormData {
  storeName: string
  mongodbUri: string
  siteUrl: string
  currency: string
  currencySymbol: string
  jwtSecret: string
  pluginApiKey: string
  stripeSecretKey: string
  stripePublicKey: string
  stripeWebhookSecret: string
  coinbaseApiKey: string
  coinbaseWebhookSecret: string
  adminUsername: string
  adminEmail: string
  adminPassword: string
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [setupCompleted, setSetupCompleted] = useState(false)

  const [formData, setFormData] = useState<SetupFormData>({
    storeName: '',
    mongodbUri: 'mongodb://localhost:27017/moonchunk-store',
    siteUrl: 'http://localhost:3000',
    currency: 'USD',
    currencySymbol: '$',
    jwtSecret: '',
    pluginApiKey: '',
    stripeSecretKey: '',
    stripePublicKey: '',
    stripeWebhookSecret: '',
    coinbaseApiKey: '',
    coinbaseWebhookSecret: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleGenerateKey = (fieldName: 'jwtSecret' | 'pluginApiKey') => {
    const keyLength = fieldName === 'jwtSecret' ? 64 : 32
    setFormData({
      ...formData,
      [fieldName]: generateSecureKey(keyLength),
    })
  }

  const performSetup = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Setup failed')
      }

      setSetupCompleted(true)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleGoToPanel = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/admin')
  }

  const testMongoConnection = async (): Promise<boolean> => {
    setCheckingConnection(true)
    setError('')

    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mongodbUri: formData.mongodbUri }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Failed to connect to MongoDB')
        return false
      }

      return true
    } catch (err: any) {
      setError('Failed to test MongoDB connection: ' + err.message)
      return false
    } finally {
      setCheckingConnection(false)
    }
  }

  const validateStep = (): boolean => {
    setError('')

    if (step === 1) {
      if (!formData.storeName || !formData.mongodbUri || !formData.siteUrl) {
        setError('Please fill in all required fields')
        return false
      }
    }

    if (step === 2) {
      if (!formData.jwtSecret || !formData.pluginApiKey) {
        setError('Please generate the security keys before proceeding')
        return false
      }
    }

    if (step === 3) {
      if (!formData.adminUsername || !formData.adminEmail || !formData.adminPassword) {
        setError('Please fill in all admin account fields')
        return false
      }
      if (formData.adminPassword.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
    }

    return true
  }

  const nextStep = async () => {
    if (!validateStep()) {
      return
    }

    // Test MongoDB connection before moving from step 1 to step 2
    if (step === 1) {
      const connectionSuccessful = await testMongoConnection()
      if (!connectionSuccessful) {
        return
      }
    }

    // Move to next step
    const nextStepNumber = step + 1
    setStep(nextStepNumber)

    // If we're moving to step 4 (review step), automatically perform setup
    if (nextStepNumber === 4) {
      setTimeout(async () => {
        await performSetup()
      }, 100) // Small delay to ensure UI updates first
    }
  }

  const prevStep = () => {
    setError('')
    setStep(step - 1)
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        {/* Header */}
        <div className="setup-header">
          <h1 className="setup-title">
            🌙 Moonchunk Store Setup
          </h1>
          <p className="setup-subtitle">
            Step {step} of 4: {getStepTitle(step)}
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={step} totalSteps={4} />

        {/* Error Alert */}
        {error && (
          <div className="setup-alert setup-alert-error">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleGoToPanel}>
          {step === 1 && <StepOne formData={formData} onChange={handleInputChange} />}
          {step === 2 && <StepTwo formData={formData} onChange={handleInputChange} onGenerateKey={handleGenerateKey} />}
          {step === 3 && <StepThree formData={formData} onChange={handleInputChange} />}
          {step === 4 && (
            <>
              <ReviewStep formData={formData} />
              {/* Setup Status */}
              {step === 4 && (
                <div className="setup-mt-6">
                  {loading && (
                    <div className="setup-alert setup-alert-info">
                      <span className="setup-spinner" />
                      Setting up your store...
                    </div>
                  )}
                  {setupCompleted && !loading && (
                    <div className="setup-alert setup-alert-success">
                      ✅ Setup completed successfully! You can now go to the admin panel.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="setup-nav">
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="setup-button setup-button-secondary"
              >
                ← Previous
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading || checkingConnection}
                className="setup-button setup-button-primary setup-nav-auto"
              >
                {checkingConnection && step === 1 ? (
                  <>
                    <span className="setup-spinner setup-spinner-sm" />
                    Testing connection...
                  </>
                ) : (
                  'Next →'
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !setupCompleted}
                className="setup-button setup-button-primary setup-nav-auto"
              >
                Go to Admin Panel →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}