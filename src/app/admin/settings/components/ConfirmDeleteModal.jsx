'use client'

import { useState } from 'react'

export default function ConfirmDeleteModal({ user, onClose, onDeleted }) {
  const [typedName, setTypedName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const confirmed = typedName.trim() === user.username.trim()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!confirmed) return
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/auth/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, confirmUsername: typedName.trim() }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || 'Gagal menghapus pengguna.')
      return
    }

    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="text-lg font-semibold text-red-700">Hapus Pengguna Permanen</div>
          <div className="text-sm text-gray-500 mt-1">
            Tindakan ini tidak dapat dibatalkan.
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-700">
            Untuk konfirmasi, ketik username <strong className="font-mono">{user.username}</strong> di bawah ini:
          </p>
          <input
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={user.username}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            autoComplete="off"
            autoFocus
          />

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!confirmed || submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menghapus...' : 'Hapus Permanen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
