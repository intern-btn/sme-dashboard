'use client'

import { useState } from 'react'
import {
  TRACKING_STEPS, TOTAL_STEPS,
  isTracked, isTrackingDone, isOverdue,
  getHistory, getRoles, getPersonForStep,
  getHoursAtStep, getStepDuration, getTrackingState,
  formatHours, formatDateTime,
} from '../lib/tracking'

const BRAND = '#003d7a'

/* ============ BADGES & MINI WIDGETS ============ */

export function TrackingStateBadge({ memo }) {
  const state = getTrackingState(memo)
  const cfg = {
    untracked: { label: 'Belum dilacak', cls: 'bg-gray-100 text-gray-500' },
    proses:    { label: 'Proses',        cls: 'bg-blue-100 text-blue-800' },
    overdue:   { label: 'Terlambat',     cls: 'bg-red-100 text-red-700' },
    selesai:   { label: 'Selesai',       cls: 'bg-green-100 text-green-800' },
  }[state]
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
}

export function HoursBadge({ memo }) {
  if (!isTracked(memo)) return <span className="text-xs text-gray-400">-</span>
  if (isTrackingDone(memo)) {
    return <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-green-100 text-green-800">✓ Selesai</span>
  }
  const hrs = getHoursAtStep(memo)
  const sla = memo.slaHours || 8
  const cls = hrs > sla ? 'bg-red-100 text-red-700' : hrs > sla / 2 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-800'
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-medium ${cls}`}>{formatHours(hrs)}</span>
}

export function PipelineMini({ memo }) {
  if (!isTracked(memo)) return <span className="text-xs text-gray-400 italic">Belum dilacak</span>
  if (isTrackingDone(memo)) {
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Terarsip</span>
  }
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {TRACKING_STEPS.map((s, i) => {
        const cls = i < memo.trackingStep
          ? 'bg-green-50 text-green-700 border-green-200'
          : i === memo.trackingStep
            ? 'text-white border-transparent font-bold'
            : 'bg-gray-50 text-gray-400 border-gray-200'
        return (
          <span key={s.key} className="flex items-center gap-0.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${cls}`}
              style={i === memo.trackingStep ? { backgroundColor: BRAND } : undefined}
              title={s.role}
            >
              {s.label}
            </span>
            {i < TOTAL_STEPS - 1 && <span className="text-gray-300 text-[9px]">›</span>}
          </span>
        )
      })}
    </div>
  )
}

/* ============ PIPELINE VISUAL (detail) ============ */

