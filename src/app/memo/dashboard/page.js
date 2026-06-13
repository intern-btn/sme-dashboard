'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TRACKING_STEPS, getTrackingState, isTracked, isTrackingDone,
} from '../lib/tracking'
import { TrackingStateBadge, PipelineMini } from '../components/TrackingWidgets'

const BRAND = '#003d7a'

function StatCard({ label, value, sub, valueClass = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold leading-none mb-1 ${valueClass}`}>{value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  )
}

export default function MemoDashboardPage() {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/memo/tracking')
      .then(r => r.ok ? r.json() : { memos: [] })
      .then(d => setMemos(d.memos || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    )
  }

  const tracked = memos.filter(isTracked)
  const proses = tracked.filter(m => getTrackingState(m) === 'proses' || getTrackingState(m) === 'overdue')
  const selesai = tracked.filter(isTrackingDone)
  const overdue = tracked.filter(m => getTrackingState(m) === 'overdue')

  // Distribusi memo aktif per tahap
  const stepCounts = TRACKING_STEPS.map((_, i) =>
    tracked.filter(m => !isTrackingDone(m) && m.trackingStep === i).length
  )
  const maxCount = Math.max(...stepCounts, 1)

  const recent = memos.slice(0, 6)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Memo</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan status dan sirkulasi seluruh memo</p>
        </div>
        <Link href="/memo/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: BRAND }}>
          + Buat Memo
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Memo" value={memos.length} sub="Semua memo tercatat" />
        <StatCard label="Sedang Proses" value={proses.length} sub="Dalam alur sirkulasi" valueClass="text-blue-800" />
        <StatCard label="Selesai" value={selesai.length} sub="Telah terarsip" valueClass="text-green-700" />
        <StatCard label="Melebihi SLA" value={overdue.length} sub="Perlu segera diproses"
          valueClass={overdue.length > 0 ? 'text-red-600' : 'text-gray-900'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribusi per tahap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribusi per Tahap (aktif)</h2>
          {tracked.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Belum ada memo yang dilacak.</p>
          ) : (
            <div className="space-y-3">
              {TRACKING_STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <div className="text-xs font-medium text-gray-700">{s.label}</div>
                    <div className="text-[10px] text-gray-400 truncate">{s.role}</div>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.round(stepCounts[i] / maxCount * 100)}%`, backgroundColor: BRAND }} />
                  </div>
                  <div className="w-6 text-right text-xs font-mono text-gray-600 shrink-0">{stepCounts[i]}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Memo terbaru */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Memo Terbaru</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Belum ada memo.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recent.map(m => (
                <Link key={m.id} href={`/memo/${m.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 group">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-blue-700">
                      {m.nomorMemo || <span className="text-gray-400 italic font-sans font-normal">Draft</span>}
                    </div>
                    <div className="text-xs text-gray-600 truncate group-hover:text-blue-700">
                      {m.perihal || '(belum ada perihal)'}
                    </div>
                  </div>
                  <TrackingStateBadge memo={m} />
                </Link>
              ))}
            </div>
          )}
          {memos.length > 6 && (
            <Link href="/memo" className="mt-3 inline-block text-xs text-blue-600 hover:underline">
              Lihat semua →
            </Link>
          )}
        </div>
      </div>

      {/* Sedang dalam sirkulasi */}
      {proses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Sedang dalam Sirkulasi</h2>
            <Link href="/memo/sla" className="text-xs text-blue-600 hover:underline">Monitor SLA →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {proses.slice(0, 5).map(m => (
              <Link key={m.id} href={`/memo/${m.id}`} className="flex items-center justify-between gap-3 py-2.5 group">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-700 truncate group-hover:text-blue-700 font-medium">
                    {m.perihal || m.nomorMemo || '(tanpa judul)'}
                  </div>
                </div>
                <PipelineMini memo={m} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
