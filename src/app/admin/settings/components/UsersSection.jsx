'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import UsersTable from './UsersTable'
import UserFormModal from './UserFormModal'
import PasswordRevealModal from './PasswordRevealModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'

export default function UsersSection() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)        // user object to edit
  const [revealedPwd, setRevealedPwd] = useState(null)  // { username, password, context }
  const [resetPwdUser, setResetPwdUser] = useState(null) // user whose pwd to reset
  const [deleteUser, setDeleteUser] = useState(null)    // user to hard-delete
  const [resetTotpUser, setResetTotpUser] = useState(null) // user whose TOTP to reset

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/users')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setUsers(data.users)
    } catch {
      setError('Gagal memuat data pengguna.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Called when create/edit saves successfully
  const handleSaved = (user, tempPassword) => {
    fetchUsers()
    if (tempPassword) {
      setRevealedPwd({ username: user.username, password: tempPassword, context: 'created' })
    }
  }

  // Reset password action
  const handleResetPassword = async (user) => {
    setResetPwdUser(user)
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' })
    const data = await res.json()
    setResetPwdUser(null)
    if (!res.ok) {
      alert(data.error || 'Gagal reset password.')
      return
    }
    setRevealedPwd({ username: user.username, password: data.tempPassword, context: 'reset' })
  }

  // Reset TOTP action
  const handleResetTotp = async (user) => {
    setResetTotpUser(user)
    if (!confirm(`Reset TOTP untuk ${user.username}? Mereka harus enroll ulang saat login berikutnya.`)) {
      setResetTotpUser(null)
      return
    }
    const res = await fetch(`/api/admin/users/${user.id}/reset-totp`, { method: 'POST' })
    const data = await res.json()
    setResetTotpUser(null)
    if (!res.ok) { alert(data.error || 'Gagal reset TOTP.'); return }
    fetchUsers()
  }

  // Toggle isActive
  const handleToggleActive = async (user) => {
    const action = user.isActive ? 'menonaktifkan' : 'mengaktifkan'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} akun ${user.username}?`)) return
    const res = await fetch('/api/auth/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error || `Gagal ${action}.`); return }
    fetchUsers()
  }

  // After confirmed hard delete
  const handleDeleted = () => {
    setDeleteUser(null)
    fetchUsers()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akun pengguna sistem.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#003d7a' }}
        >
          + Tambah Pengguna
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Memuat...</div>
      ) : (
        <UsersTable
          users={users}
          currentUserId={currentUserId}
          resetPwdUser={resetPwdUser}
          resetTotpUser={resetTotpUser}
          onEdit={setEditUser}
          onResetPassword={handleResetPassword}
          onResetTotp={handleResetTotp}
          onToggleActive={handleToggleActive}
          onDelete={setDeleteUser}
        />
      )}

      {/* Modals */}
      {createOpen && (
        <UserFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={handleSaved}
        />
      )}
      {editUser && (
        <UserFormModal
          mode="edit"
          user={editUser}
          currentUserId={currentUserId}
          onClose={() => setEditUser(null)}
          onSaved={handleSaved}
        />
      )}
      {revealedPwd && (
        <PasswordRevealModal
          username={revealedPwd.username}
          password={revealedPwd.password}
          context={revealedPwd.context}
          onClose={() => setRevealedPwd(null)}
        />
      )}
      {deleteUser && (
        <ConfirmDeleteModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
