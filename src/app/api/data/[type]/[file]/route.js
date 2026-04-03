import { NextResponse } from 'next/server'
import { getStorage } from '../../../../../lib/storage/index.js'

export const runtime = 'nodejs'

export async function GET(request, { params }) {
  const { type, file } = await params

  try {
    const storage = getStorage()
    const data = await storage.get(`${type}_${file}.json`)

    if (!data) {
      return NextResponse.json(
        { error: `Data not found: ${type}_${file}.json` },
        { status: 404 }
      )
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data. Please upload data first via admin portal.' },
      { status: 500 }
    )
  }
}
