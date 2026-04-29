'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import MemoPreview from '../components/MemoPreview'

// Load Tiptap only on client (no SSR)
const MemoEditor = dynamic(() => import('../components/MemoEditor'), { ssr: false })

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'Memo Umum' },
  { value: 'izin_prinsip', label: 'Izin Prinsip' },
]

const JENIS_IP_OPTIONS = [
  { value: 'riwayat_kredit_pengurus', label: 'Riwayat Kredit Pengurus' },
  { value: 'pengikatan_agunan', label: 'Pengikatan Agunan' },
  { value: 'keringanan_provisi', label: 'Keringanan Provisi' },
  { value: 'kpp', label: 'KPP' },
  { value: 'lainnya', label: 'Lainnya' },
]
const TIPE_IP_OPTIONS = [
  { value: 'permohonan', label: 'Permohonan (ke BBD)' },
  { value: 'tanggapan', label: 'Tanggapan (ke KC)' },
]

const RUJUKAN_JENIS_OPTIONS = [
  { value: 'menunjuk', label: 'Menunjuk dan menindaklanjuti' },
  { value: 'berdasarkan', label: 'Berdasarkan' },
  { value: 'merujuk', label: 'Merujuk pada' },
]

const KALIMAT_PENGANTAR_OPTIONS = [
  { value: '', label: '(tidak ada kalimat pengantar)' },
  { value: 'disampaikan', label: 'dengan ini kami sampaikan hal-hal berikut:' },
  { value: 'dimohon', label: 'dengan ini kami mohon:' },
  { value: 'diundang', label: 'kami mengundang dalam rapat sebagai berikut:' },
]

