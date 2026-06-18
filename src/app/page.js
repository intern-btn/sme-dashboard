import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth.js'
import AppHeader from './components/AppHeader.jsx'
import HomeDashboard from './components/HomeDashboard.jsx'
import { getStorage } from '../lib/storage/index.js'
import { computeMergeStats } from '../lib/business-utils.js'
import { applyScope, getScopeFromSession } from '../lib/access-scope.js'

export default async function HubPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user ? {
    name: session.user.name,
    role: session.user.role,
    accessScope: session.user.accessScope || 'national',
    kanwil: session.user.kanwil || null,
    cabang: session.user.cabang || null,
  } : null

  const scope = getScopeFromSession(session)
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
    spbuTrend,
    bpjsTrend,
    indomaretTrend,
    rkapKurData,
    rkapKumkData,
    rkapPosisiData,
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
    storage.get('prk_spbu_trend_parsed.json'),
    storage.get('bpjs_trend_parsed.json'),
    storage.get('indomaret_trend_parsed.json'),
    storage.get('rkap_kur_parsed.json'),
    storage.get('rkap_kumk_parsed.json'),
    storage.get('rkap_posisi_parsed.json'),
  ])

  const spbuStats      = computeMergeStats(spbuIdasData, spbuManualData?.rows)
  const bpjsStats      = computeMergeStats(bpjsIdasData, bpjsManualData?.rows)
  const indomaretStats = computeMergeStats(indomaretIdasData, indomaretManualData?.rows)

  // Apply office-level scope filtering (national users: no-op)
  const scopedNplData         = applyScope(nplData,         scope, 'npl')
  const scopedKol2Data        = applyScope(kol2Data,        scope, 'kol2')
  const scopedRealKreditData  = applyScope(realKreditData,  scope, 'realisasi_kredit')
  const scopedPosisiData      = applyScope(posisiData,      scope, 'posisi_kredit')
  const scopedRkapKurData     = applyScope(rkapKurData,     scope, 'rkap_kur')
  const scopedRkapKumkData    = applyScope(rkapKumkData,    scope, 'rkap_kumk')
  const scopedRkapPosisiData  = applyScope(rkapPosisiData,  scope, 'rkap_posisi')
  // realHarianData is national aggregate — passthrough for all users

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />
      <HomeDashboard
        user={user}
        nplData={scopedNplData}               nplMeta={nplMeta}
        kol2Data={scopedKol2Data}             kol2Meta={kol2Meta}
        realKreditData={scopedRealKreditData} realKreditMeta={realKreditMeta}
        posisiData={scopedPosisiData}         posisiMeta={posisiMeta}
        realHarianData={realHarianData}       realHarianMeta={realHarianMeta}
        spbuStats={spbuStats}                 spbuMeta={spbuMeta}           spbuTrend={spbuTrend}
        bpjsStats={bpjsStats}                 bpjsMeta={bpjsMeta}           bpjsTrend={bpjsTrend}
        indomaretStats={indomaretStats}       indomaretMeta={indomaretMeta} indomaretTrend={indomaretTrend}
        rkapKurData={scopedRkapKurData}       rkapKumkData={scopedRkapKumkData}   rkapPosisiData={scopedRkapPosisiData}
      />
    </div>
  )
}
