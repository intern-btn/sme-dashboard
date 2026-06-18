'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { update } = useSession()

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan.')
        return
      }

      await update({ mustChangePassword: false })
      router.replace('/')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan jaringan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 text-white" style={{ backgroundColor: '#003d7a' }}>
          <div className="flex flex-col items-center text-center gap-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/1280px-BTN_2024.svg.png"
              alt="BTN"
              className="h-10 w-auto object-contain"
            />
            <div className="font-bold text-lg leading-tight">SME Dashboard</div>
            <div className="text-sm opacity-90 mt-1">Buat Password Baru</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
          <p className="text-sm text-gray-600">
            Akun Anda menggunakan password sementara. Buat password baru untuk melanjutkan.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Sementara (Saat Ini)</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={72}
            />
            <p className="text-xs text-gray-400 mt-1">Minimal 10 karakter, maksimal 72 karakter.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
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
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#003d7a' }}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}
