import { NextRequest, NextResponse } from 'next/server'

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY!
const COINBASE_API_URL = 'https://api.commerce.coinbase.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, orderId, orderNumber, customerEmail, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!COINBASE_API_KEY || COINBASE_API_KEY === 'your_coinbase_commerce_api_key') {
      return NextResponse.json(
        { success: false, message: 'Coinbase Commerce API key not configured' },
        { status: 500 }
      )
    }

    // Create a charge with Coinbase Commerce
    const chargeData = {
      name: `Order ${orderNumber}`,
      description: description || `Payment for order ${orderNumber}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toFixed(2),
        currency: 'USD',
      },
      metadata: {
        orderId,
        orderNumber,
        customerEmail,
      },
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?order=${orderNumber}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?order=${orderNumber}`,
    }

    const response = await fetch(`${COINBASE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify(chargeData),
    })

    const responseData = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: responseData.error?.message || "Failed to create charge" },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      chargeId: responseData.data.id,
      chargeCode: responseData.data.code,
      hostedUrl: responseData.data.hosted_url,
      expiresAt: responseData.data.expires_at,
    })
  } catch (error: any) {
    console.error('Coinbase charge creation error:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}