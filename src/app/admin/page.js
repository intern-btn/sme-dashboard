'use client'

import { useState, useEffect } from 'react'
import { upload } from '@vercel/blob/client'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [nplFile, setNplFile] = useState(null)
  const [kol2File, setKol2File] = useState(null)
  const [realisasiFile, setRealisasiFile] = useState(null)
  const [realisasiKreditFile, setRealisasiKreditFile] = useState(null)
  const [posisiKreditFile, setPosisiKreditFile] = useState(null)
  const [multiSheetFile, setMultiSheetFile] = useState(null)
  const [uploadMode, setUploadMode] = useState('separate') // 'separate' | 'multi'
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploadStats, setUploadStats] = useState(null)
  const [currentData, setCurrentData] = useState({ npl: null, kol2: null, realisasi: null, realisasi_kredit: null, posisi_kredit: null })
  const [history, setHistory] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    // Verify session cookie on mount
    fetch('/api/auth/check')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true)
          fetchCurrentStatus()
          fetchHistory()
        }
      })
      .catch(() => {})
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
        // Session cookie is set by the server in the response
        setIsAuthenticated(true)
        setPassword('')
        fetchCurrentStatus()
        fetchHistory()
      } else {
        const data = await response.json()
        setAuthError(data.error || 'Password salah')
      }
    } catch (err) {
      setAuthError('Authentication failed')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
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

  const handleSeparateFilesUpload = async () => {
    if (!nplFile && !kol2File && !realisasiFile && !realisasiKreditFile && !posisiKreditFile) {
      setError('Pilih minimal 1 file Excel')
      return
    }

    setUploading(true)
    setMessage('')
    setError('')
    setUploadStats(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      if (nplFile) formData.append('npl', nplFile)
      if (kol2File) formData.append('kol2', kol2File)
      if (realisasiFile) formData.append('realisasi', realisasiFile)
      if (realisasiKreditFile) formData.append('realisasi_kredit', realisasiKreditFile)
      if (posisiKreditFile) formData.append('posisi_kredit', posisiKreditFile)

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
      setRealisasiKreditFile(null)
      setPosisiKreditFile(null)

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
      setUploadProgress(0)
    }
  }

  const handleMultiSheetUpload = async () => {
    if (!multiSheetFile) {
      setError('Pilih file Excel multi-sheet')
      return
    }

    // Validate file size (15MB limit)
    const maxSize = 15 * 1024 * 1024 // 15MB
    if (multiSheetFile.size > maxSize) {
      setError(`File terlalu besar (${(multiSheetFile.size / 1024 / 1024).toFixed(2)}MB). Maksimum 15MB`)
      return
    }

    setUploading(true)
    setMessage('')
    setError('')
    setUploadStats(null)
    setUploadProgress(0)

    try {
      // Step 1: Upload to Vercel Blob with progress tracking
      const blob = await upload(multiSheetFile.name, multiSheetFile, {
        access: 'public',
        handleUploadUrl: '/api/upload/token',
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          setUploadProgress(percent)
        }
      })

      console.log('Uploaded to blob:', blob.url)

      // Step 2: Process the multi-sheet Excel
      const processResponse = await fetch('/api/upload/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobUrl: blob.url })
      })

      const result = await processResponse.json()

      if (!processResponse.ok) {
        throw new Error(result.error || result.details || 'Processing failed')
      }

      // Show success message with parsed sheets info
      let successMsg = 'File berhasil diupload dan diproses!'
      if (result.parsedSheets && result.parsedSheets.length > 0) {
        successMsg += ` (${result.parsedSheets.join(', ')})`
      }
      if (result.missingSheets && result.missingSheets.length > 0) {
        successMsg += ` | Sheet tidak ditemukan: ${result.missingSheets.join(', ')}`
      }

      setMessage(successMsg)
      setUploadStats(result.stats)
      setMultiSheetFile(null)

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
      setUploadProgress(0)
    }
  }

  const handleUpload = async () => {
    if (uploadMode === 'multi') {
      await handleMultiSheetUpload()
    } else {
      await handleSeparateFilesUpload()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/1280px-BTN_2024.svg.png" alt="BTN" className="h-12 mx-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-600 mt-2 text-sm">SME Dashboard Management</p>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                placeholder="Enter password"
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
              className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <a href="/" className="text-blue-900 hover:underline font-medium">← Return to Dashboard</a>
          </div>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Portal</h1>
                <p className="text-gray-600 text-xs sm:text-sm">SME Dashboard Data Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <a
                href="/"
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors font-medium text-xs sm:text-sm border border-blue-900 text-center"
              >
                View Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-xs sm:text-sm border border-gray-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Data</h2>

            {/* Mode Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Mode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setUploadMode('separate')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    uploadMode === 'separate'
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Separate Files (5 files)
                </button>
                <button
                  onClick={() => setUploadMode('multi')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    uploadMode === 'multi'
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Multi-Sheet (1 file, max 15MB)
                </button>
              </div>
            </div>

            {uploadMode === 'separate' ? (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4. Realisasi Kredit (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setRealisasiKreditFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {realisasiKreditFile && <p className="mt-1 text-sm text-green-600">{realisasiKreditFile.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  5. Posisi Kredit (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setPosisiKreditFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {posisiKreditFile && <p className="mt-1 text-sm text-green-600">{posisiKreditFile.name}</p>}
              </div>
            </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>Multi-Sheet Excel:</strong> Upload satu file Excel yang berisi 5 sheet dengan awalan:
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 ml-4 space-y-1">
                    <li>• <strong>22a</strong> - Realisasi Harian</li>
                    <li>• <strong>44a1</strong> - Realisasi Kredit</li>
                    <li>• <strong>44b</strong> - Posisi Kredit</li>
                    <li>• <strong>49b</strong> - KOL 2</li>
                    <li>• <strong>49c</strong> - NPL</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Multi-Sheet Excel File (.xlsx, max 15MB)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setMultiSheetFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {multiSheetFile && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">{multiSheetFile.name}</p>
                      <p className="text-xs text-gray-500">
                        Size: {(multiSheetFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {uploading && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                  <span className="text-sm font-medium text-blue-900">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || (uploadMode === 'multi' ? !multiSheetFile : (!nplFile && !kol2File && !realisasiFile && !realisasiKreditFile && !posisiKreditFile))}
              className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                uploading || (uploadMode === 'multi' ? !multiSheetFile : (!nplFile && !kol2File && !realisasiFile && !realisasiKreditFile && !posisiKreditFile))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {uploading ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : 'Processing...') : 'Upload & Process'}
            </button>

            {message && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">{message}</p>
                {uploadStats && (
                  <div className="mt-2 text-sm text-green-600">
                    <p>NPL: {uploadStats.nplKanwil} kanwil, {uploadStats.nplCabang} cabang</p>
                    <p>KOL2: {uploadStats.kol2Kanwil} kanwil, {uploadStats.kol2Cabang} cabang</p>
                    <p>Realisasi Harian: {uploadStats.realisasiDays} hari</p>
                    <p>Realisasi Kredit: {uploadStats.realisasiKreditKanwil} kanwil, {uploadStats.realisasiKreditCabang} cabang</p>
                    <p>Posisi Kredit: {uploadStats.posisiKreditKanwil} kanwil, {uploadStats.posisiKreditCabang} cabang</p>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Data Status</h2>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">NPL</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.npl ? formatDate(currentData.npl.uploadDate) : 'No data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">KOL 2</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.kol2 ? formatDate(currentData.kol2.uploadDate) : 'No data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">Realisasi Harian</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.realisasi ? formatDate(currentData.realisasi.uploadDate) : 'No data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">Realisasi Kredit</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.realisasi_kredit ? formatDate(currentData.realisasi_kredit.uploadDate) : 'No data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">Posisi Kredit</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.posisi_kredit ? formatDate(currentData.posisi_kredit.uploadDate) : 'No data'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Upload Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Data Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-medium">{formatDate(item.uploadDate)}</td>
                      <td className="py-3 px-4 text-gray-700">{item.monthInfo?.current?.fullLabel || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{item.files?.join(', ') || '-'}</td>
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
