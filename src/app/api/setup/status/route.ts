import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const envPath = path.join(process.cwd(), '.env')
    const envExists = fs.existsSync(envPath)

    return NextResponse.json({
      success: true,
      setupCompleted: envExists,
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      setupCompleted: false,
    })
  }
}