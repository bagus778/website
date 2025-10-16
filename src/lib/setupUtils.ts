/**
 * Generate a secure random API key
 */
export function generateSecureKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)

  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256)
    }
  }

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }

  return result
}

/**
 * Get step titles
 */
export function getStepTitle(step: number): string {
  const titles = [
    'Store Configuration',
    'Security & API Keys',
    'Admin Account',
    'Review & Complete'
  ]
  return titles[step - 1] || ''
}