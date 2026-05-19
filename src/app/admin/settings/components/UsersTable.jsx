'use client'

import { useState, useMemo } from 'react'
import { Th, setSortBy } from '../../../components/SortableTableHeader'

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  staff: 'bg-green-100 text-green-800',
}

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manajer',
  staff: 'Staff',
}

export default function UsersTable({
  users,
  currentUserId,
  resetPwdUser,
  resetTotpUser,
  togglingUser,
  onEdit,
  onResetPassword,
  onResetTotp,
  onToggleActive,
  onDelete,
}) {
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'asc' })

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const va = a[sort.key] ?? ''
      const vb = b[sort.key] ?? ''
      const cmp = String(va).localeCompare(String(vb))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [users, sort])

  if (users.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center">Belum ada pengguna.</div>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th label="Username" onSort={() => setSortBy(setSort, 'username')} />
              <Th label="Nama" onSort={() => setSortBy(setSort, 'displayName')} />
              <Th label="Role" onSort={() => setSortBy(setSort, 'role')} />
              <Th label="Status" onSort={() => setSortBy(setSort, 'isActive')} />
              <Th label="TOTP" />
              <Th label="Dibuat" onSort={() => setSortBy(setSort, 'createdAt')} />
              <Th label="Aksi" right />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sorted.map(user => {
              const isSelf = user.id === currentUserId
              const isPwdResetting = resetPwdUser?.id === user.id
              const isTotpResetting = resetTotpUser?.id === user.id
              return (
                <tr key={user.id} className={isSelf ? 'bg-blue-50/30' : ''}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                    {user.username}
                    {isSelf && <span className="ml-1 text-xs text-blue-600">(Anda)</span>}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700">{user.displayName}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {user.mustChangePassword && (
                      <span className="ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Ganti PWD
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${user.totpEnabled ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}>
                      {user.totpEnabled ? 'Enrolled' : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {/* Edit */}
                      <button
                        onClick={() => onEdit(user)}
                        className="px-2 py-1 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      {/* Reset Password */}
                      <button
                        onClick={() => onResetPassword(user)}
                        disabled={isPwdResetting}
                        className="px-2 py-1 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isPwdResetting ? '...' : 'Reset PWD'}
                      </button>
                      {/* Reset TOTP */}
                      {user.totpEnabled && (
                        <button
                          onClick={() => onResetTotp(user)}
                          disabled={isTotpResetting}
                          className="px-2 py-1 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {isTotpResetting ? '...' : 'Reset TOTP'}
                        </button>
                      )}
                      {/* Toggle Active — disabled for self or while toggling */}
                      <button
                        onClick={() => !isSelf && onToggleActive(user)}
                        disabled={isSelf || togglingUser === user.id}
                        title={isSelf ? 'Tidak dapat mengubah akun sendiri' : user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          isSelf || togglingUser === user.id
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : user.isActive
                            ? 'border-orange-300 text-orange-700 hover:bg-orange-50'
                            : 'border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {togglingUser === user.id ? '...' : user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      {/* Delete — disabled for self */}
                      <button
                        onClick={() => !isSelf && onDelete(user)}
                        disabled={isSelf}
                        title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus permanen'}
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          isSelf
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-red-300 text-red-700 hover:bg-red-50'
                        }`}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
