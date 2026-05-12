import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth.js'
import AppHeader from './components/AppHeader.jsx'
import { getStorage } from '../lib/storage/index.js'
import { computeMergeStats } from '../lib/business-upload-handler.js'

function formatDateTime(dateString) {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function fmt(val) {
  if (val == null || isNaN(val)) return '–'
  return Number(val).toLocaleString('id-ID')
}

function fmtJt(val) {
  if (val == null || isNaN(val)) return '–'
  return (val / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

function fmtPct(val) {
  if (val == null || isNaN(val)) return '–'
  return `${Number(val).toFixed(2)}%`
}

function isLive(uploadDate) {
  if (!uploadDate) return null
  return (Date.now() - new Date(uploadDate).getTime()) / 36e5 < 24
}

function FreshnessDot({ uploadDate }) {
  const live = isLive(uploadDate)
  if (live === null) return <span className="inline-flex w-2 h-2 rounded-full bg-gray-300" />
  return (
    <span className={`inline-flex w-2 h-2 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
  )
}

function SectionHeader({ title, href }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
      <Link href={href} className="text-xs font-medium text-[#003d7a] hover:underline underline-offset-2">
        Lihat detail →
      </Link>
    </div>
  )
}

function StatCard({ label, uploadDate, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#003d7a] transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <FreshnessDot uploadDate={uploadDate} />
      </div>
      <div className="flex-1">{children}</div>
      {uploadDate && (
        <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">{formatDateTime(uploadDate)}</p>
      )}
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-gray-500 truncate">{label}</span>
      <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{value}</span>
    </div>
  )
}

export default async function HubPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null

  const storage = getStorage()

  const [
    nplMeta, nplData,
    kol2Meta, kol2Data,
    realKreditMeta, realKreditData,
    posisiMeta, posisiData,
    realHarianMeta, realHarianData,
    spbuMeta, spbuIdasData, spbuManualData,
    bpjsMeta, bpjsIdasData, bpjsManualData,
    indomaretMeta, indomaretIdasData, indomaretManualData,
  ] = await Promise.all([
    storage.get('npl_metadata.json'),
    storage.get('npl_parsed.json'),
    storage.get('kol2_metadata.json'),
    storage.get('kol2_parsed.json'),
    storage.get('realisasi_kredit_metadata.json'),
    storage.get('realisasi_kredit_parsed.json'),
    storage.get('posisi_kredit_metadata.json'),
    storage.get('posisi_kredit_parsed.json'),
    storage.get('realisasi_metadata.json'),
    storage.get('realisasi_parsed.json'),
    storage.get('prk_spbu_metadata.json'),
    storage.get('prk_spbu_parsed.json'),
    storage.get('prk_spbu_manual_parsed.json'),
    storage.get('bpjs_metadata.json'),
    storage.get('bpjs_parsed.json'),
    storage.get('bpjs_manual_parsed.json'),
    storage.get('indomaret_metadata.json'),
    storage.get('indomaret_parsed.json'),
    storage.get('indomaret_manual_parsed.json'),
  ])

  const spbuStats = computeMergeStats(spbuIdasData, spbuManualData?.rows)
  const bpjsStats = computeMergeStats(bpjsIdasData, bpjsManualData?.rows)
  const indomaretStats = computeMergeStats(indomaretIdasData, indomaretManualData?.rows)

  const mtdCurrent = realHarianData?.monthlyTotals?.current
  const mtdPrevious = realHarianData?.monthlyTotals?.previous
  const mtdGrowthPct = mtdCurrent && mtdPrevious
    ? ((mtdCurrent - mtdPrevious) / mtdPrevious * 100).toFixed(2)
    : null

  const npl = nplData?.totalNasional
  const kol2 = kol2Data?.totalNasional
  const realK = realKreditData?.totalNasional
  const posisi = posisiData?.totalNasional

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />

      <div style={{ backgroundColor: '#003d7a' }}>
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-1">
            {user ? 'Selamat datang kembali' : 'Selamat datang'}
          </p>
          <h2 className="text-2xl font-bold text-white leading-none">
            {user?.name ?? 'SME Dashboard'}
          </h2>
          <p className="text-sm text-white/50 mt-1">Business Banking Division</p>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #E80025, transparent)' }} />
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-8 space-y-10">

        {/* Kredit Monitoring */}
        <section>
          <SectionHeader title="Kredit Monitoring" href="/monitoring" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <StatCard label="NPL" uploadDate={nplMeta?.uploadDate}>
              <p className="text-2xl font-bold text-[#003d7a] leading-none">
                {fmt(npl?.total_current)}
                <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
              </p>
              <div className="mt-2 space-y-1">
                <MetricRow label="KUMK" value={fmtPct(npl?.kumkPercent_current)} />
                <MetricRow label="KUR" value={fmtPct(npl?.kurPercent_current)} />
                <MetricRow label="Total" value={fmtPct(npl?.totalPercent_current)} />
              </div>
            </StatCard>

            <StatCard label="KOL 2" uploadDate={kol2Meta?.uploadDate}>
              <p className="text-2xl font-bold text-[#003d7a] leading-none">
                {fmt(kol2?.total_current)}
                <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
              </p>
              <div className="mt-2 space-y-1">
                <MetricRow label="KUMK" value={fmtPct(kol2?.kumkPercent_current)} />
                <MetricRow label="KUR" value={fmtPct(kol2?.kurPercent_current)} />
                <MetricRow label="Total" value={fmtPct(kol2?.totalPercent_current)} />
              </div>
            </StatCard>

            <StatCard label="Realisasi Kredit" uploadDate={realKreditMeta?.uploadDate}>
              <div className="space-y-1.5">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">KUMK</p>
                  <p className="text-xl font-bold text-[#003d7a] leading-tight">
                    {fmt(realK?.kumk_real_current)}
                    <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
                  </p>
                </div>
                <MetricRow label="KUR" value={`${fmt(realK?.kur_total_current)} Jt`} />
                <MetricRow label="UMKM" value={`${fmt(realK?.umkm_real_current)} Jt`} />
              </div>
            </StatCard>

            <StatCard label="Posisi Kredit" uploadDate={posisiMeta?.uploadDate}>
              <p className="text-2xl font-bold text-[#003d7a] leading-none">
                {fmt(posisi?.posisi_current)}
                <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
              </p>
              <div className="mt-2 space-y-1">
                <MetricRow label="Gap MTD" value={`${fmt(posisi?.gap_mtd)} Jt`} />
                <MetricRow label="Gap YoY" value={`${fmt(posisi?.gap_yoy)} Jt`} />
              </div>
            </StatCard>
          </div>
        </section>

        {/* Realisasi Harian */}
        <section>
          <SectionHeader title="Realisasi Harian" href="/monitoring" />
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#003d7a] transition-all duration-200">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2 shrink-0">
                <FreshnessDot uploadDate={realHarianMeta?.uploadDate} />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">MTD Total</span>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 flex-1">
                <div>
                  <p className="text-2xl font-bold text-[#003d7a] leading-none">
                    {fmt(mtdCurrent)}
                    <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Bulan berjalan</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-600 leading-none">
                    {fmt(mtdPrevious)}
                    <span className="text-xs font-normal text-gray-500 ml-1">Jt</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Bulan lalu</p>
                </div>
                {mtdGrowthPct !== null && (
                  <div>
                    <p className={`text-lg font-semibold leading-none ${parseFloat(mtdGrowthPct) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(mtdGrowthPct) >= 0 ? '+' : ''}{mtdGrowthPct}%
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">vs bulan lalu</p>
                  </div>
                )}
              </div>
              {realHarianMeta?.uploadDate && (
                <p className="text-[10px] text-gray-400 shrink-0">{formatDateTime(realHarianMeta.uploadDate)}</p>
              )}
            </div>
          </div>
        </section>

        {/* Business Monitoring */}
        <section>
          <SectionHeader title="Business Monitoring" href="/monitoring/business" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'PRK SPBU', meta: spbuMeta, stats: spbuStats },
              { label: 'BPJS', meta: bpjsMeta, stats: bpjsStats },
              { label: 'Indomaret', meta: indomaretMeta, stats: indomaretStats },
            ].map(({ label, meta, stats }) => (
              <StatCard key={label} label={label} uploadDate={meta?.uploadDate}>
                {stats ? (
                  <>
                    <p className="text-2xl font-bold text-[#003d7a] leading-none">
                      {stats.masterTotal.toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-gray-500 ml-1">debitur</span>
                    </p>
                    <div className="mt-2 space-y-1">
                      <MetricRow
                        label="Ditemukan di IDAS"
                        value={`${stats.idasFound.toLocaleString('id-ID')} / ${stats.masterTotal.toLocaleString('id-ID')}`}
                      />
                      <MetricRow label="Baki Debet" value={`${fmtJt(stats.totalBakiDebet)} Jt`} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Belum ada data</p>
                )}
              </StatCard>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
