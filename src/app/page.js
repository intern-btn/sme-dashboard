import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth.js'
import AppHeader from './components/AppHeader.jsx'
import { getStorage } from '../lib/storage/index.js'

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

export default async function HubPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null

  const storage = getStorage()
  const monitoringMeta = await storage.get('npl_metadata.json')
  const spbuMeta = await storage.get('prk_spbu_metadata.json')

  const cards = [
    {
      title: 'Credit Monitoring',
      desc: 'Dashboard monitoring NPL/KOL2/Realisasi/Posisi Kredit.',
      links: [
        { href: '/monitoring', label: 'Buka Monitoring' },
        { href: '/monitoring/tv', label: 'TV Mode' },
      ],
      meta: `Last updated: ${formatDateTime(monitoringMeta?.uploadDate)}`,
    },
    {
      title: 'PRK SPBU',
      desc: 'Monitoring debitur PRK SPBU dari IDAS + supplement manual.',
      links: [{ href: '/spbu', label: 'Buka SPBU' }],
      meta: `Last updated: ${formatDateTime(spbuMeta?.uploadDate)}`,
    },
    {
      title: 'Memo',
      desc: 'Kelola memo (draft → review → approved → distributed) + lampiran.',
      links: [{ href: '/memo', label: 'Buka Memo' }],
      meta: 'Login diperlukan.',
    },
    ...(user?.role === 'admin'
      ? [{
          title: 'Admin',
          desc: 'Upload Excel dan kelola user.',
          links: [{ href: '/admin', label: 'Buka Admin Portal' }],
          meta: 'Khusus admin.',
        }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Beranda</h1>
          <p className="text-sm text-gray-600 mt-1">Pilih modul yang ingin digunakan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.title} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
              <div className="text-lg font-bold text-gray-900">{card.title}</div>
              <div className="text-sm text-gray-600 mt-1 flex-1">{card.desc}</div>

              <div className="mt-4 flex flex-wrap gap-2">
                {card.links.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: '#003d7a' }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="mt-3 text-xs text-gray-500">{card.meta}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

