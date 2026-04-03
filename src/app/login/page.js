'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const callbackUrl = useMemo(() => {
    const cb = searchParams.get('callbackUrl')
    return cb && cb.startsWith('/') ? cb : '/'
  }, [searchParams])

  const [form, setForm] = useState({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await signIn('credentials', {
      redirect: false,
      username: form.username,
      password: form.password,
      callbackUrl,
    })

    setSubmitting(false)

    if (!res || res.error) {
      setError('Username atau password salah.')
      return
    }

    router.push(res.url || callbackUrl)
  }

  return (
    <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          value={form.username}
          onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="current-password"
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
        {submitting ? 'Memproses...' : 'Login'}
      </button>

      <div className="text-xs text-gray-500 text-center">
        Lupa password? Hubungi Admin.
      </div>
    </form>
  )
}

export default function LoginPage() {
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
            <div className="text-xs opacity-90">Ver 0.0.1</div>
          </div>
        </div>
        <Suspense fallback={<div className="px-6 py-6 text-sm text-gray-400">Memuat...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
