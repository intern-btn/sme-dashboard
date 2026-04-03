'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import AppHeader from '../components/AppHeader'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function MemoLayout({ children }) {
  const [authState, setAuthState] = useState({ loading: true, user: null })

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.ok ? r.json() : null)
      .then(d => setAuthState({ loading: false, user: d?.user || null }))
      .catch(() => setAuthState({ loading: false, user: null }))
  }, [])

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    )
  }

  const memoNavLinks = [
    { href: '/memo', label: 'Semua Memo', exact: true },
    { href: '/memo/new', label: '+ Buat Memo' },
  ]

  return (
    <AuthContext.Provider value={authState.user}>
      <div className="min-h-screen bg-gray-50">
        <AppHeader user={authState.user} memoNavLinks={memoNavLinks} />
        <main className="max-w-screen-xl mx-auto px-4 py-6">{children}</main>
      </div>
    </AuthContext.Provider>
  )
}

