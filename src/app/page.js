import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth.js'
import AppHeader from './components/AppHeader.jsx'
import HomeDashboard from './components/HomeDashboard.jsx'
import { getStorage } from '../lib/storage/index.js'
import { computeMergeStats } from '../lib/business-utils.js'

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
    spbuTrend,
    bpjsTrend,
    indomaretTrend,
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
  ])

  const spbuStats      = computeMergeStats(spbuIdasData, spbuManualData?.rows)
  const bpjsStats      = computeMergeStats(bpjsIdasData, bpjsManualData?.rows)
  const indomaretStats = computeMergeStats(indomaretIdasData, indomaretManualData?.rows)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />
      <HomeDashboard
        user={user}
        nplData={nplData}               nplMeta={nplMeta}
        kol2Data={kol2Data}             kol2Meta={kol2Meta}
        realKreditData={realKreditData} realKreditMeta={realKreditMeta}
        posisiData={posisiData}         posisiMeta={posisiMeta}
        realHarianData={realHarianData} realHarianMeta={realHarianMeta}
        spbuStats={spbuStats}           spbuMeta={spbuMeta}           spbuTrend={spbuTrend}
        bpjsStats={bpjsStats}           bpjsMeta={bpjsMeta}           bpjsTrend={bpjsTrend}
        indomaretStats={indomaretStats} indomaretMeta={indomaretMeta} indomaretTrend={indomaretTrend}
      />
    </div>
  )
}
