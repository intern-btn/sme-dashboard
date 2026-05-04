'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import ExportButton from '../../components/ExportButton'
import { exportTableToPDF } from '../../lib/pdfExport'
import { formatNum, formatDateDisplay, toKolNum, CHECK, WARN } from '../../../lib/business-utils'
import { Th, setSortBy } from '../../components/SortableTableHeader'

export default function BPJSTable({ rows, cabangList, filters, onFiltersChange, idasDate }) {
  const [sort, setSort] = useState({ key: 'bakiDebet', dir: 'desc' })

  const sortedRows = useMemo(() => {
    const arr = Array.isArray(rows) ? [...rows] : []
    const dir = sort.dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const ak = a?.[sort.key]
      const bk = b?.[sort.key]
      if (typeof ak === 'number' || typeof bk === 'number') {
        const an = Number.isFinite(Number(ak)) ? Number(ak) : -Infinity
        const bn = Number.isFinite(Number(bk)) ? Number(bk) : -Infinity
        return (an - bn) * dir
      }
      return String(ak || '').localeCompare(String(bk || '')) * dir
    })
    return arr
  }, [rows, sort])

  const exportRows = sortedRows.map((r) => ({
    cabang: r?.cabang || '',
    noDebitur: r?.noDebitur || '',
    nama: r?.nama || '',
    produk: r?.produk || '',
    tglAkad: formatDateDisplay(r?.tglAkad),
    tglJatuhTempo: formatDateDisplay(r?.tglJatuhTempo),
    plafon: r?.plafon ?? null,
    bakiDebet: r?.idasFound ? (r?.bakiDebet ?? null) : null,
    kol: r?.idasFound ? (r?.kol ?? '') : '',
    amtrel: r?.idasFound ? (r?.amtrel ?? null) : null,
    pokokTerbayar: r?.idasFound ? ((r?.amtrel ?? 0) - (r?.bakiDebet ?? 0)) : null,
    status: r?.idasFound ? 'IN_IDAS' : 'CLOSED',
  }))

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'BPJS')
    XLSX.writeFile(wb, `BPJS_${idasDate || 'data'}.xlsx`)
  }

  const handleExportPDF = () => {
    const headers = [
      'CABANG', 'NO DEBITUR', 'NAMA', 'PRODUK', 'TGL AKAD', 'TGL JT',
      'PLAFON', 'BAKI DEBET', 'KOL', 'AMTREL', 'POKOK TERBAYAR', 'STATUS',
    ]
    const data = exportRows.map((r) => [
      r.cabang, r.noDebitur, r.nama, r.produk, r.tglAkad, r.tglJatuhTempo,
      formatNum(r.plafon), formatNum(r.bakiDebet), r.kol, formatNum(r.amtrel),
      r.pokokTerbayar !== null ? formatNum(r.pokokTerbayar) : '-',
      r.status,
    ])
    exportTableToPDF({
      title: 'BPJS MONITORING',
      subtitle: `IDAS Date: ${idasDate || '-'}`,
      headers,
      data,
      fileName: `BPJS_${idasDate || 'data'}.pdf`,
      orientation: 'landscape',
      columnStyles: { 2: { cellWidth: 48 }, 0: { cellWidth: 22 }, 1: { cellWidth: 28 }, 3: { cellWidth: 36 } },
    })
  }

  const setFilter = (key, value) => onFiltersChange((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-gray-900">Detail Debitur</div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cabang</label>
            <select value={filters.cabang} onChange={(e) => setFilter('cabang', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Semua</option>
              {cabangList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="all">All</option>
              <option value="found">In IDAS</option>
              <option value="delayed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">KOL</label>
            <select value={filters.kol} onChange={(e) => setFilter('kol', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="all">All</option>
              <option value="kol1">KOL 1</option>
              <option value="kol2plus">KOL 2+</option>
              <option value="kol5plus">KOL 5+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari Nama</label>
            <input type="text" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Nama debitur..." />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th label="Cabang" onSort={() => setSortBy(setSort, 'cabang')} />
              <Th label="No Debitur" onSort={() => setSortBy(setSort, 'noDebitur')} />
              <Th label="Nama" onSort={() => setSortBy(setSort, 'nama')} />
              <Th label="Produk" onSort={() => setSortBy(setSort, 'produk')} />
              <Th label="Tgl Akad" onSort={() => setSortBy(setSort, 'tglAkad')} />
              <Th label="Tgl JT" onSort={() => setSortBy(setSort, 'tglJatuhTempo')} />
              <Th label="Plafon" onSort={() => setSortBy(setSort, 'plafon')} right />
              <Th label="Baki Debet" onSort={() => setSortBy(setSort, 'bakiDebet')} right />
              <Th label="KOL" onSort={() => setSortBy(setSort, 'kol')} />
              <Th label="Amtrel" onSort={() => setSortBy(setSort, 'amtrel')} right />
              <Th label="Pokok Terbayar" right />
              <Th label="Status" onSort={() => setSortBy(setSort, 'idasFound')} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRows.map((r, idx) => {
              const kolNum = toKolNum(r?.kol)
              const rowClass = !r?.idasFound ? 'bg-orange-50'
                : kolNum && kolNum >= 5 ? 'bg-red-50'
                : kolNum && kolNum >= 2 ? 'bg-yellow-50'
                : ''
              return (
                <tr key={idx} className={`${rowClass} hover:bg-gray-50`}>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r?.cabang || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap font-mono">{r?.noDebitur || '-'}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r?.nama || '-'}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">{r?.produk || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{formatDateDisplay(r?.tglAkad) || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{formatDateDisplay(r?.tglJatuhTempo) || '-'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{formatNum(r?.plafon)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-semibold" style={{ color: '#003d7a' }}>
                    {r?.idasFound ? formatNum(r?.bakiDebet) : '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r?.idasFound ? (r?.kol || '-') : '-'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{r?.idasFound ? formatNum(r?.amtrel) : '-'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {r?.idasFound ? formatNum((r?.amtrel ?? 0) - (r?.bakiDebet ?? 0)) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r?.idasFound
                      ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">{CHECK} In IDAS</span>
                      : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">{WARN} Closed</span>
                    }
                  </td>
                </tr>
              )
            })}
            {sortedRows.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-400">Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        Total rows: {sortedRows.length}. Highlight:{' '}
        <span className="text-orange-700">Closed</span> /{' '}
        <span className="text-yellow-700">KOL 2-4</span> /{' '}
        <span className="text-red-700">KOL 5+</span>
      </div>
    </div>
  )
}
