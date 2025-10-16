import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'

const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!

function verifySignature(payload: string, signature: string): boolean {
  const computedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-cc-webhook-signature')

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'No signature' },
        { status: 400 }
      )
    }

    const body = await request.text()

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.error('Coinbase webhook signature verification failed')
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)

    // Handle the event
    switch (event.type) {
      case 'charge:confirmed':
      case 'charge:resolved':
        await handlePaymentSuccess(event.data)
        break
      case 'charge:failed':
        await handlePaymentFailure(event.data)
        break
      case 'charge:pending':
        await handlePaymentPending(event.data)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error: any) {
    console.error('Coinbase webhook error:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(charge: any) {
  try {
    await connectDB()

    const orderId = charge.metadata?.orderId

    if (!orderId) {
      console.error('No orderId in charge metadata')
      return
    }

    const order = await Order.findById(orderId)

    if (!order) {
      console.error(`Order ${orderId} not found`)
      return
    }

    // Update order payment status
    order.paymentStatus = 'paid'
    order.coinbaseChargeId = charge.id
    order.coinbaseChargeCode = charge.code
    await order.save()

    console.log(`Crypto payment confirmed for order ${orderId}`)

    // Process order (generate commands) after successful payment
    try {
      const processUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/orders/${orderId}`
      const processResponse = await fetch(processUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' }),
      })

      if (!processResponse.ok) {
        console.error('Failed to process order after payment:', await processResponse.text())
      } else {
        console.log(`Order ${orderId} processed successfully after crypto payment`)
      }
    } catch (processError) {
      console.error('Error processing order after payment:', processError)
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentPending(charge: any) {
  try {
    await connectDB()

    const orderId = charge.metadata?.orderId

    if (!orderId) {
      console.error('No orderId in charge metadata')
      return
    }

    const order = await Order.findById(orderId)

    if (!order) {
      console.error(`Order ${orderId} not found`)
      return
    }

    // Update order - payment detected but not confirmed yet
    order.coinbaseChargeId = charge.id
    order.coinbaseChargeCode = charge.code
    await order.save()

    console.log(`Crypto payment pending for order ${orderId}`)
  } catch (error) {
    console.error('Error handling payment pending:', error)
  }
}

async function handlePaymentFailure(charge: any) {
  try {
    await connectDB()

    const orderId = charge.metadata?.orderId

    if (!orderId) {
      console.error('No orderId in charge metadata')
      return
    }

    const order = await Order.findById(orderId)

    if (!order) {
      console.error(`Order ${orderId} not found`)
      return
    }

    // Update order payment status
    order.paymentStatus = 'failed'
    order.coinbaseChargeId = charge.id
    order.coinbaseChargeCode = charge.code
    await order.save()

    console.log(`Crypto payment failed for order ${orderId}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}
