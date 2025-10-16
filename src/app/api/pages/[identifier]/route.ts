import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Page from '@/models/Page'

// GET by slug or ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    await dbConnect()
    const { identifier } = await params

    let page = null

    // Try to find by ID first (if identifier looks like a MongoDB ObjectId)
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        page = await Page.findById(identifier)
      } catch (err) {
        // Invalid ObjectId, will try slug next
      }
    }

    // If not found by ID, try by slug
    if (!page) {
      page = await Page.findOne({ slug: identifier })
    }

    if (!page) {
      return NextResponse.json({ success: false, message: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: page })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// UPDATE by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    await dbConnect()
    const { identifier } = await params
    const body = await request.json()

    const page = await Page.findByIdAndUpdate(identifier, body, { new: true, runValidators: true })

    if (!page) {
      return NextResponse.json({ success: false, message: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: page })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}

// DELETE by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    await dbConnect()
    const { identifier } = await params

    const page = await Page.findByIdAndDelete(identifier)

    if (!page) {
      return NextResponse.json({ success: false, message: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: {} })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