export function PipelineVisual({ memo }) {
  const done = isTrackingDone(memo)
  return (
    <div className="flex items-start bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 overflow-x-auto">
      {TRACKING_STEPS.map((s, i) => {
        const stDone = i < memo.trackingStep || done
        const stAct = i === memo.trackingStep && !done
        return (
          <div key={s.key} className="flex items-start flex-1 min-w-0">
            {i > 0 && <div className={`h-0.5 flex-1 min-w-[8px] mt-3.5 ${i <= memo.trackingStep || done ? 'bg-green-500' : 'bg-gray-200'}`} />}
            <div className="flex flex-col items-center gap-1 shrink-0 px-0.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                  stDone ? 'bg-green-100 text-green-700 border-green-500'
                  : stAct ? 'text-white border-transparent'
                  : 'bg-white text-gray-400 border-gray-300'
                }`}
                style={stAct ? { backgroundColor: BRAND } : undefined}
              >
                {stDone ? '✓' : i + 1}
              </div>
              <div className={`text-[9px] leading-tight text-center max-w-[54px] font-medium ${
                stAct ? 'font-bold' : stDone ? 'text-green-700' : 'text-gray-400'
              }`} style={stAct ? { color: BRAND } : undefined}>
                {s.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============ TIMELINE ============ */

export function TrackingTimeline({ memo }) {
  const history = getHistory(memo)
  const done = isTrackingDone(memo)
  return (
    <div className="space-y-0">
      {TRACKING_STEPS.map((s, i) => {
        const entry = history.find(h => h.step === i)
        const stDone = i < memo.trackingStep || done
        const stAct = i === memo.trackingStep && !done
        const dur = getStepDuration(memo, i)
        const durCls = dur === null ? '' : dur <= (memo.slaHours || 8) / 2 ? 'bg-green-100 text-green-800' : dur <= (memo.slaHours || 8) ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        return (
          <div key={s.key} className="flex gap-3 pb-4 relative">
            {i < TOTAL_STEPS - 1 && <div className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-200" />}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shrink-0 z-10 ${
                stDone ? 'bg-green-100 text-green-700 border-green-500'
                : stAct ? 'text-white border-transparent'
                : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
              style={stAct ? { backgroundColor: BRAND } : undefined}
            >
              {stDone ? '✓' : i + 1}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  {s.label}
                  <span className="font-normal text-gray-500"> — {getPersonForStep(memo, i)}</span>
                </span>
                <span className="text-[11px] text-gray-400 font-mono whitespace-nowrap">{entry ? formatDateTime(entry.date) : '-'}</span>
              </div>
              <div className="text-xs text-gray-500">{s.role}</div>
              {dur !== null && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${stAct ? 'bg-blue-50 text-blue-700' : durCls}`}>
                  {formatHours(dur)}{stAct ? ' (berjalan)' : ' di tahap ini'}
                </span>
              )}
              {entry?.note && <div className="text-xs text-gray-400 italic mt-1">&ldquo;{entry.note}&rdquo;</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============ MODALS ============ */

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-xs font-medium text-gray-600 mb-1'

export function StartTrackingModal({ memo, onClose, onDone }) {
  const [roles, setRoles] = useState(() => ({
    pic: getRoles(memo).pic || memo.createdBy || '',
    kadept: '', sekretaris: '', kadiv: '',
  }))
  const [slaHours, setSlaHours] = useState(8)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!roles.pic.trim()) { setError('Nama PIC wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/memo/${memo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_tracking', roles, slaHours }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal memulai tracking'); return }
      onDone(data.memo)
    } catch { setError('Terjadi kesalahan.') }
    finally { setSaving(false) }
  }

  return (
    <ModalShell title="Mulai Tracking Sirkulasi" onClose={onClose}>
      <p className="text-xs text-gray-500 mb-4">
        Lacak perjalanan memo melalui tahap: PIC → Kadept → Sekretaris → Kadiv → PIC → Sekretaris (Arsip).
      </p>
      <div className="space-y-3">
        <div>
          <label className={lbl}>Nama PIC (Pengaju) <span className="text-red-500">*</span></label>
          <input type="text" value={roles.pic} onChange={e => setRoles(r => ({ ...r, pic: e.target.value }))} className={inp} placeholder="Nama lengkap" />
        </div>
        <div>
          <label className={lbl}>Nama Kadept</label>
          <input type="text" value={roles.kadept} onChange={e => setRoles(r => ({ ...r, kadept: e.target.value }))} className={inp} placeholder="Kepala Departemen" />
        </div>
        <div>
          <label className={lbl}>Nama Sekretaris</label>
          <input type="text" value={roles.sekretaris} onChange={e => setRoles(r => ({ ...r, sekretaris: e.target.value }))} className={inp} placeholder="Sekretaris" />
        </div>
        <div>
          <label className={lbl}>Nama Kadiv</label>
          <input type="text" value={roles.kadiv} onChange={e => setRoles(r => ({ ...r, kadiv: e.target.value }))} className={inp} placeholder="Kepala Divisi" />
        </div>
        <div>
          <label className={lbl}>Estimasi SLA (jam per tahap)</label>
          <input type="number" min={1} max={72} value={slaHours} onChange={e => setSlaHours(e.target.value)} className={inp} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-2 mt-5">
        <button onClick={submit} disabled={saving}
          className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: BRAND }}>
          {saving ? 'Menyimpan...' : 'Simpan & Mulai Tracking'}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm">Batal</button>
      </div>
    </ModalShell>
  )
}

