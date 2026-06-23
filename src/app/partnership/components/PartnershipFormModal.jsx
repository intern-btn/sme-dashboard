'use client'

import { useState, useEffect } from 'react'
import { TASK_STAGES, PRIORITIES, defaultTasks } from '../../../lib/partnership.js'

const STATUS_OPTIONS = ['', ...TASK_STAGES]

export default function PartnershipFormModal({ mode, partner, onClose, onSaved }) {
  const isEdit = mode === 'edit'

  const [form, setForm] = useState({
    name: partner?.name || '',
    priority: partner?.priority || 'Medium',
    startDate: partner?.startDate ? partner.startDate.slice(0, 10) : '',
    endDate: partner?.endDate ? partner.endDate.slice(0, 10) : '',
    lastUpdateStatus: partner?.lastUpdateStatus || '',
    comment: partner?.comment || '',
  })

  // Initialize tasks: from partner (edit) or default (create)
  const [tasks, setTasks] = useState(() => {
    if (isEdit && Array.isArray(partner?.tasks) && partner.tasks.length > 0) {
      // Normalize tasks to match TASK_STAGES order, fill missing with blank
      const byName = {}
      for (const t of partner.tasks) {
        if (t.name) byName[t.name] = t
      }
      return TASK_STAGES.map(stageName => ({
        name: stageName,
        pic: byName[stageName]?.pic || '',
        // Normalize to 0-100 integer (DB stores 0-1 float)
        progress: Math.round((byName[stageName]?.progress ?? 0) * 100),
        startDate: byName[stageName]?.startDate ? byName[stageName].startDate.slice(0, 10) : '',
        endDate: byName[stageName]?.endDate ? byName[stageName].endDate.slice(0, 10) : '',
      }))
    }
    // Create mode: default tasks seeded from startDate
    const seed = partner?.startDate || new Date().toISOString()
    return defaultTasks(seed).map(t => ({
      ...t,
      startDate: t.startDate ? t.startDate.slice(0, 10) : '',
      endDate: t.endDate ? t.endDate.slice(0, 10) : '',
    }))
  })

  // When startDate changes in create mode, re-seed task dates
  useEffect(() => {
    if (!isEdit && form.startDate) {
      setTasks(prev =>
        prev.map(t => ({
          ...t,
          startDate: t.startDate || form.startDate,
          endDate: t.endDate || form.startDate,
        }))
      )
    }
  }, [form.startDate, isEdit])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function setTaskField(idx, field, value) {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Convert progress from display (0-100 integer) to float (0-1)
    const tasksPayload = tasks.map(t => ({
      name: t.name,
      pic: t.pic,
      progress: Math.min(1, Math.max(0, Number(t.progress) / 100)),
      startDate: t.startDate || null,
      endDate: t.endDate || null,
    }))

    const payload = {
      name: form.name,
      priority: form.priority,
      startDate: form.startDate,
      endDate: form.endDate,
      lastUpdateStatus: form.lastUpdateStatus,
      comment: form.comment,
      tasks: tasksPayload,
    }

    try {
      const url = isEdit ? `/api/partnership/${partner.id}` : '/api/partnership'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan.')
        setSubmitting(false)
        return
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
      setSubmitting(false)
    }
  }

  // Progress state is already 0-100 integer
  function displayProgress(intVal) {
    return intVal ?? 0
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 py-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Partner' : 'Tambah Partner'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-medium leading-none"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Partner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama institusi / perusahaan partner"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Last Update Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Update Status</label>
              <select
                value={form.lastUpdateStatus}
                onChange={e => setForm(f => ({ ...f, lastUpdateStatus: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Pilih Status —</option>
                {TASK_STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Komentar (opsional)</label>
              <textarea
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Catatan atau komentar tambahan..."
              />
            </div>

            {/* Task Timeline table */}
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">Task Timeline</div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Task</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">PIC</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Progress (%)</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Start Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">End Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map((task, idx) => (
                        <tr key={task.name} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs font-medium text-gray-700">{task.name}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={task.pic}
                              onChange={e => setTaskField(idx, 'pic', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                              placeholder="Nama PIC"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={displayProgress(task.progress)}
                              onChange={e => setTaskField(idx, 'progress', Number(e.target.value))}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={task.startDate || ''}
                              onChange={e => setTaskField(idx, 'startDate', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={task.endDate || ''}
                              onChange={e => setTaskField(idx, 'endDate', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#003d7a' }}
            >
              {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
