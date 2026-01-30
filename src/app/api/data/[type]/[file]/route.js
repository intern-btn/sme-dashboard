import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request, { params }) {
  const { type, file } = params

  try {
    // Direct Blob URL (from Blob storage settings)
    if (!process.env.BLOB_BASE_URL) {
      return NextResponse.json(
        { error: 'Blob storage not configured. Please upload data first.' },
        { status: 503 }
      )
    }
    const blobUrl = `${process.env.BLOB_BASE_URL}/${type}_${file}.json`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(blobUrl, {
      cache: 'no-store',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Data not found: ${type}_${file}.json`, status: response.status },
        { status: 404 }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })

  } catch (error) {
    // Handle timeout or network errors gracefully
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - Blob storage may be unavailable' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch data. Please upload data first via admin portal.' },
      { status: 500 }
    )
  }
}
