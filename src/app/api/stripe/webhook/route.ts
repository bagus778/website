import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'No signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { success: false, message: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailure(paymentIntent)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    await connectDB()

    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error('No orderId in payment intent metadata')
      return
    }

    const order = await Order.findById(orderId)

    if (!order) {
      console.error(`Order ${orderId} not found`)
      return
    }

    // Update order payment status
    order.paymentStatus = 'paid'
    order.paymentIntentId = paymentIntent.id
    await order.save()

    console.log(`Payment succeeded for order ${orderId}`)

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
        console.log(`Order ${orderId} processed successfully after payment`)
      }
    } catch (processError) {
      console.error('Error processing order after payment:', processError)
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    await connectDB()

    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error('No orderId in payment intent metadata')
      return
    }

    const order = await Order.findById(orderId)

    if (!order) {
      console.error(`Order ${orderId} not found`)
      return
    }

    // Update order payment status
    order.paymentStatus = 'failed'
    order.paymentIntentId = paymentIntent.id
    await order.save()

    console.log(`Payment failed for order ${orderId}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}
