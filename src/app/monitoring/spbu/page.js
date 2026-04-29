'use client'

import { useMemo, useState, useEffect } from 'react'
import { useDataFetch } from '../../hooks/useDataFetch'
import AppHeader from '../../components/AppHeader'
import SPBUDashboard from '../../spbu/components/SPBUDashboard'
import SPBUTable from '../../spbu/components/SPBUTable'

const monitoringSubNav = [
  { href: '/monitoring', label: 'Credit Monitoring', exact: true },
  { href: '/monitoring/spbu', label: 'PRK SPBU' },
  { href: '/monitoring/bpjs', label: 'BPJS' },
]

function normName(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function normKey(s) {
  return String(s || '').trim()
}

export default function MonitoringSPBUPage() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
  }, [])

  const { data: idasData, metadata, loading, error, noData, refresh } = useDataFetch('prk_spbu')
  const { data: masterData, metadata: masterMeta } = useDataFetch('prk_spbu_manual')
  const { data: trendData } = useDataFetch('prk_spbu_trend')

  const [filters, setFilters] = useState({
    cabang: '',
    status: 'all',
    kol: 'all',
    q: '',
  })

  const mergedRows = useMemo(() => {
    const idasRows = Array.isArray(idasData?.rows) ? idasData.rows : []
    const masterRows = Array.isArray(masterData?.rows) ? masterData.rows : []

    const idasByRek = new Map()
    const idasByNama = new Map()
    for (const r of idasRows) {
      const rek = normKey(r?.noRekening)
      if (rek) idasByRek.set(rek, r)
      const nm = normName(r?.nama)
      if (nm && !idasByNama.has(nm)) idasByNama.set(nm, r)
    }

    if (masterRows.length === 0) return []

    return masterRows.map((m) => {
      const byRek = idasByRek.get(normKey(m?.noDebitur))
      const byNama = idasByNama.get(normName(m?.nama))
      const idas = byRek || byNama || null
      return {
        ...m,
        idasFound: !!idas,
        idas: idas,
        noRekening: idas?.noRekening || '',
        tipeProduk: idas?.tipeProduk || '',
        bakiDebet: idas?.bakiDebet ?? null,
        kol: idas?.kol ?? null,
        amtrel: idas?.amtrel ?? null,
      }
    })
  }, [idasData, masterData])

  const filteredRows = useMemo(() => {
    const q = normName(filters.q)
    return mergedRows.filter((r) => {
      if (filters.cabang && (r?.cabang || '') !== filters.cabang) return false
      if (filters.status === 'found' && !r?.idasFound) return false
      if (filters.status === 'delayed' && r?.idasFound) return false
      const kolNum = parseInt(String(r?.kol || '').replace(/[^\d]/g, ''), 10)
      if (filters.kol === 'kol1' && kolNum !== 1) return false
      if (filters.kol === 'kol2plus' && (!kolNum || kolNum < 2)) return false
      if (filters.kol === 'kol5plus' && (!kolNum || kolNum < 5)) return false
      if (q && !normName(r?.nama).includes(q)) return false
      return true
    })
  }, [mergedRows, filters])

  const cabangList = useMemo(() => {
    const set = new Set()
    for (const r of mergedRows) {
      const c = (r?.cabang || '').trim()
      if (c) set.add(c)
    }
    return Array.from(set).sort()
  }, [mergedRows])

  const idasDate = metadata?.idasDate || idasData?.idasDate || '-'

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} memoNavLinks={monitoringSubNav} />
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PRK SPBU Monitoring</h1>
            <p className="text-sm text-gray-500 mt-1">
              IDAS: {idasDate}
              {metadata?.uploadDate ? ` • Upload: ${new Date(metadata.uploadDate).toLocaleString('id-ID')}` : ''}
              {masterMeta?.uploadDate ? ` • Master: ${new Date(masterMeta.uploadDate).toLocaleString('id-ID')}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
          </div>
        )}

        {!loading && (error || noData) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-gray-700 font-medium">Belum ada data PRK SPBU.</div>
            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            <div className="text-sm text-gray-500 mt-2">Upload via <a href="/admin" className="text-blue-700 underline">Admin Portal</a>.</div>
          </div>
        )}

        {!loading && !noData && (
          <>
            {Array.isArray(masterData?.rows) && masterData.rows.length > 0 ? (
              <>
                <SPBUDashboard
                  idas={idasData}
                  master={masterData}
                  trend={trendData}
                  mergedRows={mergedRows}
                />
                <div className="mt-6">
                  <SPBUTable
                    rows={filteredRows}
                    cabangList={cabangList}
                    filters={filters}
                    onFiltersChange={setFilters}
                    idasDate={idasDate}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-gray-800 font-semibold">Master file belum diupload.</div>
                <div className="text-sm text-gray-500 mt-1">
                  Upload <span className="font-mono">ref_PRK_SPBU.xlsx</span> (sheet Monitoring SPBU) via{' '}
                  <a href="/admin" className="text-blue-700 underline">Admin Portal</a>.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
