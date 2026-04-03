'use client'

const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
const ID_MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function formatTanggal(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function HeaderRow({ label, value, isMultiLine }) {
  if (!value) return null
  const lines = Array.isArray(value) ? value : [value]
  return (
    <tr>
      <td className="font-normal align-top whitespace-nowrap pr-1 w-28">{label}</td>
      <td className="align-top pr-2 w-4">:</td>
      <td className="align-top">
        {lines.map((line, i) => (
          <div key={i}>
            {i === 0 ? 'PT Bank Tabungan Negara (Persero) Tbk' : ''}
            {i === 0 && <br />}
            {line}
          </div>
        ))}
      </td>
    </tr>
  )
}

export default function MemoPreview({ form }) {
  const {
    nomorMemo, perihal, dari, kepada,
    tanggalMemo, konten, lampiranList, tembusan, category, metadata
  } = form

  const kepedaList = Array.isArray(kepada) ? kepada : []
  const lampiranArr = Array.isArray(lampiranList) ? lampiranList : []
  const tembusanArr = Array.isArray(tembusan) ? tembusan : []
  const meta = typeof metadata === 'object' ? metadata : {}
  const pengirimDivision = ((form?.pengirimDivision || meta?.pengirimDivision) || '').trim()
  const pengirimSingkatan = ((form?.pengirimSingkatan || meta?.pengirimSingkatan) || '').trim()
  const pengirimDisplay = [pengirimDivision, pengirimSingkatan ? `(${pengirimSingkatan})` : ''].filter(Boolean).join(' ')
  const pengirimForSignature = pengirimDivision || dari

  const rujukanJenis = ((form?.rujukanJenis || meta?.rujukanJenis) || 'menunjuk').trim()
  const rujukanListRaw = Array.isArray(form?.rujukanList)
    ? form.rujukanList
    : (Array.isArray(meta?.rujukanList) ? meta.rujukanList : [])
  const rujukanList = rujukanListRaw.filter(Boolean)
  const kalimatPengantar = ((form?.kalimatPengantar || meta?.kalimatPengantar) || '').trim()
  const picNama = ((form?.picNama || meta?.picNama) || '').trim()
  const picTeams = ((form?.picTeams || meta?.picTeams) || '').trim()
  const picWA = ((form?.picWA || meta?.picWA) || '').trim()

  const pembukaMap = {
    menunjuk: 'Menunjuk dan menindaklanjuti',
    berdasarkan: 'Berdasarkan',
    merujuk: 'Merujuk pada',
  }
  const kalimatPengantarMap = {
    disampaikan: 'dengan ini kami sampaikan hal-hal berikut:',
    dimohon: 'dengan ini kami mohon:',
    diundang: 'kami mengundang dalam rapat sebagai berikut:',
  }

  const pembukaText = pembukaMap[rujukanJenis] || pembukaMap.menunjuk
  const pengantarText = kalimatPengantarMap[kalimatPengantar] || ''
  const rujukanEntries = rujukanList.filter((r) => {
    const nomor = (r?.nomorMemo || '').trim()
    const tgl = (r?.tanggal || '').trim()
    const prh = (r?.perihal || '').trim()
    return !!(nomor || tgl || prh)
  })
  const shouldRenderOpening = category === 'general' && (
    rujukanEntries.some(r => (r?.nomorMemo || '').trim()) || !!pengantarText
  )
  const shouldRenderClosing = category === 'general'

  const capitalizeFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
  const formatRujukanItem = (r) => {
    const nomor = (r?.nomorMemo || '').trim()
    const tgl = (r?.tanggal || '').trim()
    const prh = (r?.perihal || '').trim()

    const parts = []
    if (nomor) parts.push(`Memo No. ${nomor}`)
    if (tgl) parts.push(`tanggal ${formatTanggal(tgl)}`)
    if (prh) parts.push(`perihal ${prh}`)
    return parts.join(' ')
  }

  return (
    <div
      id="memo-preview"
      className="bg-white text-sm leading-relaxed"
      style={{
        fontFamily: '"Arial Narrow", Arial, sans-serif',
        fontSize: '12pt',
        padding: '2cm 2.5cm',
        minHeight: '27cm',
        lineHeight: '1.0',
        color: '#000',
      }}
    >
      {/* Header */}
      <div className="text-center" style={{ marginBottom: '12pt' }}>
        <div
          className="font-bold mb-1 underline"
          style={{ fontSize: '14pt', textDecorationThickness: '1.5px', textUnderlineOffset: '3px' }}
        >
          M E M O
        </div>
        {nomorMemo && (
          <div className="font-bold" style={{ fontSize: '12pt' }}>No. {nomorMemo}</div>
        )}
        {!nomorMemo && (
          <div className="font-bold" style={{ fontSize: '12pt', color: '#aaa' }}>No. ___/M/___/___/___/____</div>
        )}
      </div>

      {/* Kepada / Dari / Perihal table */}
      <table className="w-full mb-4" style={{ fontSize: '12pt', borderCollapse: 'collapse' }}>
        <tbody>
          {kepedaList.length > 0 ? (
            <>
              {kepedaList.map((k, i) => {
                const divName = typeof k === 'string'
                  ? k
                  : [k.division, k.department ? `(${k.department})` : ''].filter(Boolean).join(' ')
                return (
                  <tr key={i}>
                    <td className="align-top whitespace-nowrap pr-2 w-28 font-bold" style={{ verticalAlign: 'top' }}>
                      {i === 0 ? 'Kepada' : ''}
                    </td>
                    <td className="align-top pr-2 w-4 font-bold" style={{ verticalAlign: 'top' }}>{i === 0 ? ':' : ''}</td>
                    <td style={{ verticalAlign: 'top' }}>
                      {i === 0 && (
                        <div className="font-bold">PT Bank Tabungan Negara (Persero) Tbk</div>
                      )}
                      <div className="italic">
                        {divName || <span style={{ color: '#aaa' }}>[Nama Divisi]</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </>
          ) : (
            <tr>
              <td className="align-top whitespace-nowrap pr-2 w-28 font-bold">Kepada</td>
              <td className="align-top pr-2 w-4 font-bold">:</td>
              <td>
                <div className="font-bold">PT Bank Tabungan Negara (Persero) Tbk</div>
                <div className="italic" style={{ color: '#aaa' }}>[Nama Divisi Tujuan]</div>
              </td>
            </tr>
          )}
          <tr><td colSpan={3} style={{ paddingTop: '4px' }}></td></tr>
          <tr>
            <td className="align-top whitespace-nowrap pr-2 font-bold">Dari</td>
            <td className="align-top pr-2 font-bold">:</td>
            <td style={{ verticalAlign: 'top' }}>
              <div className="font-bold">PT Bank Tabungan Negara (Persero) Tbk</div>
              <div className="italic">
                {pengirimDisplay || dari || <span style={{ color: '#aaa' }}>[Nama Divisi Pengirim]</span>}
              </div>
            </td>
          </tr>
          <tr><td colSpan={3} style={{ paddingTop: '4px' }}></td></tr>
          <tr>
            <td className="align-top whitespace-nowrap pr-2 font-bold">Perihal</td>
            <td className="align-top pr-2 font-bold">:</td>
            <td className="font-bold" style={{ verticalAlign: 'top' }}>
              {perihal || <span style={{ color: '#aaa' }}>[Perihal memo]</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Divider */}
      <hr style={{ borderTop: '1px solid #000', marginBottom: '12pt' }} />

      {/* IP credit data table (if izin_prinsip category and at least one field filled) */}
      {category === 'izin_prinsip' && (
        meta.namaDebitur || meta.jenisKredit || meta.plafond || meta.jangkaWaktu ||
        meta.provisi || meta.spreadRate || meta.ltv || meta.jenisAgunan || meta.nilaiAgunan
      ) && (() => {
        const fmt = (juta) => {
          const n = Number(juta) * 1000000
          return `Rp. ${n.toLocaleString('id-ID')},-`
        }
        const rows = [
          meta.namaDebitur  && ['Nama Pemohon',          meta.namaDebitur],
          meta.jenisKredit  && ['Jenis Kredit',           meta.jenisKredit],
          meta.plafond      && ['Plafond Kredit',         fmt(meta.plafond)],
          meta.jangkaWaktu  && ['Jangka Waktu',           `${meta.jangkaWaktu} bulan`],
          meta.provisi      && ['Provisi',                meta.provisi],
          meta.spreadRate   && ['Spread Rate',            meta.spreadRate],
          meta.ltv          && ['LTV',                    meta.ltv],
          meta.jenisAgunan  && ['Jenis Simpanan Agunan',  meta.jenisAgunan],
          meta.nilaiAgunan  && ['Nilai Agunan',           fmt(meta.nilaiAgunan)],
          meta.peruntukan   && ['Peruntukan',             meta.peruntukan],
          meta.ratingDebitur && ['Rating',                meta.ratingDebitur],
        ].filter(Boolean)

        return (
          <table className="w-full" style={{ fontSize: '12pt', borderCollapse: 'collapse', marginBottom: '12pt', border: '1px solid #000' }}>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td style={{ border: '1px solid #000', padding: '3px 8px', width: '44%', verticalAlign: 'top' }}>{label}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 8px', verticalAlign: 'top' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      })()}

      {/* Body */}
      <div
        className="memo-body"
        style={{ fontSize: '12pt', lineHeight: '1.0', marginBottom: '12pt' }}
      >
        {shouldRenderOpening && (
          <div style={{ marginBottom: '6pt' }}>
            {rujukanEntries.length === 0 ? (
              <p>{capitalizeFirst(pengantarText)}</p>
            ) : rujukanEntries.length === 1 ? (
              <p>
                {pembukaText} {formatRujukanItem(rujukanEntries[0])}
                {pengantarText ? `, ${pengantarText}` : '.'}
              </p>
            ) : (
              <>
                <p>{pembukaText}:</p>
                <ol className="list-decimal list-inside">
                  {rujukanEntries.map((r, i) => (
                    <li key={i}>
                      {formatRujukanItem(r)}
                      {i < rujukanEntries.length - 1 ? ';' : '.'}
                    </li>
                  ))}
                </ol>
                {pengantarText && <p>{capitalizeFirst(pengantarText)}</p>}
              </>
            )}
          </div>
        )}

        <div
          dangerouslySetInnerHTML={{ __html: konten || '<p style="color:#aaa">[Isi memo...]</p>' }}
        />

        {shouldRenderClosing && (
          <div style={{ marginTop: '6pt' }}>
            {picNama && (
              <p>
                {(() => {
                  const picDiv = (pengirimSingkatan || pengirimDivision || '').trim()
                  const label = picDiv ? `PIC ${picDiv}` : 'PIC'
                  const contacts = []
                  if (picTeams) contacts.push(`Teams: ${picTeams}`)
                  if (picWA) contacts.push(`Whatsapp: ${picWA}`)
                  const contactSuffix = contacts.length ? ` (${contacts.join(' / ')})` : ''
                  return `Apabila terdapat hal-hal yang perlu dikonfirmasi, dapat menghubungi ${label} an ${picNama}${contactSuffix}.`
                })()}
              </p>
            )}
            <p>Demikian kami sampaikan, atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>
          </div>
        )}
      </div>

      {/* Signature */}
      <div style={{ marginTop: '12pt', fontSize: '12pt', textAlign: 'right' }}>
        <div>Jakarta, {formatTanggal(tanggalMemo)}</div>
        <div className="mt-1 font-bold">PT. BANK TABUNGAN NEGARA (PERSERO), TBK</div>
        <div className="font-bold uppercase mt-0.5">
          {pengirimForSignature || <span style={{ color: '#aaa' }}>[NAMA DIVISI]</span>}
        </div>
      </div>

      {/* Lampiran */}
      {lampiranArr.filter(Boolean).length > 0 && (
        <div style={{ marginTop: '12pt', fontSize: '12pt' }}>
          <div className="font-semibold">Lampiran:</div>
          <ol className="list-decimal list-inside mt-1 space-y-0.5">
            {lampiranArr.filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Tembusan */}
      {tembusanArr.filter(Boolean).length > 0 && (
        <div style={{ marginTop: '12pt', fontSize: '12pt' }}>
          <div className="font-semibold">Tembusan:</div>
          <ol className="list-decimal list-inside mt-1 space-y-0.5">
            {tembusanArr.filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #memo-preview, #memo-preview * { visibility: visible !important; }
          #memo-preview {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            padding: 2cm 2.5cm !important;
          }
          .memo-body table { border-collapse: collapse; }
          .memo-body td, .memo-body th { border: 1px solid #000; padding: 4px 8px; }
        }
        .memo-body { line-height: 1.0; }
        .memo-body p { margin: 0 0 6pt 0; }
        .memo-body p:last-child { margin-bottom: 0; }
        .memo-body ol, .memo-body ul { margin: 0 0 6pt 0; padding-left: 1.5em; }
        .memo-body li { margin: 0; padding: 0; }
        .memo-body table { border-collapse: collapse; width: 100%; margin: 0 0 6pt 0; }
        .memo-body td, .memo-body th { border: 1px solid #000; padding: 4px 8px; text-align: left; vertical-align: top; }
        .memo-body td p, .memo-body th p { margin: 0; }
        .memo-body th { background: #f0f0f0; font-weight: bold; }
        .memo-body strong { font-weight: bold; }
        .memo-body em { font-style: italic; }
      `}</style>
    </div>
  )
}
