interface LoadingSpinnerProps {
  text?: string
}

export default function LoadingSpinner({ text = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <p className="loading-text">{text}</p>
      </div>
    </div>
  )
}