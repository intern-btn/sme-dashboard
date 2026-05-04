import { handleUpload } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const runtime = 'edge'

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (token.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type (Excel files only)
        const validExtensions = ['.xlsx', '.xls']
        const hasValidExtension = validExtensions.some(ext => pathname.toLowerCase().endsWith(ext))

        if (!hasValidExtension) {
          throw new Error('Only Excel files (.xlsx, .xls) are allowed')
        }

        // Return metadata for the upload
        return {
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB max
          addRandomSuffix: true, // Add random suffix to avoid conflicts
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString()
          })
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.pathname)
      }
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload token' },
      { status: 400 }
    )
  }
}
