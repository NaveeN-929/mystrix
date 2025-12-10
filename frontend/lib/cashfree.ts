// Cashfree Payment Gateway Integration

declare global {
  interface Window {
    Cashfree: {
      checkout: (config: CashfreeCheckoutConfig) => Promise<CashfreeCheckoutResult>
      PG: {
        (config: { mode: 'sandbox' | 'production' }): CashfreePG
      }
    }
  }
}

interface CashfreeCheckoutConfig {
  paymentSessionId: string
  redirectTarget?: '_self' | '_blank' | '_modal'
}

interface CashfreeCheckoutResult {
  error?: {
    message: string
  }
  redirect?: boolean
  paymentDetails?: {
    paymentMessage: string
  }
}

interface CashfreePG {
  checkout: (config: CashfreeCheckoutConfig) => Promise<CashfreeCheckoutResult>
}

// Cashfree environment - should match backend
export const CASHFREE_ENV = process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox'

// Load Cashfree SDK script
let cashfreeLoadPromise: Promise<void> | null = null

export function loadCashfreeSDK(): Promise<void> {
  if (cashfreeLoadPromise) {
    return cashfreeLoadPromise
  }

  cashfreeLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.Cashfree) {
      resolve()
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = CASHFREE_ENV === 'production'
      ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
      : 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true

    script.onload = () => {
      resolve()
    }

    script.onerror = () => {
      cashfreeLoadPromise = null
      reject(new Error('Failed to load Cashfree SDK'))
    }

    document.head.appendChild(script)
  })

  return cashfreeLoadPromise
}

// Initialize Cashfree and start checkout
export async function initiateCashfreeCheckout(
  paymentSessionId: string,
  redirectTarget: '_self' | '_blank' | '_modal' = '_modal'
): Promise<CashfreeCheckoutResult> {
  await loadCashfreeSDK()

  if (!window.Cashfree) {
    throw new Error('Cashfree SDK not loaded')
  }

  // Initialize Cashfree with environment
  const cashfree = window.Cashfree.PG({
    mode: CASHFREE_ENV as 'sandbox' | 'production',
  })

  // Start checkout
  const result = await cashfree.checkout({
    paymentSessionId,
    redirectTarget,
  })

  return result
}

// Helper to check payment result
export function isPaymentSuccessful(result: CashfreeCheckoutResult): boolean {
  if (result.error) {
    return false
  }
  
  // If redirected, we'll verify on the return page
  if (result.redirect) {
    return true
  }

  // Check payment details for modal mode
  if (result.paymentDetails?.paymentMessage) {
    return result.paymentDetails.paymentMessage.toLowerCase().includes('success')
  }

  return false
}

