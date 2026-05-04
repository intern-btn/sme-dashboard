'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDataFetch } from '../../hooks/useDataFetch'
import AppHeader from '../../components/AppHeader'
import SPBUDashboard from '../../spbu/components/SPBUDashboard'
import SPBUTable from '../../spbu/components/SPBUTable'
import BPJSDashboard from '../../bpjs/components/BPJSDashboard'
import BPJSTable from '../../bpjs/components/BPJSTable'
import IndomaretDashboard from '../../indomaret/components/IndomaretDashboard'
import IndomaretTable from '../../indomaret/components/IndomaretTable'
import { normKey, normName, toKolNum } from '../../../lib/business-utils'

const VALID_TABS = ['spbu', 'bpjs', 'indomaret']

const TABS = [
  { key: 'spbu', label: 'PRK SPBU' },
  { key: 'bpjs', label: 'BPJS' },
  { key: 'indomaret', label: 'Indomaret' },
]

const monitoringSubNav = [
  { href: '/monitoring', label: 'Credit Monitoring', exact: true },
  { href: '/monitoring/business', label: 'Business Monitoring' },
]


function buildMergedRows(idasData, masterData) {
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
    const idas = idasByRek.get(normKey(m?.noDebitur)) || idasByNama.get(normName(m?.nama)) || null
    return {
      ...m,
      idasFound: !!idas,
      idas,
      noRekening: idas?.noRekening || '',
      tipeProduk: idas?.tipeProduk || '',
      bakiDebet: idas?.bakiDebet ?? null,
      kol: idas?.kol ?? null,
      amtrel: idas?.amtrel ?? null,
    }
  })
}

function applyFilters(mergedRows, filters) {
  const q = normName(filters.q)
  return mergedRows.filter((r) => {
    if (filters.cabang && (r?.cabang || '') !== filters.cabang) return false
    if (filters.status === 'found' && !r?.idasFound) return false
    if (filters.status === 'delayed' && r?.idasFound) return false
    const kolNum = toKolNum(r?.kol)
    if (filters.kol === 'kol1' && kolNum !== 1) return false
    if (filters.kol === 'kol2plus' && (!kolNum || kolNum < 2)) return false
    if (filters.kol === 'kol5plus' && (!kolNum || kolNum < 5)) return false
    if (q && !normName(r?.nama).includes(q)) return false
    return true
  })
}

function cabangList(mergedRows) {
  return [...new Set(mergedRows.map(r => (r?.cabang || '').trim()).filter(Boolean))].sort()
}

const defaultFilters = { cabang: '', status: 'all', kol: 'all', q: '' }

function MasterNotUploaded({ filename, sheet }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="text-gray-800 font-semibold">Master file belum diupload.</div>
      <div className="text-sm text-gray-500 mt-1">
        Upload <span className="font-mono">{filename}</span> (sheet {sheet}) via{' '}
        <a href="/admin" className="text-blue-700 underline">Admin Portal</a>.
      </div>
    </div>
  )
}

