import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { password } = await request.json()

    // Get admin password from environment variable
    // Default to 'admin123' for development - CHANGE IN PRODUCTION!
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (password === adminPassword) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
