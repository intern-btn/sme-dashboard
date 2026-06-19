'use client'

import { useMemo, useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import ExportButton from '../../components/ExportButton'
import { exportTableToPDF } from '../../lib/pdfExport'
import { Th, setSortBy } from '../../components/SortableTableHeader'

const PAGE_SIZE = 25

const CAT_ROW_CLASS = {
  'Sangat Produktif': 'bg-green-50',
  'Kurang Produktif': 'bg-amber-50',
  'Tidak Produktif':  'bg-red-50',
}

const CAT_BADGE_CLASS = {
  'Sangat Produktif': 'bg-green-100 text-green-800',
  'Kurang Produktif': 'bg-amber-100 text-amber-800',
  'Tidak Produktif':  'bg-red-100 text-red-800',
}

function fmtNum(val) {
  if (val == null || isNaN(val)) return '-'
  return Number(val).toLocaleString('id-ID')
}

function fmtPct(val) {
  if (val == null || isNaN(val)) return '-'
  return `${Number(val).toFixed(1)}%`
}

export default function ProductivityTable({ rows = [], uploadedAt }) {
  const [sort, setSort] = useState({ key: 'pctAch', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    kantorWilayah: '',
    kantorCabang: '',
    kategori: '',
    jabatan: '',
    q: '',
  })

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  // Reset to page 1 whenever filters or sort change
  useEffect(() => { setPage(1) }, [filters, sort])

  const kanwilList   = useMemo(() => [...new Set(rows.map(r => r.kantorWilayah).filter(Boolean))].sort(), [rows])
  const cabangList   = useMemo(() => {
    const source = filters.kantorWilayah
      ? rows.filter(r => r.kantorWilayah === filters.kantorWilayah)
      : rows
    return [...new Set(source.map(r => r.kantorCabang).filter(Boolean))].sort()
  }, [rows, filters.kantorWilayah])
  const jabatanList  = useMemo(() => [...new Set(rows.map(r => r.jabatan).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase().trim()
    return rows.filter(r => {
      if (filters.kantorWilayah && r.kantorWilayah !== filters.kantorWilayah) return false
      if (filters.kantorCabang  && r.kantorCabang  !== filters.kantorCabang)  return false
      if (filters.kategori      && r.kategori      !== filters.kategori)       return false
      if (filters.jabatan       && r.jabatan        !== filters.jabatan)       return false
      if (q && !r.nama.toLowerCase().includes(q) && !r.nip.includes(q)) return false
      return true
    })
  }, [rows, filters])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sort.dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      if (typeof av === 'number' || typeof bv === 'number') {
        const an = av != null ? Number(av) : -Infinity
        const bn = bv != null ? Number(bv) : -Infinity
        return (an - bn) * dir
      }
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir
    })
    return arr
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExportExcel = () => {
    const data = sorted.map(r => ({
      'RM Code': r.rmCode,
      'NIP': r.nip,
      'Nama': r.nama,
      'Jabatan': r.jabatan,
      'Jenis Outlet': r.jenisOutlet,
      'Outlet': r.outlet,
      'Kantor Cabang': r.kantorCabang,
      'Kantor Wilayah': r.kantorWilayah,
      'Target': r.target,
      'Realisasi': r.realisasi,
      '% Capaian': r.pctAch,
      'Skor': r.skor,
      'Kategori': r.kategori,
      'NOA': r.noa,
      'Pipeline Gap': r.pipelineGap,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productivity')
    XLSX.writeFile(wb, `Productivity_${uploadedAt?.split('T')[0] || 'data'}.xlsx`)
  }

  const handleExportPDF = () => {
    const headers = [
      'NIP', 'Nama', 'Jabatan', 'Kantor Cabang', 'Kantor Wilayah',
      'Target', 'Realisasi', '% Capaian', 'Skor', 'Kategori', 'NOA',
    ]
    const data = sorted.map(r => [
      r.nip, r.nama, r.jabatan, r.kantorCabang, r.kantorWilayah,
      fmtNum(r.target), fmtNum(r.realisasi), fmtPct(r.pctAch),
      fmtNum(r.skor), r.kategori, fmtNum(r.noa),
    ])
    exportTableToPDF({
      title: 'PRODUCTIVITY MONITORING',
      subtitle: uploadedAt ? `Data per: ${uploadedAt.split('T')[0]}` : '',
      headers,
      data,
      fileName: `Productivity_${uploadedAt?.split('T')[0] || 'data'}.pdf`,
      orientation: 'landscape',
      columnStyles: { 1: { cellWidth: 40 }, 2: { cellWidth: 32 } },
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-gray-900">Detail RM</div>
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExportPDF} label="Export PDF" />
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kantor Wilayah</label>
            <select
              value={filters.kantorWilayah}
              onChange={e => { setFilter('kantorWilayah', e.target.value); setFilter('kantorCabang', '') }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {kanwilList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kantor Cabang</label>
            <select
              value={filters.kantorCabang}
              onChange={e => setFilter('kantorCabang', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {cabangList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
            <select
              value={filters.kategori}
              onChange={e => setFilter('kategori', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              <option value="Sangat Produktif">Sangat Produktif</option>
              <option value="Kurang Produktif">Kurang Produktif</option>
              <option value="Tidak Produktif">Tidak Produktif</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jabatan</label>
            <select
              value={filters.jabatan}
              onChange={e => setFilter('jabatan', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {jabatanList.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari Nama / NIP</label>
            <input
              type="text"
              value={filters.q}
              onChange={e => setFilter('q', e.target.value)}
              placeholder="Nama atau NIP..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th label="Nama"           onSort={() => setSortBy(setSort, 'nama')} />
              <Th label="NIP"            onSort={() => setSortBy(setSort, 'nip')} />
              <Th label="Jabatan"        onSort={() => setSortBy(setSort, 'jabatan')} />
              <Th label="Outlet"         onSort={() => setSortBy(setSort, 'outlet')} />
              <Th label="Kantor Cabang"  onSort={() => setSortBy(setSort, 'kantorCabang')} />
              <Th label="Kantor Wilayah" onSort={() => setSortBy(setSort, 'kantorWilayah')} />
              <Th label="Target"         onSort={() => setSortBy(setSort, 'target')} right />
              <Th label="Realisasi"      onSort={() => setSortBy(setSort, 'realisasi')} right />
              <Th label="% Capaian"      onSort={() => setSortBy(setSort, 'pctAch')} right />
              <Th label="Skor"           onSort={() => setSortBy(setSort, 'skor')} right />
              <Th label="Kategori"       onSort={() => setSortBy(setSort, 'kategori')} />
              <Th label="NOA"            onSort={() => setSortBy(setSort, 'noa')} right />
              <Th label="Gap Pipeline"   onSort={() => setSortBy(setSort, 'pipelineGap')} right />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map((r, idx) => (
              <tr
                key={idx}
                className={`${CAT_ROW_CLASS[r.kategori] || ''} hover:brightness-95`}
              >
                <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r.nama || '-'}</td>
                <td className="px-3 py-2 text-gray-700 font-mono whitespace-nowrap">{r.nip || '-'}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.jabatan || '-'}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.outlet || '-'}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.kantorCabang || '-'}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.kantorWilayah || '-'}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{fmtNum(r.target)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap font-semibold" style={{ color: '#003d7a' }}>{fmtNum(r.realisasi)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{fmtPct(r.pctAch)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{fmtNum(r.skor)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.kategori ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${CAT_BADGE_CLASS[r.kategori] || 'bg-gray-100 text-gray-700'}`}>
                      {r.kategori}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{fmtNum(r.noa)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{fmtNum(r.pipelineGap)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-gray-400">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-gray-200 flex items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex flex-col gap-0.5">
          <span>Total: <span className="font-medium text-gray-700">{sorted.length}</span> RM</span>
          <span>
            <span className="text-green-700">Sangat Produktif</span>{' / '}
            <span className="text-amber-700">Kurang Produktif</span>{' / '}
            <span className="text-red-700">Tidak Produktif</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[
            { label: '«', onClick: () => setPage(1),                          disabled: page <= 1,           title: 'Halaman pertama' },
            { label: '‹', onClick: () => setPage(p => Math.max(1, p - 1)),    disabled: page <= 1,           title: 'Sebelumnya' },
          ].map(btn => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              disabled={btn.disabled}
              title={btn.title}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-xl font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >{btn.label}</button>
          ))}
          <span className="px-3 text-sm font-semibold text-gray-700 tabular-nums whitespace-nowrap">
            {page} / {totalPages}
          </span>
          {[
            { label: '›', onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page >= totalPages, title: 'Selanjutnya' },
            { label: '»', onClick: () => setPage(totalPages),                        disabled: page >= totalPages, title: 'Halaman terakhir' },
          ].map(btn => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              disabled={btn.disabled}
              title={btn.title}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-xl font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >{btn.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
