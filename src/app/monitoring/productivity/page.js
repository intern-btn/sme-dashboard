'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDataFetch } from '../../hooks/useDataFetch'
import AppHeader from '../../components/AppHeader'
import ProductivityDashboard from '../../productivity/components/ProductivityDashboard'
import ProductivityTable from '../../productivity/components/ProductivityTable'

const KANWIL_NORM = {
  'Jakarta 1': 'Jakarta I',
  'Jakarta 2': 'Jakarta II',
  'JBNusa':    'Jabanus',
}
function normalizeKanwil(name) {
  return KANWIL_NORM[name] || name
}

const NON_RM_JABATAN = new Set(['SCPH', 'SBH'])

function buildSubNav(user) {
  const links = [
    { href: '/monitoring', label: 'Credit Monitoring', exact: true },
  ]
  if (!user || user.accessScope === 'national') {
    links.push({ href: '/monitoring/business', label: 'Business Monitoring' })
    links.push({ href: '/monitoring/productivity', label: 'Productivity' })
  }
  return links
}

export default function ProductivityMonitoringPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
  }, [])

  const { data, metadata, loading, error, noData, refresh } = useDataFetch('productivity')

  const rows = useMemo(() =>
    (Array.isArray(data?.rows) ? data.rows : [])
      .filter(r => !NON_RM_JABATAN.has(r.jabatan))
      .map(r => ({ ...r, kantorWilayah: normalizeKanwil(r.kantorWilayah) })),
    [data]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} memoNavLinks={buildSubNav(user)} />

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productivity Monitoring</h1>
            <p className="text-sm text-gray-500 mt-1">
              Produktivitas RM — SME
              {metadata?.uploadedAt
                ? ` • Upload: ${new Date(metadata.uploadedAt).toLocaleString('id-ID')}`
                : ''}
              {metadata?.rowCount != null ? ` • ${metadata.rowCount.toLocaleString('id-ID')} RM` : ''}
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
            <div className="text-gray-700 font-medium">Belum ada data Productivity.</div>
            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            <div className="text-sm text-gray-500 mt-2">
              Upload file PRD via{' '}
              <a href="/admin" className="text-blue-700 underline">Admin Portal</a>.
            </div>
          </div>
        )}

        {!loading && !noData && rows.length > 0 && (
          <>
            <ProductivityDashboard rows={rows} />
            <div className="mt-6">
              <ProductivityTable rows={rows} uploadedAt={metadata?.uploadedAt} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
