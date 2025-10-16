'use client'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
  variant?: 'danger' | 'default'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  variant = 'default',
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">{title}</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>
        <div className="admin-modal-body">
          {message ? <p className="admin-modal-message">{message}</p> : null}
        </div>
        <div className="admin-modal-footer">
          <button onClick={onClose} className="admin-modal-button-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'admin-modal-button-danger' : 'admin-modal-button-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