export default function BusinessMonitoringPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('spbu')
  const [spbuFilters, setSpbuFilters] = useState(defaultFilters)
  const [bpjsFilters, setBpjsFilters] = useState(defaultFilters)
  const [indomaretFilters, setIndomaretFilters] = useState(defaultFilters)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
  }, [])

  // Read initial tab from URL on mount
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab && VALID_TABS.includes(tab)) setActiveTab(tab)
  }, [])

  const switchTab = (tab) => {
    setActiveTab(tab)
    router.replace(`/monitoring/business?tab=${tab}`, { scroll: false })
  }

  // All 9 data fetches — unconditional (React rules of hooks)
  const spbu = useDataFetch('prk_spbu')
  const spbuManual = useDataFetch('prk_spbu_manual')
  const spbuTrend = useDataFetch('prk_spbu_trend')
  const bpjs = useDataFetch('bpjs')
  const bpjsManual = useDataFetch('bpjs_manual')
  const bpjsTrend = useDataFetch('bpjs_trend')
  const indomaret = useDataFetch('indomaret')
  const indomaretManual = useDataFetch('indomaret_manual')
  const indomaretTrend = useDataFetch('indomaret_trend')

  // Merged rows per tab
  const spbuMerged = useMemo(() => buildMergedRows(spbu.data, spbuManual.data), [spbu.data, spbuManual.data])
  const bpjsMerged = useMemo(() => buildMergedRows(bpjs.data, bpjsManual.data), [bpjs.data, bpjsManual.data])
  const indomaretMerged = useMemo(() => buildMergedRows(indomaret.data, indomaretManual.data), [indomaret.data, indomaretManual.data])

  // Filtered rows per tab
  const spbuFiltered = useMemo(() => applyFilters(spbuMerged, spbuFilters), [spbuMerged, spbuFilters])
  const bpjsFiltered = useMemo(() => applyFilters(bpjsMerged, bpjsFilters), [bpjsMerged, bpjsFilters])
  const indomaretFiltered = useMemo(() => applyFilters(indomaretMerged, indomaretFilters), [indomaretMerged, indomaretFilters])

  // Cabang lists per tab
  const spbuCabangs = useMemo(() => cabangList(spbuMerged), [spbuMerged])
  const bpjsCabangs = useMemo(() => cabangList(bpjsMerged), [bpjsMerged])
  const indomaretCabangs = useMemo(() => cabangList(indomaretMerged), [indomaretMerged])

  // Active tab derived values — drives header + spinner
  const activeFetch = { spbu, bpjs, indomaret }[activeTab]
  const activeMasterMeta = { spbu: spbuManual.metadata, bpjs: bpjsManual.metadata, indomaret: indomaretManual.metadata }[activeTab]

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} memoNavLinks={monitoringSubNav} />

      {/* Tab bar — mirrors Credit Monitoring's kanwil tab bar */}
      <div className="sticky top-[96px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center gap-1 py-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-[#003d7a] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Monitoring</h1>
            <p className="text-sm text-gray-500 mt-1">
              IDAS: {activeFetch.metadata?.idasDate || activeFetch.data?.idasDate || '-'}
              {activeFetch.metadata?.uploadDate ? ` • Upload: ${new Date(activeFetch.metadata.uploadDate).toLocaleString('id-ID')}` : ''}
              {activeMasterMeta?.uploadDate ? ` • Master: ${new Date(activeMasterMeta.uploadDate).toLocaleString('id-ID')}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={activeFetch.refresh}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
          >
            Refresh
          </button>
        </div>

        {/* Loading — driven by active tab */}
        {activeFetch.loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
          </div>
        )}

        {/* No data — driven by active tab */}
        {!activeFetch.loading && (activeFetch.error || activeFetch.noData) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-gray-700 font-medium">
              Belum ada data {TABS.find(t => t.key === activeTab)?.label}.
            </div>
            {activeFetch.error && <div className="text-sm text-red-600 mt-2">{activeFetch.error}</div>}
            <div className="text-sm text-gray-500 mt-2">
              Upload via <a href="/admin" className="text-blue-700 underline">Admin Portal</a>.
            </div>
          </div>
        )}

        {/* PRK SPBU — rendered once loaded; CSS hidden when inactive */}
        {!spbu.loading && !spbu.noData && (
          <div className={activeTab === 'spbu' ? '' : 'hidden'}>
            {Array.isArray(spbuManual.data?.rows) && spbuManual.data.rows.length > 0 ? (
              <>
                <SPBUDashboard idas={spbu.data} master={spbuManual.data} trend={spbuTrend.data} mergedRows={spbuMerged} />
                <div className="mt-6">
                  <SPBUTable
                    rows={spbuFiltered}
                    cabangList={spbuCabangs}
                    filters={spbuFilters}
                    onFiltersChange={setSpbuFilters}
                    idasDate={spbu.metadata?.idasDate || spbu.data?.idasDate || '-'}
                  />
                </div>
              </>
            ) : (
              <MasterNotUploaded filename="ref_PRK_SPBU.xlsx" sheet="Monitoring SPBU" />
            )}
          </div>
        )}

        {/* BPJS — rendered once loaded; CSS hidden when inactive */}
        {!bpjs.loading && !bpjs.noData && (
          <div className={activeTab === 'bpjs' ? '' : 'hidden'}>
            {Array.isArray(bpjsManual.data?.rows) && bpjsManual.data.rows.length > 0 ? (
              <>
                <BPJSDashboard idas={bpjs.data} master={bpjsManual.data} trend={bpjsTrend.data} mergedRows={bpjsMerged} />
                <div className="mt-6">
                  <BPJSTable
                    rows={bpjsFiltered}
                    cabangList={bpjsCabangs}
                    filters={bpjsFilters}
                    onFiltersChange={setBpjsFilters}
                    idasDate={bpjs.metadata?.idasDate || bpjs.data?.idasDate || '-'}
                  />
                </div>
              </>
            ) : (
              <MasterNotUploaded filename="ref_BPJS.xlsx" sheet="Monitoring BPJS" />
            )}
          </div>
        )}

        {/* Indomaret — rendered once loaded; CSS hidden when inactive */}
        {!indomaret.loading && !indomaret.noData && (
          <div className={activeTab === 'indomaret' ? '' : 'hidden'}>
            {Array.isArray(indomaretManual.data?.rows) && indomaretManual.data.rows.length > 0 ? (
              <>
                <IndomaretDashboard idas={indomaret.data} master={indomaretManual.data} trend={indomaretTrend.data} mergedRows={indomaretMerged} />
                <div className="mt-6">
                  <IndomaretTable
                    rows={indomaretFiltered}
                    cabangList={indomaretCabangs}
                    filters={indomaretFilters}
                    onFiltersChange={setIndomaretFilters}
                    idasDate={indomaret.metadata?.idasDate || indomaret.data?.idasDate || '-'}
                  />
                </div>
              </>
            ) : (
              <MasterNotUploaded filename="ref_Indomaret.xlsx" sheet="Monitoring Indomaret" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
