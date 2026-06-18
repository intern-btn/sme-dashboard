'use client'

import { useState, useEffect } from 'react'
import { KANWIL_LIST, ACCESS_SCOPES } from '../../../../lib/offices.js'

const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manajer' },
  { value: 'admin', label: 'Admin' },
]

export default function UserFormModal({ mode, user, currentUserId, onClose, onSaved }) {
  const isEdit = mode === 'edit'

  const [form, setForm] = useState({
    username:    user?.username    || '',
    displayName: user?.displayName || '',
    role:        user?.role        || 'staff',
    accessScope: user?.accessScope || 'national',
    kanwil:      user?.kanwil      || '',
    cabang:      user?.cabang      || '',
  })
  const [cabangs, setCabangs] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isSelf = isEdit && user?.id === currentUserId

  // Fetch cabang list for the selected kanwil
  useEffect(() => {
    if (form.accessScope !== 'cabang' || !form.kanwil) {
      setCabangs([])
      return
    }
    fetch('/api/offices')
      .then(r => r.ok ? r.json() : { cabangs: [] })
      .then(d => {
        const filtered = (d.cabangs || [])
          .filter(c => c.kanwil === form.kanwil)
          .map(c => c.name)
          .sort()
        setCabangs(filtered)
      })
      .catch(() => setCabangs([]))
  }, [form.kanwil, form.accessScope])

  // Enforce: admin role → national scope
  const effectiveScope = form.role === 'admin' ? 'national' : form.accessScope

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      username:    form.username,
      displayName: form.displayName,
      role:        form.role,
      accessScope: effectiveScope,
      kanwil:      effectiveScope !== 'national' ? (form.kanwil || null) : null,
      cabang:      effectiveScope === 'cabang'   ? (form.cabang || null) : null,
    }

    const body = isEdit ? { id: user.id, ...payload } : payload
    delete body.username // username not editable in edit mode
    if (!isEdit) body.username = form.username

    const res = await fetch('/api/auth/users', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || 'Terjadi kesalahan.')
      return
    }

    onSaved(data.user, data.tempPassword)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
          </div>
          {!isEdit && (
            <div className="text-sm text-gray-500 mt-1">
              Password sementara akan dibuat otomatis dan ditampilkan sekali.
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
              disabled={isEdit}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              required={!isEdit}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
              disabled={isSelf}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {isSelf && (
              <p className="text-xs text-gray-400 mt-1">Tidak dapat mengubah role akun sendiri.</p>
            )}
          </div>

          {/* Access scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Akses Data</label>
            <select
              value={effectiveScope}
              onChange={(e) => setForm(f => ({ ...f, accessScope: e.target.value, kanwil: '', cabang: '' }))}
              disabled={form.role === 'admin'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {ACCESS_SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {form.role === 'admin' && (
              <p className="text-xs text-gray-400 mt-1">Admin selalu mendapat akses nasional.</p>
            )}
          </div>

          {/* Kanwil selector */}
          {(effectiveScope === 'kanwil' || effectiveScope === 'cabang') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kantor Wilayah</label>
              <select
                value={form.kanwil}
                onChange={(e) => setForm(f => ({ ...f, kanwil: e.target.value, cabang: '' }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Pilih Kanwil —</option>
                {KANWIL_LIST.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          )}

          {/* Cabang selector */}
          {effectiveScope === 'cabang' && form.kanwil && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kantor Cabang</label>
              <select
                value={form.cabang}
                onChange={(e) => setForm(f => ({ ...f, cabang: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Pilih Cabang —</option>
                {cabangs.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {cabangs.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Memuat daftar cabang…</p>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#003d7a' }}
            >
              {submitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Buat Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