export function AdvanceStepModal({ memo, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const curr = TRACKING_STEPS[memo.trackingStep]
  const next = TRACKING_STEPS[memo.trackingStep + 1] || null

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/memo/${memo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance_step', note }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal memajukan tahap'); return }
      onDone(data.memo)
    } catch { setError('Terjadi kesalahan.') }
    finally { setSaving(false) }
  }

  return (
    <ModalShell title="Majukan Tahap" onClose={onClose}>
      <div className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 mb-2">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Posisi saat ini</div>
        <div className="text-sm font-semibold text-gray-800">
          {curr?.label} <span className="font-normal text-gray-500">— {curr?.role}</span>
        </div>
        <div className="text-xs text-gray-500">{getPersonForStep(memo, memo.trackingStep)}</div>
      </div>
      <div className="text-center text-gray-400 text-base my-1">↓</div>
      {next ? (
        <div className="border border-blue-200 bg-blue-50 rounded-xl px-4 py-3 mb-4">
          <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Diteruskan ke</div>
          <div className="text-sm font-semibold text-gray-900">
            {next.label} <span className="font-normal text-gray-600">— {next.role}</span>
          </div>
          <div className="text-xs text-gray-600">{getPersonForStep(memo, memo.trackingStep + 1)}</div>
        </div>
      ) : (
        <div className="border border-green-200 bg-green-50 rounded-xl px-4 py-3 mb-4">
          <div className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-1">Tahap terakhir</div>
          <div className="text-sm font-semibold text-green-800">✓ Sirkulasi memo akan ditandai SELESAI</div>
        </div>
      )}
      <div>
        <label className={lbl}>Catatan perpindahan (opsional)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={`${inp} resize-none`} placeholder="Opsional..." />
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-2 mt-5">
        <button onClick={submit} disabled={saving}
          className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: BRAND }}>
          {saving ? '...' : 'Konfirmasi →'}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm">Batal</button>
      </div>
    </ModalShell>
  )
}

/* ============ TRACKING PANEL (detail page) ============ */

export function TrackingPanel({ memo, canManage, onUpdated }) {
  const [startModal, setStartModal] = useState(false)
  const [advModal, setAdvModal] = useState(false)

  const tracked = isTracked(memo)
  const done = isTrackingDone(memo)
  const overdue = isOverdue(memo)
  const hrs = getHoursAtStep(memo)
  const sla = memo.slaHours || 8

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tracking Sirkulasi</h3>
        {tracked && <TrackingStateBadge memo={memo} />}
      </div>

      {!tracked ? (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400 mb-3">Sirkulasi memo ini belum dilacak.</p>
          {canManage && (
            <button onClick={() => setStartModal(true)}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: BRAND }}>
              Mulai Tracking
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <PipelineVisual memo={memo} />

          {!done && (
            <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${overdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lama di tahap ini</div>
                <div className={`text-xl font-bold font-mono ${overdue ? 'text-red-600' : hrs > sla / 2 ? 'text-amber-600' : 'text-green-700'}`}>
                  {formatHours(hrs)}
                  <span className="text-xs font-normal text-gray-400 ml-1">/ SLA {sla} jam</span>
                </div>
              </div>
              {canManage && (
                <button onClick={() => setAdvModal(true)}
                  className="px-3 py-2 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: BRAND }}>
                  Majukan Tahap →
                </button>
              )}
            </div>
          )}

          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Riwayat Perjalanan</div>
            <TrackingTimeline memo={memo} />
          </div>
        </div>
      )}

      {startModal && (
        <StartTrackingModal memo={memo} onClose={() => setStartModal(false)}
          onDone={(m) => { setStartModal(false); onUpdated(m) }} />
      )}
      {advModal && (
        <AdvanceStepModal memo={memo} onClose={() => setAdvModal(false)}
          onDone={(m) => { setAdvModal(false); onUpdated(m) }} />
      )}
    </div>
  )
}
