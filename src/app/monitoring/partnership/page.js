'use client'

import { useState, useEffect } from 'react'
import AppHeader from '../../components/AppHeader'
import PartnershipDashboard from '../../partnership/components/PartnershipDashboard'
import PartnershipGantt from '../../partnership/components/PartnershipGantt'
import PartnershipFormModal from '../../partnership/components/PartnershipFormModal'

const monitoringSubNav = [
  { href: '/monitoring', label: 'Credit Monitoring', exact: true },
  { href: '/monitoring/partnership', label: 'Dashboard Partnership' },
  { href: '/monitoring/productivity', label: 'Productivity' },
]

export default function PartnershipMonitoringPage() {
  const [user, setUser] = useState(null)
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState(null) // null | 'create' | 'edit'
  const [editingPartner, setEditingPartner] = useState(null)
  const [showGantt, setShowGantt] = useState(false)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
  }, [])

  async function fetchPartners() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/partnership')
      if (!res.ok) throw new Error('Gagal memuat data partnership.')
      const data = await res.json()
      setPartners(data.partnerships || [])
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  function refresh() {
    fetchPartners()
  }

  async function handleDelete(id) {
    if (!window.confirm('Hapus partner ini?')) return
    try {
      const res = await fetch('/api/partnership/' + id, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus partner.')
      refresh()
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat menghapus.')
    }
  }

  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const isNational = user?.accessScope === 'national'

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} memoNavLinks={monitoringSubNav} />

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Partnership</h1>
            <p className="text-sm text-gray-500 mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGantt(v => !v)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showGantt
                  ? 'bg-[#003d7a] text-white border-[#003d7a]'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
              }`}
            >
              {showGantt ? 'Sembunyikan Timeline' : 'Timeline Gantt'}
            </button>
            {isNational && (
              <button
                type="button"
                onClick={() => { setEditingPartner(null); setModalMode('create') }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#003d7a' }}
              >
                + Tambah Partner
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-xl p-6">
            <div className="text-red-700 font-medium">{error}</div>
          </div>
        )}

        {/* Dashboard */}
        {!loading && !error && (
          <PartnershipDashboard
            partners={partners}
            onEdit={(p) => { setEditingPartner(p); setModalMode('edit') }}
            onDelete={handleDelete}
            isNational={isNational}
          />
        )}

        {/* Gantt timeline */}
        {!loading && !error && showGantt && (
          <div className="mt-6">
            <PartnershipGantt partners={partners} />
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode !== null && (
        <PartnershipFormModal
          mode={modalMode}
          partner={editingPartner}
          onClose={() => { setModalMode(null); setEditingPartner(null) }}
          onSaved={() => { refresh() }}
        />
      )}
    </div>
  )
}
