'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

function EyeToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
      tabIndex={-1}
      aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
    >
      {visible ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  )
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const { update } = useSession()

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showFields, setShowFields] = useState({ current: false, new: false, confirm: false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const toggleShow = (field) => setShowFields(s => ({ ...s, [field]: !s[field] }))

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
            <div className="relative">
              <input
                type={showFields.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
                required
              />
              <EyeToggle visible={showFields.current} onToggle={() => toggleShow('current')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showFields.new ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={72}
              />
              <EyeToggle visible={showFields.new} onToggle={() => toggleShow('new')} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimal 10 karakter, maksimal 72 karakter.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showFields.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
                required
              />
              <EyeToggle visible={showFields.confirm} onToggle={() => toggleShow('confirm')} />
            </div>
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