const TODAY = new Date().toISOString().split('T')[0]

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function Stepper({ sections, currentIndex, isComplete, onJump }) {
  const last = sections.length - 1
  return (
    <div className="pt-4 pb-2">
      <div className="flex">
        {sections.map((s, idx) => {
          const complete = isComplete(s.id)
          const isCurrent = idx === currentIndex
          return (
            <div key={s.id} className="flex-1 flex flex-col items-center relative">
              {/* Left half line */}
              {idx > 0 && (
                <div className={`absolute top-3.5 left-0 right-1/2 h-[2px] ${idx <= currentIndex ? 'bg-[#003d7a]' : 'bg-gray-200'}`} />
              )}
              {/* Right half line */}
              {idx < last && (
                <div className={`absolute top-3.5 left-1/2 right-0 h-[2px] ${idx < currentIndex ? 'bg-[#003d7a]' : 'bg-gray-200'}`} />
              )}
              <button
                type="button"
                onClick={() => onJump(idx)}
                className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                  isCurrent || complete
                    ? 'bg-[#003d7a] text-white border-[#003d7a]'
                    : 'bg-white text-gray-500 border-gray-300'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {complete && !isCurrent ? '✓' : idx + 1}
              </button>
              <div className={`mt-1 w-full text-[9px] leading-tight text-center px-0.5 ${
                isCurrent ? 'text-[#003d7a] font-semibold' : 'text-gray-400'
              }`}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KepadaAccordion({ items, expanded, onToggle, onChange }) {
  const update = (i, key, val) => {
    const next = [...items]
    next[i] = { ...next[i], [key]: val }
    onChange(next)
  }

  const add = () => {
    const next = [...items, { division: '', department: '' }]
    onChange(next)
    onToggle(next.length - 1, true)
  }

  const remove = (idxToRemove) => {
    const next = items.filter((_, idx) => idx !== idxToRemove)
    onChange(next)
    onToggle(idxToRemove, 'remove')
  }

  const getHeaderTitle = (item, idx) => {
    const division = (item?.division || '').trim()
    const dept = (item?.department || '').trim()
    if (!division && !dept) return `Penerima ${idx + 1}`
    return [division, dept ? `(${dept})` : ''].filter(Boolean).join(' ')
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">Kepada</label>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = expanded.has(idx)
          return (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  type="button"
                  onClick={() => onToggle(idx)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  <span className="text-gray-500 text-xs">{isOpen ? '▼' : '▶'}</span>
                  <span className="text-sm font-medium text-gray-800 truncate">{getHeaderTitle(item, idx)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-red-500 hover:text-red-700 text-sm px-2"
                  aria-label={`Hapus penerima ${idx + 1}`}
                >
                  ×
                </button>
              </div>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nama Penerima</label>
                    <input
                      type="text"
                      value={item?.division || ''}
                      onChange={(e) => update(idx, 'division', e.target.value)}
                      placeholder="Digital Banking Sales Division"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Info Tambahan (Singkatan, dll.)</label>
                    <input
                      type="text"
                      value={item?.department || ''}
                      onChange={(e) => update(idx, 'department', e.target.value)}
                      placeholder="DBSD"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button type="button" onClick={add} className="mt-3 text-xs text-blue-600 hover:text-blue-800">
        + Tambah Penerima
      </button>
    </div>
  )
}

function RujukanAccordion({ items, expanded, onToggle, onChange }) {
  const update = (i, key, val) => {
    const next = [...items]
    next[i] = { ...next[i], [key]: val }
    onChange(next)
  }

  const add = () => {
    const next = [...items, { nomorMemo: '', tanggal: '', perihal: '' }]
    onChange(next)
    onToggle(next.length - 1, true)
  }

  const remove = (idxToRemove) => {
    const next = items.filter((_, idx) => idx !== idxToRemove)
    onChange(next)
    onToggle(idxToRemove, 'remove')
  }

  const getHeaderTitle = (item, idx) => {
    const nomor = (item?.nomorMemo || '').trim()
    return nomor || `Rujukan ${idx + 1}`
  }

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = expanded.has(idx)
          return (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  type="button"
                  onClick={() => onToggle(idx)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  <span className="text-gray-500 text-xs">{isOpen ? '▼' : '▶'}</span>
                  <span className="text-sm font-medium text-gray-800 truncate">{getHeaderTitle(item, idx)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-red-500 hover:text-red-700 text-sm px-2"
                  aria-label={`Hapus rujukan ${idx + 1}`}
                >
                  ×
                </button>
              </div>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">No. Memo</label>
                    <input
                      type="text"
                      value={item?.nomorMemo || ''}
                      onChange={(e) => update(idx, 'nomorMemo', e.target.value)}
                      placeholder="447/M/CXD/CC/VII/2024"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={item?.tanggal || ''}
                      onChange={(e) => update(idx, 'tanggal', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Perihal</label>
                    <input
                      type="text"
                      value={item?.perihal || ''}
                      onChange={(e) => update(idx, 'perihal', e.target.value)}
                      placeholder="Penyampaian..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button type="button" onClick={add} className="mt-3 text-xs text-blue-600 hover:text-blue-800">
        + Tambah Rujukan
      </button>
    </div>
  )
}

function SimpleRows({ label, items, onChange, placeholder, addLabel }) {
  const update = (i, val) => {
    const next = [...items]
    next[i] = val
    onChange(next)
  }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, ''])

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-500 hover:text-red-700 px-2"
              aria-label={`Hapus ${label} ${i + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 text-xs text-blue-600 hover:text-blue-800">
        {addLabel}
      </button>
    </div>
  )
}

export default function NewMemoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentSection, setCurrentSection] = useState(0)
  const [expandedKepada, setExpandedKepada] = useState(() => new Set([0]))
  const [expandedRujukan, setExpandedRujukan] = useState(() => new Set([0]))

  const [form, setForm] = useState({
    nomorMemo: '',
    category: 'general',
    perihal: '',
    dari: '',
    pengirimDivision: '',
    pengirimSingkatan: '',
    rujukanJenis: 'menunjuk',
    rujukanList: [],
    kalimatPengantar: '',
    picNama: '',
    picTeams: '',
    picWA: '',
    kepada: [],
    tanggalMemo: TODAY,
    konten: '',
    lampiranList: [],
    tembusan: [],
    metadata: {},
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setMeta = (key, val) => setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: val } }))

  const SECTIONS = useMemo(() => {
    if (form.category === 'izin_prinsip') {
      return [
        { id: 'header_memo', label: 'Header Memo' },
        { id: 'data_pemohon', label: 'Data Pemohon' },
        { id: 'fasilitas_kredit', label: 'Fasilitas Kredit' },
        { id: 'detail_ip', label: 'Detail IP' },
        { id: 'isi_memo', label: 'Isi Memo' },
        { id: 'lampiran', label: 'Lampiran & Tembusan' },
      ]
    }

    return [
      { id: 'header_memo', label: 'Header Memo' },
      { id: 'isi_memo', label: 'Isi Memo' },
      { id: 'lampiran', label: 'Lampiran & Tembusan' },
    ]
  }, [form.category])

  const isSectionComplete = useCallback((sectionId) => {
    const meta = typeof form.metadata === 'object' && form.metadata ? form.metadata : {}
    switch (sectionId) {
      case 'header_memo':
        return (
          (form.nomorMemo || '').trim().length > 0 ||
          ((form.tanggalMemo || '').trim().length > 0 && form.tanggalMemo !== TODAY) ||
          (form.pengirimDivision || '').trim().length > 0 ||
          (form.pengirimSingkatan || '').trim().length > 0 ||
          (form.perihal || '').trim().length > 0 ||
          (Array.isArray(form.kepada) && form.kepada.some((k) => {
            if (!k) return false
            if (typeof k === 'string') return k.trim().length > 0
            return ((k.division || '').trim().length > 0) || ((k.department || '').trim().length > 0)
          }))
        )
      case 'data_pemohon':
        return !!(
          (meta.namaDebitur || '').trim() ||
          (meta.jenisKredit || '').trim() ||
          (meta.plafond || '').toString().trim()
        )
      case 'fasilitas_kredit':
        return !!(
          (meta.provisi || '').trim() ||
          (meta.spreadRate || '').trim() ||
          (meta.ltv || '').trim() ||
          (meta.jenisAgunan || '').trim() ||
          (meta.nilaiAgunan || '').toString().trim()
        )
      case 'detail_ip':
        return !!(
          (meta.jenisIzinPrinsip || '').trim() ||
          (meta.nomorMemoKC || '').trim() ||
          (meta.nomorMemoResponse || '').trim() ||
          (meta.keputusan || '').trim()
        )
      case 'isi_memo':
        return (
          (form.metadata?.kontenIsi || '').trim().length > 0 ||
          (form.konten || '').trim().length > 0 ||
          (Array.isArray(form.rujukanList) && form.rujukanList.some(r => (r?.nomorMemo || '').trim())) ||
          (form.picNama || '').trim().length > 0
        )
      case 'lampiran':
        return (
          (Array.isArray(form.lampiranList) && form.lampiranList.some(v => (v || '').trim())) ||
          (Array.isArray(form.tembusan) && form.tembusan.some(v => (v || '').trim()))
        )
      default:
        return false
    }
  }, [form])

  const onJumpSection = (idx) => {
    setCurrentSection(clamp(idx, 0, SECTIONS.length - 1))
  }

  const handleCategoryChange = (nextCategory) => {
    setForm((prev) => ({
      ...prev,
      category: nextCategory,
      metadata: {},
      ...(nextCategory === 'general'
        ? {}
        : {
            rujukanJenis: 'menunjuk',
            rujukanList: [],
            kalimatPengantar: '',
            picNama: '',
            picTeams: '',
            picWA: '',
          }),
    }))
    setCurrentSection(0)
    setExpandedRujukan(new Set([0]))
  }

  const handleToggleKepada = (idx, force) => {
    setExpandedKepada((prev) => {
      const next = new Set(prev)
      if (force === true) {
        next.add(idx)
        return next
      }
      if (force === false) {
        next.delete(idx)
        return next
      }
      if (force === 'remove') {
        const shifted = new Set()
        for (const v of next) {
          if (v === idx) continue
          shifted.add(v > idx ? v - 1 : v)
        }
        return shifted
      }
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleToggleRujukan = (idx, force) => {
    setExpandedRujukan((prev) => {
      const next = new Set(prev)
      if (force === true) {
        next.add(idx)
        return next
      }
      if (force === false) {
        next.delete(idx)
        return next
      }
      if (force === 'remove') {
        const shifted = new Set()
        for (const v of next) {
          if (v === idx) continue
          shifted.add(v > idx ? v - 1 : v)
        }
        return shifted
      }
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleSave = useCallback(async (submitAfter = false) => {
    setSaving(true)
    setError('')
    try {
      const mergedMetadata = {
        ...(typeof form.metadata === 'object' && form.metadata ? form.metadata : {}),
        pengirimDivision: form.pengirimDivision || '',
        pengirimSingkatan: form.pengirimSingkatan || '',
        rujukanJenis: form.rujukanJenis || 'menunjuk',
        rujukanList: Array.isArray(form.rujukanList) ? form.rujukanList : [],
        kalimatPengantar: form.kalimatPengantar || '',
        picNama: form.picNama || '',
        picTeams: form.picTeams || '',
        picWA: form.picWA || '',
      }

      const payload = {
        ...form,
        metadata: mergedMetadata,
      }

      const res = await fetch('/api/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return }

      if (submitAfter) {
        await fetch(`/api/memo/${data.memo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit' }),
        })
      }
      router.push(`/memo/${data.memo.id}`)
    } catch {
      setError('Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }, [form, router])

  const safeIndex = clamp(currentSection, 0, Math.max(0, SECTIONS.length - 1))
  const activeSection = SECTIONS[safeIndex]?.id

  return (
    <div className="flex overflow-hidden h-[calc(100vh-160px)] rounded-xl border border-gray-200 bg-white">
      {/* LEFT: Form panel */}
      <div className="w-[420px] shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        {/* Top header + stepper */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-base">Buat Memo Baru</h2>
            <Link href="/memo" className="text-xs text-gray-400 hover:text-gray-600">← Kembali</Link>
          </div>
          <Stepper
            sections={SECTIONS}
            currentIndex={safeIndex}
            isComplete={isSectionComplete}
            onJump={onJumpSection}
          />
        </div>

        {/* Section content (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {safeIndex + 1} / {SECTIONS.length}
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate">{SECTIONS[safeIndex]?.label}</h3>
              </div>
              {activeSection === 'isi_memo' && (
                <span className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  TIPS: Gunakan toolbar untuk tabel, daftar, dan format teks
                </span>
              )}
            </div>

            {/* Sections are rendered below by activeSection */}

            {activeSection === 'header_memo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                  <div className="flex gap-2">
                    {CATEGORY_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleCategoryChange(value)}
                        className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          form.category === value
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">No. Memo</label>
                  <input
                    type="text"
                    value={form.nomorMemo}
                    onChange={(e) => set('nomorMemo', e.target.value)}
                    placeholder="0042/M/BBD/CPD/III/2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Memo</label>
                  <input
                    type="date"
                    value={form.tanggalMemo}
                    onChange={(e) => set('tanggalMemo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dari</label>
                    <input
                      type="text"
                      value={form.pengirimDivision || ''}
                      onChange={(e) => {
                        const nextDivision = e.target.value
                        set('pengirimDivision', nextDivision)
                        set('dari', nextDivision)
                      }}
                      placeholder="Business Banking Division"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Info Tambahan (Singkatan, dll.)</label>
                    <input
                      type="text"
                      value={form.pengirimSingkatan || ''}
                      onChange={(e) => set('pengirimSingkatan', e.target.value)}
                      placeholder="BBD"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <KepadaAccordion
                  items={Array.isArray(form.kepada) ? form.kepada : []}
                  expanded={expandedKepada}
                  onToggle={handleToggleKepada}
                  onChange={(v) => set('kepada', v)}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Perihal</label>
                  <textarea
                    value={form.perihal}
                    onChange={(e) => set('perihal', e.target.value)}
                    rows={3}
                    placeholder="Contoh: Permohonan Sharing Anggaran Kegiatan..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'data_pemohon' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Pemohon</label>
                  <input
                    type="text"
                    value={form.metadata.namaDebitur || ''}
                    onChange={(e) => setMeta('namaDebitur', e.target.value)}
                    placeholder="PT Inti Sinar Pelangi"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Kredit</label>
                  <input
                    type="text"
                    value={form.metadata.jenisKredit || ''}
                    onChange={(e) => setMeta('jenisKredit', e.target.value)}
                    placeholder="Kredit Swadana Lembaga"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Plafond</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={form.metadata.plafond || ''}
                        onChange={(e) => setMeta('plafond', e.target.value)}
                        placeholder="3000"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">juta Rp</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jangka Waktu</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={form.metadata.jangkaWaktu || ''}
                        onChange={(e) => setMeta('jangkaWaktu', e.target.value)}
                        placeholder="6"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">bulan</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Peruntukan <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <textarea
                    value={form.metadata.peruntukan || ''}
                    onChange={(e) => setMeta('peruntukan', e.target.value)}
                    rows={2}
                    placeholder="Contoh: Pembangunan proyek Perumahan Sifa Residen yang berlokasi di Pamekasan, Jawa Timur"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'fasilitas_kredit' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Provisi</label>
                    <input
                      type="text"
                      value={form.metadata.provisi || ''}
                      onChange={(e) => setMeta('provisi', e.target.value)}
                      placeholder="0,125% dari plafond kredit"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Spread Rate</label>
                    <input
                      type="text"
                      value={form.metadata.spreadRate || ''}
                      onChange={(e) => setMeta('spreadRate', e.target.value)}
                      placeholder="1% diatas suku bunga agunan"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">LTV (Loan to Value)</label>
                  <input
                    type="text"
                    value={form.metadata.ltv || ''}
                    onChange={(e) => setMeta('ltv', e.target.value)}
                    placeholder="75%"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Simpanan Agunan</label>
                  <input
                    type="text"
                    value={form.metadata.jenisAgunan || ''}
                    onChange={(e) => setMeta('jenisAgunan', e.target.value)}
                    placeholder="Tabungan Investa an Ario Sunartedjo Prabowo (direktur)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nilai Agunan</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.metadata.nilaiAgunan || ''}
                      onChange={(e) => setMeta('nilaiAgunan', e.target.value)}
                      placeholder="4000"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">juta Rp</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rating Debitur <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.metadata.ratingDebitur || ''}
                    onChange={(e) => setMeta('ratingDebitur', e.target.value)}
                    placeholder="Platinum"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeSection === 'detail_ip' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Memo</label>
                  <div className="flex gap-2">
                    {TIPE_IP_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMeta('tipeIP', value)}
                        className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          form.metadata.tipeIP === value
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Izin Prinsip</label>
                  <select
                    value={form.metadata.jenisIzinPrinsip || ''}
                    onChange={(e) => setMeta('jenisIzinPrinsip', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih...</option>
                    {JENIS_IP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">No. Memo KC</label>
                  <input
                    type="text"
                    value={form.metadata.nomorMemoKC || ''}
                    onChange={(e) => setMeta('nomorMemoKC', e.target.value)}
                    placeholder="123/KC.XXX/I/2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">No. Memo Respons BBD</label>
                  <input
                    type="text"
                    value={form.metadata.nomorMemoResponse || ''}
                    onChange={(e) => setMeta('nomorMemoResponse', e.target.value)}
                    placeholder="0667/M/BBD/NCP/II/2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Keputusan</label>
                  <select
                    value={form.metadata.keputusan || ''}
                    onChange={(e) => setMeta('keputusan', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Belum ada keputusan</option>
                    <option value="disetujui">Disetujui</option>
                    <option value="ditolak">Ditolak</option>
                    <option value="catatan">Dengan Catatan</option>
                  </select>
                </div>
              </div>
            )}

            {activeSection === 'isi_memo' && (
              form.category === 'izin_prinsip' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Konten</label>
                    <MemoEditor value={form.konten} onChange={(v) => set('konten', v)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* RUJUKAN */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Rujukan</div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Pembuka</label>
                        <select
                          value={form.rujukanJenis}
                          onChange={(e) => set('rujukanJenis', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {RUJUKAN_JENIS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <RujukanAccordion
                        items={Array.isArray(form.rujukanList) ? form.rujukanList : []}
                        expanded={expandedRujukan}
                        onToggle={handleToggleRujukan}
                        onChange={(v) => set('rujukanList', v)}
                      />

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Kalimat Pengantar</label>
                        <select
                          value={form.kalimatPengantar}
                          onChange={(e) => set('kalimatPengantar', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {KALIMAT_PENGANTAR_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ISI POKOK */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Isi Pokok</div>
                      <span className="text-xs text-red-500">*</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Sampaikan poin-poin utama memo. Gunakan numbered list untuk beberapa poin.</p>
                    <MemoEditor value={form.metadata?.kontenIsi || ''} onChange={(v) => setMeta('kontenIsi', v)} />
                  </div>

                  {/* TINDAK LANJUT */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tindak Lanjut / Harapan</div>
                      <span className="text-xs text-gray-400">(Opsional)</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Arahan atau harapan kepada penerima memo.</p>
                    <MemoEditor value={form.metadata?.kontenTindakLanjut || ''} onChange={(v) => setMeta('kontenTindakLanjut', v)} />
                  </div>

                  {/* PENUTUP */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Penutup</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nama PIC</label>
                        <input
                          type="text"
                          value={form.picNama}
                          onChange={(e) => set('picNama', e.target.value)}
                          placeholder="Haryo Tetuko"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Teams ID</label>
                        <input
                          type="text"
                          value={form.picTeams}
                          onChange={(e) => set('picTeams', e.target.value)}
                          placeholder="Haryo22286.Tetuko"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">No. WA</label>
                        <input
                          type="text"
                          value={form.picWA}
                          onChange={(e) => set('picWA', e.target.value)}
                          placeholder="087786774186"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      <div className="font-semibold text-gray-600 mb-1">Preview (auto):</div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
                        {(() => {
                          const lines = []
                          const picNama = (form.picNama || '').trim()
                          const picTeams = (form.picTeams || '').trim()
                          const picWA = (form.picWA || '').trim()
                          const picDiv = (form.pengirimSingkatan || form.pengirimDivision || '').trim()
                          const picLabel = picDiv ? `PIC ${picDiv}` : 'PIC'

                          if (picNama) {
                            const contacts = []
                            if (picTeams) contacts.push(`Teams: ${picTeams}`)
                            if (picWA) contacts.push(`Whatsapp: ${picWA}`)
                            const contactSuffix = contacts.length ? ` (${contacts.join(' / ')})` : ''
                            lines.push(`Apabila terdapat hal-hal yang perlu dikonfirmasi, dapat menghubungi ${picLabel} an ${picNama}${contactSuffix}.`)
                          }

                          lines.push('Demikian kami sampaikan, atas perhatian dan kerja samanya, kami ucapkan terima kasih.')
                          return lines.join('\n')
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {activeSection === 'lampiran' && (
              <div className="space-y-6 pb-2">
                <SimpleRows
                  label="Lampiran"
                  items={Array.isArray(form.lampiranList) ? form.lampiranList : []}
                  onChange={(v) => set('lampiranList', v)}
                  placeholder="Contoh: Key Visual / Konten"
                  addLabel="+ Tambah Lampiran"
                />
                <SimpleRows
                  label="Tembusan"
                  items={Array.isArray(form.tembusan) ? form.tembusan : []}
                  onChange={(v) => set('tembusan', v)}
                  placeholder="Contoh: Divisi XYZ"
                  addLabel="+ Tambah Tembusan"
                />
              </div>
            )}

            {error && (
              <p className="mt-5 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="border-t border-gray-100 px-5 py-3 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {safeIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentSection((i) => clamp(i - 1, 0, SECTIONS.length - 1))}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  ← Sebelumnya
                </button>
              )}
            </div>

            {safeIndex < SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSection((i) => clamp(i + 1, 0, SECTIONS.length - 1))}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: '#003d7a' }}
              >
                Lanjut →
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: '#003d7a' }}
                >
                  {saving ? '...' : 'Submit untuk Review'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Live preview panel */}
      <div className="flex-1 overflow-y-auto bg-gray-100 flex flex-col">
        {/* Preview toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview Memo</span>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export PDF
          </button>
        </div>

        {/* A4-like preview */}
        <div className="flex-1 px-4 py-4 flex justify-center">
          <div className="w-full max-w-[860px] shadow-lg rounded-sm">
            <MemoPreview form={form} />
          </div>
        </div>
      </div>
    </div>
  )
}
