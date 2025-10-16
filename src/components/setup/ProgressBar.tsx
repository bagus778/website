interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="setup-progress-container">
      <div className="setup-flex setup-items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="setup-flex setup-items-center" style={{ flex: 1 }}>
            <div
              className={`setup-progress-step ${s <= currentStep
                  ? 'setup-progress-step-active'
                  : ''
                }`}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                transition: 'all 0.2s',
                background: s <= currentStep ? '#0f172a' : '#e2e8f0',
                color: s <= currentStep ? 'white' : '#64748b'
              }}
            >
              {s}
            </div>
            {s < totalSteps && (
              <div
                style={{
                  flex: 1,
                  height: '0.25rem',
                  margin: '0 0.5rem',
                  transition: 'all 0.2s',
                  background: s < currentStep ? '#0f172a' : '#e2e8f0'
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}