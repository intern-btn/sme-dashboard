'use client'

import { useEffect, useRef, useState } from 'react'

const LABELS = {
  spbu: 'PRK SPBU',
  bpjs: 'BPJS',
  indomaret: 'Indomaret',
}

export default function TotpUnlockModal({ dataType, isOpen, onClose, onSuccess }) {
  const inputRef = useRef(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setCode('')
    setError('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [isOpen])

  if (!isOpen) return null

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/verify-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, dataType }),
    })

    setLoading(false)

    if (!res.ok) {
      setError(res.status === 429 ? 'Too many attempts. Locked out for about 15 minutes.' : 'Incorrect code.')
      return
    }

    onSuccess?.()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-900">Unlock Confidential Data</div>
          <div className="text-sm text-gray-500 mt-1">
            Enter your authenticator code to view {LABELS[dataType] || dataType} debtor details for 15 minutes.
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              autoComplete="one-time-code"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.35em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 inline-flex items-center gap-2"
              style={{ backgroundColor: '#003d7a' }}
            >
              {loading && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
