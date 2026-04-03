'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import ExportButton from '../../components/ExportButton'
import { exportTableToPDF } from '../../lib/pdfExport'

const formatRp = (n) => `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)}`
const formatNum = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0)

function toKolNum(kol) {
  const kolNum = parseInt(String(kol || '').replace(/[^\d]/g, ''), 10)
  return Number.isNaN(kolNum) ? null : kolNum
}

export default function SPBUTable({ rows, cabangList, filters, onFiltersChange, idasDate }) {
  const [sort, setSort] = useState({ key: 'bakiDebet', dir: 'desc' })

  const sortedRows = useMemo(() => {
    const arr = Array.isArray(rows) ? [...rows] : []
    const dir = sort.dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const ak = a?.[sort.key]
      const bk = b?.[sort.key]
      if (typeof ak === 'number' && typeof bk === 'number') return (ak - bk) * dir
      return String(ak || '').localeCompare(String(bk || '')) * dir
    })
    return arr
  }, [rows, sort])

  const exportRows = sortedRows.map((r) => ({
    nama: r.nama,
    noRekening: r.noRekening,
    cabang: r.cabang,
    tipeProduk: r.tipeProduk,
    plafond: r.plafond,
    amtrel: r.amtrel,
    bakiDebet: r.bakiDebet,
    kol: r.kol,
    plNpl: r.plNpl,
    tglJatuhTempo: r.tglJatuhTempo,
    tunggakan: r.tunggakan,
    cms: r.cms ? 'Y' : '',
    edc: r.edc ? 'Y' : '',
    qris: r.qris ? 'Y' : '',
    idasDelayed: r.idasDelayed ? 'Y' : '',
  }))

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'PRK_SPBU')
    XLSX.writeFile(wb, `PRK_SPBU_${idasDate || 'data'}.xlsx`)
  }

  const handleExportPDF = () => {
    const headers = [
      'NAMA', 'NO. REKENING', 'CABANG', 'TIPE PRODUK', 'PLAFOND', 'AMTREL', 'BAKI DEBET',
      'KOL', 'PL/NPL', 'TGL JT TEMPO', 'TUNGGAKAN', 'CMS', 'EDC', 'QRIS', 'IDAS DELAY'
    ]
    const data = exportRows.map((r) => [
      r.nama,
      r.noRekening,
      r.cabang,
      r.tipeProduk,
      formatNum(r.plafond),
      formatNum(r.amtrel),
      formatNum(r.bakiDebet),
      r.kol,
      r.plNpl,
      r.tglJatuhTempo || '',
      formatNum(r.tunggakan),
      r.cms,
      r.edc,
      r.qris,
      r.idasDelayed,
    ])

    exportTableToPDF({
      title: 'PRK SPBU MONITORING',
      subtitle: `IDAS Date: ${idasDate || '-'}`,
      headers,
      data,
      fileName: `PRK_SPBU_${idasDate || 'data'}.pdf`,
      orientation: 'landscape',
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 24 },
        3: { cellWidth: 35 },
      }
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
            <select
              value={filters.cabang}
              onChange={(e) => setFilter('cabang', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {cabangList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">KOL</label>
            <select
              value={filters.kol}
              onChange={(e) => setFilter('kol', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="kol1">KOL 1</option>
              <option value="kol2">KOL 2</option>
              <option value="kol3plus">KOL 3+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">PL/NPL</label>
            <select
              value={filters.plnpl}
              onChange={(e) => setFilter('plnpl', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="PL">PL</option>
              <option value="NPL">NPL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari Nama</label>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Nama debitur..."
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th label="Nama" onSort={() => setSortBy(setSort, sort, 'nama')} />
              <Th label="No. Rekening" onSort={() => setSortBy(setSort, sort, 'noRekening')} />
              <Th label="Cabang" onSort={() => setSortBy(setSort, sort, 'cabang')} />
              <Th label="Tipe Produk" />
              <Th label="Plafond" onSort={() => setSortBy(setSort, sort, 'plafond')} right />
              <Th label="Amtrel" onSort={() => setSortBy(setSort, sort, 'amtrel')} right />
              <Th label="Baki Debet" onSort={() => setSortBy(setSort, sort, 'bakiDebet')} right />
              <Th label="KOL" onSort={() => setSortBy(setSort, sort, 'kol')} />
              <Th label="PL/NPL" />
              <Th label="Tgl JT" />
              <Th label="Tunggakan" onSort={() => setSortBy(setSort, sort, 'tunggakan')} right />
              <Th label="CMS" />
              <Th label="EDC" />
              <Th label="QRIS" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRows.map((r, idx) => {
              const plnpl = String(r?.plNpl || '').toUpperCase()
              const kolNum = toKolNum(r?.kol)
              const rowClass = plnpl.includes('NPL')
                ? 'bg-red-50'
                : r?.idasDelayed
                  ? 'bg-orange-50'
                  : (kolNum && kolNum >= 2)
                    ? 'bg-yellow-50'
                    : ''

              return (
                <tr key={idx} className={`${rowClass} hover:bg-gray-50`}>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r.nama}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.noRekening || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.cabang || '-'}</td>
                  <td className="px-3 py-2 text-gray-700">{r.tipeProduk || (r.idasDelayed ? '(IDAS delayed)' : '-')}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{formatNum(r.plafond)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{formatNum(r.amtrel)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-semibold" style={{ color: '#003d7a' }}>
                    {formatNum(r.bakiDebet)}
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.kol || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.plNpl || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.tglJatuhTempo || '-'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{formatNum(r.tunggakan)}</td>
                  <td className="px-3 py-2 text-center">{r.cms ? '✓' : ''}</td>
                  <td className="px-3 py-2 text-center">{r.edc ? '✓' : ''}</td>
                  <td className="px-3 py-2 text-center">{r.qris ? '✓' : ''}</td>
                </tr>
              )
            })}
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-gray-400">Tidak ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        Total rows: {sortedRows.length}. Highlight: <span className="text-red-700">NPL</span> / <span className="text-orange-700">IDAS delayed</span> / <span className="text-yellow-700">KOL 2+</span>
      </div>
    </div>
  )
}

function Th({ label, onSort = null, right = false }) {
  return (
    <th className={`px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center gap-1 ${right ? 'justify-end' : ''}`}>
        <span>{label}</span>
        {onSort && (
          <button type="button" onClick={onSort} className="text-gray-400 hover:text-gray-600">↕</button>
        )}
      </div>
    </th>
  )
}

function setSortBy(setSort, sort, key) {
  setSort((prev) => {
    if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    return { key, dir: 'desc' }
  })
}
