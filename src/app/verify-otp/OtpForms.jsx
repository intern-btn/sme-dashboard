'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function OtpForms({ mode, secret, qrCodeDataUrl, otpauthUrl }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update } = useSession()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const callbackUrl = useMemo(() => {
    const cb = searchParams.get('callbackUrl')
    return cb && cb.startsWith('/') ? cb : '/'
  }, [searchParams])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/auth/complete-totp', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        ...(mode === 'enroll' ? { secret } : {}),
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      setError(res.status === 429 ? 'Terlalu banyak percobaan. Coba lagi sekitar 15 menit.' : 'Kode tidak valid.')
      return
    }

    await update({ totpVerified: true })
    router.replace(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
      {mode === 'enroll' ? (
        <>
          <div className="text-sm text-gray-600">
            Scan QR ini dengan Google Authenticator atau Microsoft Authenticator, lalu masukkan kode 6 digit pertama.
          </div>
          <div className="flex justify-center">
            <img src={qrCodeDataUrl} alt="QR enrollment TOTP" className="w-48 h-48 border border-gray-200 rounded-lg" />
          </div>
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer font-medium text-gray-700">Tidak bisa scan QR?</summary>
            <div className="mt-2 break-all font-mono bg-gray-50 border border-gray-200 rounded-lg p-2">{otpauthUrl}</div>
          </details>
        </>
      ) : (
        <div className="text-sm text-gray-600">
          Masukkan kode 6 digit dari aplikasi authenticator Anda.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kode TOTP</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          pattern="\d{6}"
          autoComplete="one-time-code"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-[0.35em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
        style={{ backgroundColor: '#003d7a' }}
      >
        {submitting ? 'Memverifikasi...' : mode === 'enroll' ? 'Confirm enrollment' : 'Verify'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Kembali ke halaman login
        </button>
      </div>
    </form>
  )
}
