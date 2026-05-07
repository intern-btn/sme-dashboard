import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../../../lib/storage/index.js'
import { maskBusinessData, normalizeBusinessDataType } from '../../../../../lib/mask.js'
import { verifyUnlockToken } from '../../../../../lib/crypto.js'

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

    const businessType = normalizeBusinessDataType(type)
    const token = businessType
      ? await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
      : null
    const cookieValue = businessType ? request.cookies.get(`unlock_${businessType}`)?.value : null
    const isUnlocked = Boolean(
      businessType &&
      token?.sub &&
      cookieValue &&
      verifyUnlockToken(cookieValue, token.sub, businessType)
    )
    const responseData = file === 'parsed'
      ? maskBusinessData(data, businessType, isUnlocked)
      : data

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data. Please upload data first via admin portal.' },
      { status: 500 }
    )
  }
}
