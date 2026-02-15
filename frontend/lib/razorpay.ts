// Razorpay SDK Loader and Helper

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any
    }
}

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

export const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }

        const script = document.createElement('script')
        script.src = RAZORPAY_SCRIPT_SRC
        script.onload = () => {
            resolve(true)
        }
        script.onerror = () => {
            resolve(false)
        }
        document.body.appendChild(script)
    })
}

export interface RazorpayOrderData {
    key: string
    orderId: string
    amount: number
    currency: string
    name: string
    description: string
    prefill?: {
        name?: string
        email?: string
        contact?: string
    }
}

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
}

export class PaymentCancelledError extends Error {
    constructor(message: string = 'Payment cancelled by user') {
        super(message)
        this.name = 'PaymentCancelledError'
    }
}

export const openRazorpayCheckout = async (
    orderData: RazorpayOrderData
): Promise<RazorpaySuccessResponse> => {
    const isLoaded = await loadRazorpay()
    if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you online?')
    }

    return new Promise((resolve, reject) => {
        const options = {
            key: orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            name: orderData.name,
            description: orderData.description,
            image: '/logo.png', // Add a logo if available or remove
            order_id: orderData.orderId,
            handler: function (response: RazorpaySuccessResponse) {
                resolve(response)
            },
            prefill: orderData.prefill,
            theme: {
                color: '#EC4899', // Pink-500 from your design
            },
            modal: {
                ondismiss: function () {
                    reject(new PaymentCancelledError())
                },
            },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
    })
}
