import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Page from '@/models/Page'

export async function GET() {
  try {
    await dbConnect()
    const pages = await Page.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: pages })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const page = await Page.create(body)
    return NextResponse.json({ success: true, data: page }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}
