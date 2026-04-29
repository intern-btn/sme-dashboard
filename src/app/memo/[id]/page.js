'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import MemoPreview from '../components/MemoPreview'
import { useAuth } from '../layout'

const MemoEditor = dynamic(() => import('../components/MemoEditor'), { ssr: false })

const STATUS_CONFIG = {
  draft:       { label: 'Draft',        color: 'bg-gray-100 text-gray-600',    step: 1 },
  review:      { label: 'Review',       color: 'bg-yellow-100 text-yellow-800', step: 2 },
  approved:    { label: 'Disetujui',    color: 'bg-green-100 text-green-800',  step: 3 },
  distributed: { label: 'Didistribusi', color: 'bg-blue-100 text-blue-800',   step: 4 },
}

const ROLE_HIERARCHY = ['viewer', 'editor', 'approver', 'admin']
const hasRole = (role, min) => ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(min)

const KANWIL_LIST = ['Jakarta I','Jakarta II','Jateng DIY','Jabanus','Jawa Barat','Kalimantan','Sulampua','Sumatera 1','Sumatera 2']

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <dt className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value || '-'}</dd>
    </div>
  )
}

export default function MemoDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const user = useAuth()

  const [memo, setMemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Distribute modal
  const [distributeModal, setDistributeModal] = useState(false)
  const [selectedKanwil, setSelectedKanwil] = useState([])

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')

  // Attachment upload
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const fetchMemo = useCallback(async () => {
    try {
      const res = await fetch(`/api/memo/${id}`)
      if (!res.ok) { setError('Memo tidak ditemukan'); return }
      const data = await res.json()
      setMemo(data.memo)
      setEditForm(parseMemo(data.memo))
    } catch { setError('Gagal memuat memo') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchMemo() }, [fetchMemo])

  const parseMemo = (m) => ({
    nomorMemo: m.nomorMemo || '',
    category: m.category || 'general',
    perihal: m.perihal || '',
    dari: m.dari || '',
    kepada: JSON.parse(m.kepada || '[]'),
    tanggalMemo: m.tanggalMemo ? new Date(m.tanggalMemo).toISOString().split('T')[0] : '',
    konten: m.konten || '',
    lampiranList: JSON.parse(m.lampiranList || '[]'),
    tembusan: JSON.parse(m.tembusan || '[]'),
    metadata: JSON.parse(m.metadata || '{}'),
  })

  const setEditMeta = (key, val) => setEditForm(f => ({ ...f, metadata: { ...f.metadata, [key]: val } }))

  const doAction = async (action, payload = {}) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/memo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Gagal'); return }
      setMemo(data.memo)
      setEditForm(parseMemo(data.memo))
    } finally { setActionLoading(false) }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/memo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Gagal menyimpan'); return }
      setMemo(data.memo)
      setEditForm(parseMemo(data.memo))
      setEditMode(false)
    } finally { setSaving(false) }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      const res = await fetch(`/api/memo/${id}/attachments`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Upload gagal'); return }
      setMemo(m => ({ ...m, attachments: JSON.stringify(data.attachments) }))
      setUploadFile(null)
      e.target.reset()
    } finally { setUploading(false) }
  }

  const handleDeleteAttachment = async (key) => {
    if (!confirm('Hapus lampiran ini?')) return
    const res = await fetch(`/api/memo/${id}/attachments?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
    if (res.ok) {
      const attachments = JSON.parse(memo.attachments || '[]').filter(k => k !== key)
      setMemo(m => ({ ...m, attachments: JSON.stringify(attachments) }))
    }
  }

  const handleDistribute = async () => {
    await doAction('distribute', { distributedTo: selectedKanwil })
    setDistributeModal(false)
  }

  const handleReject = async () => {
    await doAction('reject', { notes: rejectNotes })
    setRejectModal(false)
    setRejectNotes('')
  }

  const handleDelete = async () => {
    if (!confirm('Hapus memo ini secara permanen?')) return
    const res = await fetch(`/api/memo/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/memo')
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" /></div>
  if (error || !memo) return <div className="text-center py-20 text-gray-500"><p>{error || 'Tidak ditemukan'}</p><Link href="/memo" className="mt-4 inline-block text-blue-600 hover:underline">← Kembali</Link></div>

  const attachments = JSON.parse(memo.attachments || '[]')
  const statusStep = STATUS_CONFIG[memo.status]?.step || 1
  const canEdit = user && memo.status === 'draft' && (memo.createdBy === user.name || hasRole(user.role, 'admin'))
  const canSubmit = user && memo.status === 'draft' && hasRole(user.role, 'editor')
  const canApprove = user && memo.status === 'review' && hasRole(user.role, 'approver')
  const canDistribute = user && memo.status === 'approved' && hasRole(user.role, 'approver')
  const canDelete = user && hasRole(user.role, 'admin')
  const isIP = memo.category === 'izin_prinsip'
  const meta = JSON.parse(memo.metadata || '{}')

  const previewForm = editMode ? editForm : {
    ...parseMemo(memo),
    kepada: JSON.parse(memo.kepada || '[]'),
    lampiranList: JSON.parse(memo.lampiranList || '[]'),
    tembusan: JSON.parse(memo.tembusan || '[]'),
    metadata: JSON.parse(memo.metadata || '{}'),
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-64px)] -mx-4 -mt-6 overflow-hidden">
      {/* LEFT: Info + Actions */}
      <div className="w-[400px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
        <div className="p-5 space-y-5">
          {/* Back + header */}
          <div>
            <Link href="/memo" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Kembali
            </Link>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-500">{memo.nomorMemo || 'Draft'}</span>
                  <StatusBadge status={memo.status} />
                </div>
                <p className="text-sm font-semibold text-gray-800 leading-snug">{memo.perihal || '(belum ada perihal)'}</p>
              </div>
              {canDelete && (
                <button onClick={handleDelete} className="shrink-0 text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg">Hapus</button>
              )}
            </div>
          </div>

          {/* Status timeline */}
          <div className="flex items-center justify-between">
            {[{step:1,label:'Draft'},{step:2,label:'Review'},{step:3,label:'Disetujui'},{step:4,label:'Distribusi'}].map((s, i, arr) => (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    statusStep >= s.step ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {statusStep > s.step ? '✓' : s.step}
                  </div>
                  <span className={`text-xs mt-0.5 ${statusStep >= s.step ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${statusStep > s.step ? 'bg-blue-700' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Info */}
          {!editMode && (
            <dl className="space-y-2.5">
              <InfoRow label="Dari" value={memo.dari} />
              <InfoRow label="Tanggal" value={memo.tanggalMemo ? new Date(memo.tanggalMemo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
              <InfoRow label="Dibuat oleh" value={memo.createdBy} />
              {memo.reviewedBy && <InfoRow label="Ditinjau oleh" value={memo.reviewedBy} />}
              {memo.approvedBy && <InfoRow label="Disetujui oleh" value={memo.approvedBy} />}
              {memo.distributedBy && <InfoRow label="Didistribusi oleh" value={memo.distributedBy} />}
              {memo.notes && <InfoRow label="Catatan" value={memo.notes} />}
              {isIP && meta.namaDebitur && (
                <>
                  <div className="border-t border-gray-100 pt-2.5">
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Izin Prinsip</p>
                  </div>
                  <InfoRow label="Nama Debitur" value={meta.namaDebitur} />
                  {meta.jenisKredit && <InfoRow label="Jenis Kredit" value={meta.jenisKredit} />}
                  {meta.plafond && <InfoRow label="Plafond" value={`Rp ${Number(meta.plafond).toLocaleString('id-ID')} juta`} />}
                  {meta.keputusan && <InfoRow label="Keputusan" value={<span className="capitalize font-semibold">{meta.keputusan}</span>} />}
                </>
              )}
            </dl>
          )}

          {/* Edit form (when in edit mode) */}
          {editMode && editForm && (() => {
            const meta = editForm.metadata || {}
            const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            const lbl = 'block text-xs font-medium text-gray-600 mb-1'
            const sec = 'text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mt-1'
            const isIP = editForm.category === 'izin_prinsip'

            const updateKepada = (i, key, val) => {
              const next = [...editForm.kepada]
              next[i] = { ...next[i], [key]: val }
              setEditForm(f => ({ ...f, kepada: next }))
            }
            const addKepada = () => setEditForm(f => ({ ...f, kepada: [...f.kepada, { division: '', department: '' }] }))
            const removeKepada = (i) => setEditForm(f => ({ ...f, kepada: f.kepada.filter((_, idx) => idx !== i) }))

            const updateRujukan = (i, key, val) => {
              const list = Array.isArray(meta.rujukanList) ? [...meta.rujukanList] : []
              list[i] = { ...list[i], [key]: val }
              setEditMeta('rujukanList', list)
            }
            const addRujukan = () => setEditMeta('rujukanList', [...(Array.isArray(meta.rujukanList) ? meta.rujukanList : []), { nomorMemo: '', tanggal: '', perihal: '' }])
            const removeRujukan = (i) => setEditMeta('rujukanList', (meta.rujukanList || []).filter((_, idx) => idx !== i))

            const updateSimple = (arr, setter, i, val) => { const next = [...arr]; next[i] = val; setter(next) }
            const addSimple = (arr, setter) => setter([...arr, ''])
            const removeSimple = (arr, setter, i) => setter(arr.filter((_, idx) => idx !== i))

            const lampiranArr = Array.isArray(editForm.lampiranList) ? editForm.lampiranList : []
            const tembusanArr = Array.isArray(editForm.tembusan) ? editForm.tembusan : []
            const setLampiran = (v) => setEditForm(f => ({ ...f, lampiranList: v }))
            const setTembusan = (v) => setEditForm(f => ({ ...f, tembusan: v }))

            const RUJUKAN_JENIS = [
              { value: 'menunjuk', label: 'Menunjuk dan menindaklanjuti' },
              { value: 'berdasarkan', label: 'Berdasarkan' },
              { value: 'merujuk', label: 'Merujuk pada' },
            ]
            const KALIMAT_OPTIONS = [
              { value: '', label: '(tidak ada)' },
              { value: 'disampaikan', label: 'dengan ini kami sampaikan hal-hal berikut:' },
              { value: 'dimohon', label: 'dengan ini kami mohon:' },
              { value: 'diundang', label: 'kami mengundang dalam rapat sebagai berikut:' },
            ]

            return (
              <div className="space-y-3">
                <div className={sec}>Header</div>

                <div>
                  <label className={lbl}>No. Memo</label>
                  <input type="text" value={editForm.nomorMemo} onChange={e => setEditForm(f => ({ ...f, nomorMemo: e.target.value }))} className={inp} />
                </div>

                <div>
                  <label className={lbl}>Tanggal</label>
                  <input type="date" value={editForm.tanggalMemo} onChange={e => setEditForm(f => ({ ...f, tanggalMemo: e.target.value }))} className={inp} />
                </div>

                <div>
                  <label className={lbl}>Kepada</label>
                  <div className="space-y-1.5">
                    {editForm.kepada.map((k, i) => (
                      <div key={i} className="flex gap-1">
                        <input type="text" value={k.division || ''} onChange={e => updateKepada(i, 'division', e.target.value)}
                          placeholder="Nama Divisi" className={`${inp} flex-1`} />
                        <input type="text" value={k.department || ''} onChange={e => updateKepada(i, 'department', e.target.value)}
                          placeholder="Singkatan" className={`${inp} w-20`} />
                        <button type="button" onClick={() => removeKepada(i)} className="text-red-400 hover:text-red-600 px-1 text-sm">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addKepada} className="mt-1.5 text-xs text-blue-600 hover:text-blue-800">+ Tambah Penerima</button>
                </div>

                <div>
                  <label className={lbl}>Dari</label>
                  <input type="text" value={editForm.dari} onChange={e => setEditForm(f => ({ ...f, dari: e.target.value }))} className={inp} />
                </div>

                {!isIP && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={lbl}>Divisi Pengirim</label>
                      <input type="text" value={meta.pengirimDivision || ''} onChange={e => setEditMeta('pengirimDivision', e.target.value)} className={inp} placeholder="SME Banking Division" />
                    </div>
                    <div>
                      <label className={lbl}>Singkatan</label>
                      <input type="text" value={meta.pengirimSingkatan || ''} onChange={e => setEditMeta('pengirimSingkatan', e.target.value)} className={inp} placeholder="SMBD" />
                    </div>
                  </div>
                )}

                <div>
                  <label className={lbl}>Perihal</label>
                  <textarea value={editForm.perihal} onChange={e => setEditForm(f => ({ ...f, perihal: e.target.value }))} rows={2}
                    className={`${inp} resize-none`} />
                </div>

                {isIP && (
                  <>
                    <div className={sec}>Data Kredit</div>
                    <div>
                      <label className={lbl}>Nama Debitur / Pemohon</label>
                      <input type="text" value={meta.namaDebitur || ''} onChange={e => setEditMeta('namaDebitur', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Jenis Kredit</label>
                      <input type="text" value={meta.jenisKredit || ''} onChange={e => setEditMeta('jenisKredit', e.target.value)} className={inp} placeholder="KPP Supply – Usaha Pengembang" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={lbl}>Plafond (juta Rp)</label>
                        <input type="number" value={meta.plafond || ''} onChange={e => setEditMeta('plafond', e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Jangka Waktu (bln)</label>
                        <input type="number" value={meta.jangkaWaktu || ''} onChange={e => setEditMeta('jangkaWaktu', e.target.value)} className={inp} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={lbl}>Provisi</label>
                        <input type="text" value={meta.provisi || ''} onChange={e => setEditMeta('provisi', e.target.value)} className={inp} placeholder="0.10%" />
                      </div>
                      <div>
                        <label className={lbl}>Spread Rate</label>
                        <input type="text" value={meta.spreadRate || ''} onChange={e => setEditMeta('spreadRate', e.target.value)} className={inp} placeholder="1%" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={lbl}>LTV</label>
                        <input type="text" value={meta.ltv || ''} onChange={e => setEditMeta('ltv', e.target.value)} className={inp} placeholder="90%" />
                      </div>
                      <div>
                        <label className={lbl}>Nilai Agunan (juta Rp)</label>
                        <input type="number" value={meta.nilaiAgunan || ''} onChange={e => setEditMeta('nilaiAgunan', e.target.value)} className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Jenis Simpanan Agunan</label>
                      <input type="text" value={meta.jenisAgunan || ''} onChange={e => setEditMeta('jenisAgunan', e.target.value)} className={inp} placeholder="Giro Escrow atas nama ..." />
                    </div>
                    <div>
                      <label className={lbl}>Peruntukan</label>
                      <input type="text" value={meta.peruntukan || ''} onChange={e => setEditMeta('peruntukan', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Keputusan</label>
                      <input type="text" value={meta.keputusan || ''} onChange={e => setEditMeta('keputusan', e.target.value)} className={inp} placeholder="dapat diproses lebih lanjut" />
                    </div>
                  </>
                )}

                {!isIP && (
                  <>
                    <div className={sec}>Pembuka & Rujukan</div>
                    <div>
                      <label className={lbl}>Jenis Pembuka</label>
                      <select value={meta.rujukanJenis || 'menunjuk'} onChange={e => setEditMeta('rujukanJenis', e.target.value)} className={inp}>
                        {RUJUKAN_JENIS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Rujukan Memo</label>
                      <div className="space-y-2">
                        {(meta.rujukanList || []).map((r, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-2 space-y-1.5 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Rujukan {i + 1}</span>
                              <button type="button" onClick={() => removeRujukan(i)} className="text-red-400 hover:text-red-600 text-xs">Hapus</button>
                            </div>
                            <input type="text" value={r.nomorMemo || ''} onChange={e => updateRujukan(i, 'nomorMemo', e.target.value)}
                              placeholder="No. Memo" className={inp} />
                            <input type="date" value={r.tanggal || ''} onChange={e => updateRujukan(i, 'tanggal', e.target.value)} className={inp} />
                            <input type="text" value={r.perihal || ''} onChange={e => updateRujukan(i, 'perihal', e.target.value)}
                              placeholder="Perihal" className={inp} />
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addRujukan} className="mt-1.5 text-xs text-blue-600 hover:text-blue-800">+ Tambah Rujukan</button>
                    </div>
                    <div>
                      <label className={lbl}>Kalimat Pengantar</label>
                      <select value={meta.kalimatPengantar || ''} onChange={e => setEditMeta('kalimatPengantar', e.target.value)} className={inp}>
                        {KALIMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className={sec}>Isi Memo</div>
                {isIP ? (
                  <div>
                    <MemoEditor value={editForm.konten} onChange={v => setEditForm(f => ({ ...f, konten: v }))} />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className={lbl}>Isi Pokok</label>
                        <span className="text-xs text-red-500">*</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">Sampaikan poin-poin utama memo. Gunakan numbered list untuk beberapa poin.</p>
                      <MemoEditor value={editForm.metadata?.kontenIsi || ''} onChange={v => setEditMeta('kontenIsi', v)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className={lbl}>Tindak Lanjut / Harapan</label>
                        <span className="text-xs text-gray-400">(Opsional)</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">Arahan atau harapan kepada penerima memo.</p>
                      <MemoEditor value={editForm.metadata?.kontenTindakLanjut || ''} onChange={v => setEditMeta('kontenTindakLanjut', v)} />
                    </div>
                  </>
                )}

                {!isIP && (
                  <>
                    <div className={sec}>PIC & Penutup</div>
                    <div>
                      <label className={lbl}>Nama PIC</label>
                      <input type="text" value={meta.picNama || ''} onChange={e => setEditMeta('picNama', e.target.value)} className={inp} placeholder="Nama PIC" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={lbl}>Teams</label>
                        <input type="text" value={meta.picTeams || ''} onChange={e => setEditMeta('picTeams', e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>WhatsApp</label>
                        <input type="text" value={meta.picWA || ''} onChange={e => setEditMeta('picWA', e.target.value)} className={inp} />
                      </div>
                    </div>
                  </>
                )}

                <div className={sec}>Lampiran & Tembusan</div>
                <div>
                  <label className={lbl}>Lampiran</label>
                  <div className="space-y-1.5">
                    {lampiranArr.map((item, i) => (
                      <div key={i} className="flex gap-1">
                        <input type="text" value={item} onChange={e => updateSimple(lampiranArr, setLampiran, i, e.target.value)}
                          placeholder={`Lampiran ${i + 1}`} className={`${inp} flex-1`} />
                        <button type="button" onClick={() => removeSimple(lampiranArr, setLampiran, i)} className="text-red-400 hover:text-red-600 px-1 text-sm">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSimple(lampiranArr, setLampiran)} className="mt-1.5 text-xs text-blue-600 hover:text-blue-800">+ Tambah Lampiran</button>
                </div>
                <div>
                  <label className={lbl}>Tembusan</label>
                  <div className="space-y-1.5">
                    {tembusanArr.map((item, i) => (
                      <div key={i} className="flex gap-1">
                        <input type="text" value={item} onChange={e => updateSimple(tembusanArr, setTembusan, i, e.target.value)}
                          placeholder={`Tembusan ${i + 1}`} className={`${inp} flex-1`} />
                        <button type="button" onClick={() => removeSimple(tembusanArr, setTembusan, i)} className="text-red-400 hover:text-red-600 px-1 text-sm">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSimple(tembusanArr, setTembusan)} className="mt-1.5 text-xs text-blue-600 hover:text-blue-800">+ Tambah Tembusan</button>
                </div>
              </div>
            )
          })()}

          {/* Action buttons */}
          <div className="space-y-2">
            {editMode ? (
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: '#003d7a' }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => { setEditMode(false); setEditForm(parseMemo(memo)) }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm">Batal</button>
              </div>
            ) : (
              <>
                {canEdit && (
                  <button onClick={() => setEditMode(true)}
                    className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                    Edit Memo
                  </button>
                )}
                {canSubmit && (
                  <button onClick={() => doAction('submit')} disabled={actionLoading}
                    className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: '#003d7a' }}>
                    Submit untuk Review
                  </button>
                )}
                {canApprove && (
                  <div className="flex gap-2">
                    <button onClick={() => doAction('approve')} disabled={actionLoading}
                      className="flex-1 py-2 rounded-lg text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-60">
                      Setujui
                    </button>
                    <button onClick={() => setRejectModal(true)} disabled={actionLoading}
                      className="flex-1 py-2 rounded-lg text-white text-sm font-medium bg-red-500 hover:bg-red-600 disabled:opacity-60">
                      Tolak
                    </button>
                  </div>
                )}
                {canDistribute && (
                  <button onClick={() => setDistributeModal(true)} disabled={actionLoading}
                    className="w-full py-2 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
                    Distribusikan
                  </button>
                )}
              </>
            )}
          </div>

          {/* Attachments */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Lampiran File</h3>
            {attachments.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada file lampiran</p>
            ) : (
              <ul className="space-y-1.5 mb-3">
                {attachments.map(key => (
                  <li key={key} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg">
                    <a href={`/api/storage/${key}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-xs text-blue-700 hover:underline truncate">
                      {key.split('/').pop()}
                    </a>
                    <button onClick={() => handleDeleteAttachment(key)} className="text-xs text-red-400 hover:text-red-600">×</button>
                  </li>
                ))}
              </ul>
            )}
            {memo.status !== 'distributed' && (
              <form onSubmit={handleUpload} className="flex gap-2 items-end">
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={e => setUploadFile(e.target.files[0] || null)}
                  className="flex-1 text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
                <button type="submit" disabled={!uploadFile || uploading}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50" style={{ backgroundColor: '#003d7a' }}>
                  {uploading ? '...' : 'Upload'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Memo preview */}
      <div className="flex-1 overflow-y-auto bg-gray-100 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview Memo</span>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export PDF
          </button>
        </div>
        <div className="flex-1 p-6 flex justify-center">
          <div className="w-full max-w-[700px] shadow-lg rounded-sm">
            <MemoPreview form={previewForm} />
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Tolak Memo</h3>
            <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3}
              placeholder="Catatan penolakan (opsional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleReject} className="flex-1 py-2 rounded-lg text-white text-sm font-medium bg-red-500 hover:bg-red-600">Tolak</button>
              <button onClick={() => setRejectModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Distribute modal */}
      {distributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Distribusikan ke Kanwil</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {KANWIL_LIST.map(k => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedKanwil.includes(k)}
                    onChange={e => setSelectedKanwil(p => e.target.checked ? [...p, k] : p.filter(x => x !== k))}
                    className="rounded border-gray-300 text-blue-700" />
                  <span className="text-sm text-gray-700">{k}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleDistribute} disabled={selectedKanwil.length === 0}
                className="flex-1 py-2 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                Distribusikan
              </button>
              <button onClick={() => setDistributeModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
