import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth.js'
import AppHeader from './components/AppHeader.jsx'
import { getStorage } from '../lib/storage/index.js'

const BTN_NAVY = '#003d7a'

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

function getStatus(uploadDate) {
  if (!uploadDate) return { type: 'nodata', label: 'Belum ada data' }

  const diffHours = (Date.now() - new Date(uploadDate).getTime()) / 36e5
  if (diffHours < 24) {
    return { type: 'live', label: `LIVE - ${formatDateTime(uploadDate)}` }
  }

  return { type: 'stale', label: formatDateTime(uploadDate) }
}

function ModuleIcon({ type }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'w-6 h-6',
    'aria-hidden': true,
  }

  if (type === 'monitoring') {
    return (
      <svg {...commonProps}>
        <path d="M3 21h18" />
        <path d="M7 17V9" />
        <path d="M12 17V5" />
        <path d="M17 17v-7" />
      </svg>
    )
  }

  if (type === 'spbu') {
    return (
      <svg {...commonProps}>
        <path d="M5 20V7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v13" />
        <path d="M5 20h10" />
        <path d="M8 9h3" />
        <path d="M14 8h1.5a2 2 0 0 1 2 2v5.5a1.5 1.5 0 0 0 3 0V12" />
        <path d="M18.5 9.5 17 8" />
      </svg>
    )
  }

  if (type === 'memo') {
    return (
      <svg {...commonProps}>
        <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M12 3 5 6v6c0 4.2 2.7 8.1 7 9 4.3-.9 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function StatusBadge({ status }) {
  if (status.type === 'restricted') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-gray-400 transition-colors duration-200 group-hover:text-blue-200">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path d="M12 3 5 6v6c0 4.2 2.7 8.1 7 9 4.3-.9 7-4.8 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>{status.label}</span>
      </div>
    )
  }

  if (status.type === 'locked') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-gray-400 transition-colors duration-200 group-hover:text-blue-200">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span>{status.label}</span>
      </div>
    )
  }

  const dotClass = status.type === 'live'
    ? 'bg-green-400 animate-pulse'
    : status.type === 'stale'
      ? 'bg-amber-400'
      : 'bg-gray-300'

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-gray-400 transition-colors duration-200 group-hover:text-blue-200">
      <span className={`inline-flex w-2 h-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{status.label}</span>
    </div>
  )
}

export default async function HubPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null

  const storage = getStorage()
  const monitoringMeta = await storage.get('npl_metadata.json')
  const spbuMeta = await storage.get('prk_spbu_metadata.json')

  const cards = [
    {
      title: 'Monitoring',
      desc: 'Pusat monitoring bisnis untuk dashboard kredit utama dan PRK SPBU.',
      icon: 'monitoring',
      status: getStatus(
        [monitoringMeta?.uploadDate, spbuMeta?.uploadDate]
          .filter(Boolean)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      ),
      links: [{ href: '/monitoring', label: 'Buka Monitoring' }],
    },
    {
      title: 'Memo',
      desc: 'Kelola memo dari draft, review, approved, sampai distribusi dan lampiran.',
      icon: 'memo',
      status: { type: 'locked', label: 'Login diperlukan' },
      links: [{ href: '/memo', label: 'Buka Memo' }],
    },
    ...(user?.role === 'admin'
      ? [{
          title: 'Admin',
          desc: 'Upload data, kelola user, dan kontrol operasional dashboard.',
          icon: 'admin',
          status: { type: 'restricted', label: 'Khusus admin' },
          links: [{ href: '/admin', label: 'Buka Admin Portal' }],
        }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Beranda</h1>
          <p className="text-sm text-gray-400 mt-0.5 uppercase tracking-widest text-[11px]">
            Pilih modul
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {cards.map((card) => {
            const primaryLink = card.links[0]

            return (
              <div
                key={card.title}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-[#003d7a] hover:border-[#003d7a]"
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#003d7a] transition-colors duration-200 group-hover:bg-white/40" />

                <div className="flex flex-col gap-4 px-7 py-5 pl-8 md:flex-row md:items-center md:gap-5">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#e8f0fe] text-[#003d7a] flex items-center justify-center transition-all duration-200 group-hover:bg-white/15 group-hover:text-white shrink-0">
                      <ModuleIcon type={card.icon} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-[1.65rem] leading-none font-bold text-gray-900 transition-colors duration-200 group-hover:text-white">
                        {card.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1 transition-colors duration-200 group-hover:text-blue-100">
                        {card.desc}
                      </p>
                      <div className="mt-3">
                        <StatusBadge status={card.status} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:flex-shrink-0">
                    <Link
                      href={primaryLink.href}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 bg-[#003d7a] group-hover:bg-white group-hover:text-[#003d7a]"
                    >
                      {primaryLink.label}
                    </Link>

                    {card.secondaryLinks?.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm font-medium text-[#003d7a] underline underline-offset-4 transition-colors duration-200 group-hover:text-white/80"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
