'use client'

import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [nplFile, setNplFile] = useState(null)
  const [kol2File, setKol2File] = useState(null)
  const [realisasiFile, setRealisasiFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploadStats, setUploadStats] = useState(null)
  const [currentData, setCurrentData] = useState({ npl: null, kol2: null, realisasi: null })
  const [history, setHistory] = useState([])

  useEffect(() => {
    // Check if already authenticated
    const authToken = localStorage.getItem('admin_auth')
    if (authToken === 'authenticated') {
      setIsAuthenticated(true)
      fetchCurrentStatus()
      fetchHistory()
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        localStorage.setItem('admin_auth', 'authenticated')
        setIsAuthenticated(true)
        fetchCurrentStatus()
        fetchHistory()
      } else {
        setAuthError('Password salah')
      }
    } catch (err) {
      setAuthError('Authentication failed')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    setIsAuthenticated(false)
  }

  const fetchCurrentStatus = async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const data = await response.json()
        setCurrentData(data)
      }
    } catch (error) {
      // Silently handle
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      // Silently handle
    }
  }

  const handleUpload = async () => {
    if (!nplFile || !kol2File || !realisasiFile) {
      setError('Pilih semua 3 file Excel')
      return
    }

    setUploading(true)
    setMessage('')
    setError('')
    setUploadStats(null)

    try {
      const formData = new FormData()
      formData.append('npl', nplFile)
      formData.append('kol2', kol2File)
      formData.append('realisasi', realisasiFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Upload failed')
      }

      setMessage('File berhasil diupload dan diproses!')
      setUploadStats(result.stats)
      setNplFile(null)
      setKol2File(null)
      setRealisasiFile(null)

      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = ''
      })

      setTimeout(() => {
        fetchCurrentStatus()
        fetchHistory()
      }, 1000)

    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
            <p className="text-gray-600 mt-2">SME Dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan password"
                autoFocus
              />
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <a href="/" className="text-blue-600 hover:underline">← Kembali ke Dashboard</a>
          </div>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📊</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
                <p className="text-gray-600">SME Dashboard - Upload Data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Data Baru</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  1. NPL SME (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setNplFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {nplFile && <p className="mt-1 text-sm text-green-600">{nplFile.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2. Kol 2 SME (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setKol2File(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {kol2File && <p className="mt-1 text-sm text-green-600">{kol2File.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  3. Realisasi Harian (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setRealisasiFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {realisasiFile && <p className="mt-1 text-sm text-green-600">{realisasiFile.name}</p>}
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !nplFile || !kol2File || !realisasiFile}
              className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                uploading || !nplFile || !kol2File || !realisasiFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>

            {message && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">{message}</p>
                {uploadStats && (
                  <div className="mt-2 text-sm text-green-600">
                    <p>NPL: {uploadStats.nplKanwil} kanwil, {uploadStats.nplCabang} cabang</p>
                    <p>KOL2: {uploadStats.kol2Kanwil} kanwil, {uploadStats.kol2Cabang} cabang</p>
                    <p>Realisasi: {uploadStats.realisasiDays} hari</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Current Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Data Saat Ini</h2>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">NPL</div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentData.npl ? formatDate(currentData.npl.uploadDate) : 'Belum ada data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">KOL 2</div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentData.kol2 ? formatDate(currentData.kol2.uploadDate) : 'Belum ada data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Realisasi</div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentData.realisasi ? formatDate(currentData.realisasi.uploadDate) : 'Belum ada data'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Riwayat Upload</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Tanggal Upload</th>
                    <th className="text-left py-2 px-3">Periode Data</th>
                    <th className="text-left py-2 px-3">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{formatDate(item.uploadDate)}</td>
                      <td className="py-2 px-3">{item.monthInfo?.current?.fullLabel || '-'}</td>
                      <td className="py-2 px-3 text-gray-500">{item.files?.join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
