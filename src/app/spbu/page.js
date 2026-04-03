'use client'

import { useMemo, useState } from 'react'
import { useDataFetch } from '../hooks/useDataFetch'
import SPBUDashboard from './components/SPBUDashboard'
import SPBUTable from './components/SPBUTable'

function normName(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export default function SPBUPage() {
  const { data: idasData, metadata, loading, error, noData, refresh } = useDataFetch('prk_spbu')
  const { data: manualData } = useDataFetch('prk_spbu_manual')
  const { data: trendData } = useDataFetch('prk_spbu_trend')

  const [filters, setFilters] = useState({
    cabang: '',
    kol: 'all',
    plnpl: 'all',
    q: '',
  })

  const merged = useMemo(() => {
    const idasRows = Array.isArray(idasData?.rows) ? idasData.rows : []
    const manualRows = Array.isArray(manualData?.rows) ? manualData.rows : []

    const manualMap = new Map()
    for (const m of manualRows) {
      const key = normName(m?.nama)
      if (!key) continue
      if (!manualMap.has(key)) manualMap.set(key, m)
    }

    const usedManual = new Set()
    const out = idasRows.map((r) => {
      const key = normName(r?.nama)
      const m = key ? manualMap.get(key) : null
      if (m) usedManual.add(key)
      return {
        ...r,
        idasDelayed: false,
        manual: m || null,
        tglJatuhTempo: m?.tglJatuhTempo || null,
        cms: !!m?.cms,
        edc: !!m?.edc,
        qris: !!m?.qris,
        agunan: m?.agunan || '',
      }
    })

    for (const m of manualRows) {
      const key = normName(m?.nama)
      if (!key || usedManual.has(key)) continue
      out.push({
        tanggal: null,
        tipeProduk: '',
        nama: m?.nama || '',
        noRekening: '',
        bakiDebet: 0,
        plafond: m?.plafon || 0,
        amtrel: 0,
        kol: '',
        plNpl: '',
        cabang: m?.cabang || '',
        kanwil: '',
        tunggakan: 0,
        idasDelayed: true,
        manual: m,
        tglJatuhTempo: m?.tglJatuhTempo || null,
        cms: !!m?.cms,
        edc: !!m?.edc,
        qris: !!m?.qris,
        agunan: m?.agunan || '',
      })
    }

    return out
  }, [idasData, manualData])

  const filteredRows = useMemo(() => {
    const q = normName(filters.q)
    return merged.filter((r) => {
      if (filters.cabang && (r?.cabang || '') !== filters.cabang) return false
      if (filters.plnpl !== 'all') {
        const v = String(r?.plNpl || '').toUpperCase()
        if (filters.plnpl === 'PL' && !v.includes('PL')) return false
        if (filters.plnpl === 'NPL' && !v.includes('NPL')) return false
      }
      if (filters.kol !== 'all') {
        const kolNum = parseInt(String(r?.kol || '').replace(/[^\d]/g, ''), 10)
        if (filters.kol === 'kol1' && kolNum !== 1) return false
        if (filters.kol === 'kol2' && kolNum !== 2) return false
        if (filters.kol === 'kol3plus' && (!kolNum || kolNum < 3)) return false
      }
      if (q && !normName(r?.nama).includes(q)) return false
      return true
    })
  }, [merged, filters])

  const cabangList = useMemo(() => {
    const set = new Set()
    for (const r of merged) {
      const c = (r?.cabang || '').trim()
      if (c) set.add(c)
    }
    return Array.from(set).sort()
  }, [merged])

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PRK SPBU Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">
            Data IDAS: {metadata?.idasDate || '-'} {metadata?.uploadDate ? `• Uploaded: ${new Date(metadata.uploadDate).toLocaleString('id-ID')}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      )}

      {!loading && (error || noData) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-gray-700 font-medium">Belum ada data PRK SPBU.</div>
          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
          <div className="text-sm text-gray-600 mt-2">Upload dulu via Admin Portal.</div>
        </div>
      )}

      {!loading && idasData && (
        <>
          <SPBUDashboard
            idas={idasData}
            manual={manualData}
            trend={trendData}
            mergedRows={merged}
          />

          <div className="mt-6">
            <SPBUTable
              rows={filteredRows}
              cabangList={cabangList}
              filters={filters}
              onFiltersChange={setFilters}
              idasDate={metadata?.idasDate || idasData?.idasDate || ''}
            />
          </div>
        </>
      )}
    </div>
  )
}

