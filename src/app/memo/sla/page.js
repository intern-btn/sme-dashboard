'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '../layout'
import {
  TRACKING_STEPS, isTracked, isTrackingDone, isOverdue,
  getHoursAtStep, getStepDuration, getTrackingState, getPersonForStep,
  formatHours,
} from '../lib/tracking'
import { AdvanceStepModal } from '../components/TrackingWidgets'

const BRAND = '#003d7a'

const FILTERS = [
  { value: 'all', label: 'Semua yang Dilacak' },
  { value: 'proses', label: 'Sedang Proses' },
  { value: 'overdue', label: 'Melebihi SLA' },
  { value: 'selesai', label: 'Sudah Selesai' },
]

function SLACard({ memo, canManage, onAdvance }) {
  const done = isTrackingDone(memo)
  const overdue = isOverdue(memo)
  const sla = memo.slaHours || 8
  const hrs = done ? sla : getHoursAtStep(memo)
  const pct = done ? 100 : Math.min(100, Math.round(hrs / sla * 100))
  const barCls = done ? 'bg-green-500' : pct < 50 ? 'bg-green-500' : pct < 90 ? 'bg-amber-500' : 'bg-red-500'
  const timeCls = done ? 'text-green-700' : pct < 50 ? 'text-green-700' : pct < 90 ? 'text-amber-600' : 'text-red-600'
  const curStep = TRACKING_STEPS[memo.trackingStep]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/memo/${memo.id}`} className="font-mono text-xs font-semibold text-blue-700 hover:underline">
              {memo.nomorMemo || 'Draft'}
            </Link>
            {done && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Selesai</span>}
            {overdue && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Terlambat</span>}
          </div>
          <Link href={`/memo/${memo.id}`} className="block text-sm font-semibold text-gray-800 leading-snug hover:text-blue-700">
            {memo.perihal || '(belum ada perihal)'}
          </Link>
          {!done && curStep && (
            <p className="text-xs text-gray-500 mt-1">
              Saat ini di: <span className="font-semibold" style={{ color: BRAND }}>{curStep.label}</span>
              {' '}— {curStep.role}
              {getPersonForStep(memo, memo.trackingStep) !== '-' && ` (${getPersonForStep(memo, memo.trackingStep)})`}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className={`text-2xl font-bold font-mono leading-none ${timeCls}`}>
            {done ? '✓' : formatHours(hrs)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">dari {sla} jam SLA</div>
          {!done && canManage && (
            <button onClick={() => onAdvance(memo)}
              className="mt-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: BRAND }}>
              Majukan →
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-4">
        <span>0</span><span>{Math.round(sla / 2)} jam</span><span>{sla} jam (batas)</span>
      </div>

      {/* Step duration cards */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TRACKING_STEPS.map((s, i) => {
          const isAct = i === memo.trackingStep && !done
          const isDn = i < memo.trackingStep || done
          const dur = getStepDuration(memo, i)
          return (
            <div key={s.key}
              className={`flex-1 min-w-[88px] rounded-lg border px-2 py-2.5 text-center shrink-0 ${
                isAct ? 'border-blue-700 bg-white shadow-sm'
                : isDn ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
              }`}>
              <div className={`text-[11px] font-semibold mb-1 ${isAct ? 'text-blue-800' : isDn ? 'text-green-700' : 'text-gray-500'}`}>
                {s.label}
              </div>
              <div className={`text-sm font-bold font-mono leading-none ${isAct ? 'text-gray-900' : isDn ? 'text-green-700' : 'text-gray-400'}`}>
                {formatHours(dur)}
              </div>
              <div className={`text-[10px] font-medium mt-1 ${isAct ? 'text-blue-700' : isDn ? 'text-green-600' : 'text-gray-400'}`}>
                {isAct ? 'Aktif' : isDn ? '✓' : '-'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MonitorSLAPage() {
  const user = useAuth()
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [advMemo, setAdvMemo] = useState(null)

  const canManage = user && ['editor', 'approver', 'admin'].includes(user.role)

  const fetchData = useCallback(() => {
    fetch('/api/memo/tracking')
      .then(r => r.ok ? r.json() : { memos: [] })
      .then(d => setMemos(d.memos || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const list = memos
    .filter(isTracked)
    .filter(m => {
      const state = getTrackingState(m)
      if (filter === 'proses') return state === 'proses' || state === 'overdue'
      if (filter === 'overdue') return state === 'overdue'
      if (filter === 'selesai') return state === 'selesai'
      return true
    })
    .sort((a, b) => {
      const ao = isOverdue(a), bo = isOverdue(b)
      if (ao && !bo) return -1
      if (!ao && bo) return 1
      return getHoursAtStep(b) - getHoursAtStep(a)
    })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitor SLA</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau waktu pemrosesan tiap tahap sirkulasi memo
          </p>
        </div>
        <button onClick={fetchData}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">
          ↻ Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              filter === f.value
                ? 'text-white border-transparent'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            style={filter === f.value ? { backgroundColor: BRAND } : undefined}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
          <p className="font-medium">Tidak ada memo yang sesuai filter</p>
          <p className="text-xs mt-1">Mulai tracking dari halaman detail memo untuk memantau SLA.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(m => (
            <SLACard key={m.id} memo={m} canManage={canManage} onAdvance={setAdvMemo} />
          ))}
        </div>
      )}

      {advMemo && (
        <AdvanceStepModal memo={advMemo} onClose={() => setAdvMemo(null)}
          onDone={() => { setAdvMemo(null); fetchData() }} />
      )}
    </div>
  )
}
