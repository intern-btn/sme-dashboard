'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from './layout'

const STATUS_CONFIG = {
  draft:       { label: 'Draft',       color: 'bg-gray-100 text-gray-600' },
  review:      { label: 'Review',      color: 'bg-yellow-100 text-yellow-800' },
  approved:    { label: 'Disetujui',   color: 'bg-green-100 text-green-800' },
  distributed: { label: 'Didistribusi', color: 'bg-blue-100 text-blue-800' },
}

const CATEGORY_LABELS = {
  general: 'Memo Umum',
  izin_prinsip: 'Izin Prinsip',
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
}

function CategoryBadge({ category }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
      category === 'izin_prinsip' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {CATEGORY_LABELS[category] || category}
    </span>
  )
}

export default function MemoListPage() {
  const user = useAuth()
  const [memos, setMemos] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', category: '', search: '' })
  const [draftSearch, setDraftSearch] = useState('')

  const fetchMemos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page })
    if (filters.status) params.set('status', filters.status)
    if (filters.category) params.set('category', filters.category)
    if (filters.search) params.set('search', filters.search)
    try {
      const res = await fetch(`/api/memo?${params}`)
      const data = await res.json()
      setMemos(data.memos || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchMemos() }, [fetchMemos])

  const handleFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1) }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  const canCreate = user && ['editor', 'approver', 'admin'].includes(user.role)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Memo</h1>
          <p className="text-sm text-gray-500 mt-1">{total} memo ditemukan</p>
        </div>
        {canCreate && (
          <Link href="/memo/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: '#003d7a' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Memo
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
          <select value={filters.category} onChange={e => handleFilter('category', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Kategori</option>
            <option value="general">Memo Umum</option>
            <option value="izin_prinsip">Izin Prinsip</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select value={filters.status} onChange={e => handleFilter('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
        <form onSubmit={e => { e.preventDefault(); handleFilter('search', draftSearch) }} className="flex gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
            <input type="text" value={draftSearch} onChange={e => setDraftSearch(e.target.value)}
              placeholder="Perihal, nomor memo..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
          </div>
          <button type="submit" className="self-end px-3 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#003d7a' }}>Cari</button>
          {filters.search && (
            <button type="button" onClick={() => { setDraftSearch(''); handleFilter('search', '') }}
              className="self-end px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm">Reset</button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
          </div>
        ) : memos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">Belum ada memo</p>
            {canCreate && <Link href="/memo/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Buat memo pertama</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">No. Memo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Perihal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Dari</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Kategori</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Dibuat Oleh</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {memos.map(memo => (
                  <tr key={memo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/memo/${memo.id}`} className="font-mono text-xs font-semibold text-blue-700 hover:underline">
                        {memo.nomorMemo || <span className="text-gray-400 italic">Draft</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Link href={`/memo/${memo.id}`} className="hover:text-blue-700 line-clamp-2 text-gray-800">
                        {memo.perihal || <span className="text-gray-400 italic">(belum ada perihal)</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap max-w-[180px] truncate">{memo.dari || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><CategoryBadge category={memo.category} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={memo.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{memo.createdBy}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(memo.tanggalMemo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-500">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
