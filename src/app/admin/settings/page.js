import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth.js'
import { redirect } from 'next/navigation'
import AppHeader from '../../components/AppHeader'
import UsersSection from './components/UsersSection'

export const metadata = { title: 'Settings — SME Dashboard' }

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') redirect('/admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={session.user} />
      <main className="max-w-screen-xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Navigation — horizontal strip on mobile, sidebar on desktop */}
          <nav className="md:w-48 md:shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="hidden md:block px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</span>
              </div>
              <ul className="flex md:flex-col md:py-1">
                <li className="flex-1 md:flex-none">
                  <a href="/admin/settings" className="flex items-center justify-center md:justify-start px-4 py-2.5 md:py-2 text-sm font-medium bg-blue-50 text-blue-700 border-b-2 md:border-b-0 md:border-r-2 border-blue-700">
                    Users
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <UsersSection />
          </div>
        </div>
      </main>
    </div>
  )
}
