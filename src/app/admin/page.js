'use client'

import { useState, useEffect } from 'react'
import AppHeader from '../components/AppHeader'


export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [nplFile, setNplFile] = useState(null)
  const [kol2File, setKol2File] = useState(null)
  const [realisasiFile, setRealisasiFile] = useState(null)
  const [realisasiKreditFile, setRealisasiKreditFile] = useState(null)
  const [posisiKreditFile, setPosisiKreditFile] = useState(null)
  const [multiSheetFile, setMultiSheetFile] = useState(null)
  const [spbuIdasFile, setSpbuIdasFile] = useState(null)
  const [spbuManualFile, setSpbuManualFile] = useState(null)
  const [uploadMode, setUploadMode] = useState('separate') // 'separate' | 'multi'
  const [activeTab, setActiveTab] = useState('monitoring') // 'monitoring' | 'spbu' | 'bpjs' | 'indomaret'
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('') // 'uploading' | 'processing' | ''
  const [spbuUploading, setSpbuUploading] = useState(false)
  const [spbuStep, setSpbuStep] = useState('') // 'uploading' | 'processing' | ''
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [spbuMessage, setSpbuMessage] = useState('')
  const [spbuError, setSpbuError] = useState('')
  const [uploadStats, setUploadStats] = useState(null)
  const [spbuStats, setSpbuStats] = useState(null)
  const [bpjsIdasFile, setBpjsIdasFile] = useState(null)
  const [bpjsManualFile, setBpjsManualFile] = useState(null)
  const [bpjsUploading, setBpjsUploading] = useState(false)
  const [bpjsStep, setBpjsStep] = useState('') // 'uploading' | 'processing' | ''
  const [bpjsMessage, setBpjsMessage] = useState('')
  const [bpjsError, setBpjsError] = useState('')
  const [bpjsStats, setBpjsStats] = useState(null)
  const [indomaretIdasFile, setIndomaretIdasFile] = useState(null)
  const [indomaretManualFile, setIndomaretManualFile] = useState(null)
  const [indomaretUploading, setIndomaretUploading] = useState(false)
  const [indomaretStep, setIndomaretStep] = useState('')
  const [indomaretMessage, setIndomaretMessage] = useState('')
  const [indomaretError, setIndomaretError] = useState('')
  const [indomaretStats, setIndomaretStats] = useState(null)
  const [currentData, setCurrentData] = useState({ npl: null, kol2: null, realisasi: null, realisasi_kredit: null, posisi_kredit: null, prk_spbu: null, bpjs: null, indomaret: null })
  const [history, setHistory] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => {
        fetchCurrentStatus()
        fetchHistory()
      })
  }, [])

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
      setUploadStep('')
    }
  }

  const handleMultiSheetUpload = async () => {
    if (!multiSheetFile) {
      setError('Pilih file Excel multi-sheet')
      return
    }

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
    setUploadStep('uploading')

    try {
      let processResponse

      if (process.env.NEXT_PUBLIC_USE_DIRECT_UPLOAD === 'true') {
        const { upload } = await import('@vercel/blob/client')
        const blob = await upload(multiSheetFile.name, multiSheetFile, {
          access: 'public',
          handleUploadUrl: '/api/upload/token',
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            setUploadProgress(percent)
          }
        })
        setUploadStep('processing')
        processResponse = await fetch('/api/upload/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobUrl: blob.url })
        })
      } else {
        const formData = new FormData()
        formData.append('file', multiSheetFile)
        setUploadStep('processing')
        processResponse = await fetch('/api/upload/process', {
          method: 'POST',
          body: formData
        })
      }

      const result = await processResponse.json()

      if (!processResponse.ok) {
        throw new Error(result.error || result.details || 'Processing failed')
      }

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
      setUploadStep('')
    }
  }

  const handleUpload = async () => {
    if (uploadMode === 'multi') {
      await handleMultiSheetUpload()
    } else {
      await handleSeparateFilesUpload()
    }
  }

  const handleSPBUUpload = async () => {
    if (!spbuIdasFile && !spbuManualFile) { setSpbuError('Pilih minimal 1 file (IDAS atau Master)'); return }
    setSpbuUploading(true); setSpbuMessage(''); setSpbuError(''); setSpbuStats(null); setSpbuStep('parsing')

    const worker = new Worker(new URL('../../lib/workers/spbu-parser.worker.js', import.meta.url))

    worker.onmessage = async (e) => {
      const msg = e.data
      if (msg.progress) { setSpbuStep(msg.progress); return }
      if (msg.error) {
        setSpbuError(msg.error)
        setSpbuUploading(false)
        setSpbuStep('')
        worker.terminate()
        return
      }
      if (msg.done) {
        worker.terminate()
        setSpbuStep('saving')
        try {
          const res = await fetch('/api/upload/process-spbu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parsedIdas: msg.parsedIdas,
              parsedManual: msg.parsedManual,
              idasFilename: spbuIdasFile?.name || 'IDAS_PRK_SPBU.xlsx',
              manualFilename: spbuManualFile?.name || 'ref_PRK_SPBU.xlsx',
              idasDate: msg.idasDate,
            }),
          })
          const result = await res.json()
          if (!res.ok) throw new Error(result.error || result.details || 'Upload failed')
          setSpbuMessage(result.manualOnly ? 'Master Monitoring SPBU berhasil diupload!' : 'Data PRK SPBU berhasil diproses!')
          setSpbuStats(result)
          setSpbuIdasFile(null); setSpbuManualFile(null)
          const ii = document.getElementById('spbu-idas-file'); if (ii) ii.value = ''
          const mi = document.getElementById('spbu-manual-file'); if (mi) mi.value = ''
          setTimeout(() => { fetchCurrentStatus(); fetchHistory() }, 1000)
        } catch (err) {
          setSpbuError(err.message)
        } finally {
          setSpbuUploading(false)
          setSpbuStep('')
        }
      }
    }

    const idasBuffer = spbuIdasFile ? await spbuIdasFile.arrayBuffer() : null
    const manualBuffer = spbuManualFile ? await spbuManualFile.arrayBuffer() : null
    worker.postMessage({ idasBuffer, manualBuffer, idasFilename: spbuIdasFile?.name }, [
      ...(idasBuffer ? [idasBuffer] : []),
      ...(manualBuffer ? [manualBuffer] : []),
    ])
  }

  const handleBPJSUpload = async () => {
    if (!bpjsIdasFile && !bpjsManualFile) { setBpjsError('Pilih minimal 1 file (IDAS atau Master)'); return }
    setBpjsUploading(true); setBpjsMessage(''); setBpjsError(''); setBpjsStats(null); setBpjsStep('parsing')

    const worker = new Worker(new URL('../../lib/workers/bpjs-parser.worker.js', import.meta.url))

    worker.onmessage = async (e) => {
      const msg = e.data
      if (msg.progress) { setBpjsStep(msg.progress); return }
      if (msg.error) {
        setBpjsError(msg.error)
        setBpjsUploading(false)
        setBpjsStep('')
        worker.terminate()
        return
      }
      if (msg.done) {
        worker.terminate()
        setBpjsStep('saving')
        try {
          const res = await fetch('/api/upload/process-bpjs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parsedIdas: msg.parsedIdas,
              parsedManual: msg.parsedManual,
              idasFilename: bpjsIdasFile?.name || 'IDAS_BPJS.xlsx',
              manualFilename: bpjsManualFile?.name || 'ref_BPJS.xlsx',
              idasDate: msg.idasDate,
            }),
          })
          const result = await res.json()
          if (!res.ok) throw new Error(result.error || result.details || 'Upload failed')
          setBpjsMessage(result.manualOnly ? 'Master Monitoring BPJS berhasil diupload!' : 'Data BPJS berhasil diproses!')
          setBpjsStats(result)
          setBpjsIdasFile(null); setBpjsManualFile(null)
          const ii = document.getElementById('bpjs-idas-file'); if (ii) ii.value = ''
          const mi = document.getElementById('bpjs-manual-file'); if (mi) mi.value = ''
          setTimeout(() => { fetchCurrentStatus(); fetchHistory() }, 1000)
        } catch (err) {
          setBpjsError(err.message)
        } finally {
          setBpjsUploading(false)
          setBpjsStep('')
        }
      }
    }

    const idasBuffer = bpjsIdasFile ? await bpjsIdasFile.arrayBuffer() : null
    const manualBuffer = bpjsManualFile ? await bpjsManualFile.arrayBuffer() : null
    worker.postMessage({ idasBuffer, manualBuffer, idasFilename: bpjsIdasFile?.name }, [
      ...(idasBuffer ? [idasBuffer] : []),
      ...(manualBuffer ? [manualBuffer] : []),
    ])
  }

  const handleIndomaretUpload = async () => {
    if (!indomaretIdasFile && !indomaretManualFile) { setIndomaretError('Pilih minimal 1 file (IDAS atau Master)'); return }
    setIndomaretUploading(true); setIndomaretMessage(''); setIndomaretError(''); setIndomaretStats(null); setIndomaretStep('parsing')

    const worker = new Worker(new URL('../../lib/workers/indomaret-parser.worker.js', import.meta.url))

    worker.onmessage = async (e) => {
      const msg = e.data
      if (msg.progress) { setIndomaretStep(msg.progress); return }
      if (msg.error) {
        setIndomaretError(msg.error)
        setIndomaretUploading(false)
        setIndomaretStep('')
        worker.terminate()
        return
      }
      if (msg.done) {
        worker.terminate()
        setIndomaretStep('saving')
        try {
          const res = await fetch('/api/upload/process-indomaret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parsedIdas: msg.parsedIdas,
              parsedManual: msg.parsedManual,
              idasFilename: indomaretIdasFile?.name || 'IDAS_INDOMARET.xlsx',
              manualFilename: indomaretManualFile?.name || 'ref_Indomaret.xlsx',
              idasDate: msg.idasDate,
            }),
          })
          const result = await res.json()
          if (!res.ok) throw new Error(result.error || result.details || 'Upload failed')
          setIndomaretMessage(result.manualOnly ? 'Master Monitoring Indomaret berhasil diupload!' : 'Data Indomaret berhasil diproses!')
          setIndomaretStats(result)
          setIndomaretIdasFile(null); setIndomaretManualFile(null)
          const ii = document.getElementById('indomaret-idas-file'); if (ii) ii.value = ''
          const mi = document.getElementById('indomaret-manual-file'); if (mi) mi.value = ''
          setTimeout(() => { fetchCurrentStatus(); fetchHistory() }, 1000)
        } catch (err) {
          setIndomaretError(err.message)
        } finally {
          setIndomaretUploading(false)
          setIndomaretStep('')
        }
      }
    }

    const idasBuffer = indomaretIdasFile ? await indomaretIdasFile.arrayBuffer() : null
    const manualBuffer = indomaretManualFile ? await indomaretManualFile.arrayBuffer() : null
    worker.postMessage({ idasBuffer, manualBuffer, idasFilename: indomaretIdasFile?.name }, [
      ...(idasBuffer ? [idasBuffer] : []),
      ...(manualBuffer ? [manualBuffer] : []),
    ])
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

  // Login Screen (deprecated)
  if (false) {
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
            <a href="/" className="text-blue-900 hover:underline font-medium">â† Return to Dashboard</a>
          </div>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />
      <div className="p-4 sm:p-6 lg:p-8">
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
                href="/monitoring"
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors font-medium text-xs sm:text-sm border border-blue-900 text-center"
              >
                View Dashboard
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('monitoring')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'monitoring'
                    ? 'bg-white text-blue-900 border-b-2 border-blue-900'
                    : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Credit Monitoring
              </button>
              <button
                onClick={() => setActiveTab('spbu')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'spbu'
                    ? 'bg-white text-blue-900 border-b-2 border-blue-900'
                    : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                PRK SPBU
              </button>
              <button
                onClick={() => setActiveTab('bpjs')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'bpjs'
                    ? 'bg-white text-blue-900 border-b-2 border-blue-900'
                    : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                BPJS
              </button>
              <button
                onClick={() => setActiveTab('indomaret')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'indomaret'
                    ? 'bg-white text-blue-900 border-b-2 border-blue-900'
                    : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Indomaret
              </button>
            </div>

            <div className="p-6">
            {activeTab === 'monitoring' && (<>

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
                    <li>â€¢ <strong>22a</strong> - Realisasi Harian</li>
                    <li>â€¢ <strong>44a1</strong> - Realisasi Kredit</li>
                    <li>â€¢ <strong>44b</strong> - Posisi Kredit</li>
                    <li>â€¢ <strong>49b</strong> - KOL 2</li>
                    <li>â€¢ <strong>49c</strong> - NPL</li>
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

            <button
              onClick={handleUpload}
              disabled={uploading || (uploadMode === 'multi' ? !multiSheetFile : (!nplFile && !kol2File && !realisasiFile && !realisasiKreditFile && !posisiKreditFile))}
              className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                uploading || (uploadMode === 'multi' ? !multiSheetFile : (!nplFile && !kol2File && !realisasiFile && !realisasiKreditFile && !posisiKreditFile))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {uploading ? 'Memproses...' : 'Upload & Process'}
            </button>

            {uploading && (() => {
              const steps = [
                { key: 'uploading', label: 'Mengunggah file', pct: Math.round(uploadProgress * 0.9) || 5 },
                { key: 'processing', label: 'Memproses di server', pct: 95 },
              ]
              const currentIdx = steps.findIndex(s => s.key === uploadStep)
              const barPct = currentIdx === -1 ? 5 : steps[currentIdx].pct
              return (
                <div className="mt-4 space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-900 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    {steps.map((s, i) => {
                      const done = currentIdx > i
                      const active = currentIdx === i
                      return (
                        <div key={s.key} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                            ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {done ? '✓' : i + 1}
                          </div>
                          <span className={`text-sm flex items-center gap-2 ${active ? 'text-blue-900 font-semibold' : done ? 'text-green-700' : 'text-gray-400'}`}>
                            {s.label}
                            {active && s.key === 'uploading' && uploadProgress > 0 && <span className="text-blue-700 font-normal">{uploadProgress}%</span>}
                            {active && <span className="inline-block w-3 h-3 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

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

            </>)}

            {activeTab === 'spbu' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File IDAS PRK (.xlsx) — wajib untuk upload harian</label>
                  <input
                    id="spbu-idas-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setSpbuIdasFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {spbuIdasFile && <p className="mt-1 text-sm text-green-600">{spbuIdasFile.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Master Monitoring SPBU (.xlsx)</label>
                  <input
                    id="spbu-manual-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setSpbuManualFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 border-l-2 border-gray-200 pl-3">
                    Upload master file hanya perlu diupload ulang jika ada perubahan data debitur.
                  </p>
                  {spbuManualFile && <p className="mt-1 text-sm text-green-600">{spbuManualFile.name}</p>}
                </div>

                <button
                  onClick={handleSPBUUpload}
                  disabled={spbuUploading || (!spbuIdasFile && !spbuManualFile)}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    spbuUploading || (!spbuIdasFile && !spbuManualFile) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {spbuUploading ? 'Memproses...' : 'Upload PRK SPBU'}
                </button>

                {spbuUploading && (() => {
                  const steps = [
                    { key: 'parsing', label: 'Membaca dan memproses file', pct: 65 },
                    { key: 'saving', label: 'Menyimpan data', pct: 95 },
                  ]
                  const currentIdx = steps.findIndex(s => s.key === spbuStep)
                  const barPct = currentIdx === -1 ? 5 : steps[currentIdx].pct
                  return (
                    <div className="space-y-3 pt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-900 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <div className="space-y-2">
                        {steps.map((s, i) => {
                          const done = currentIdx > i
                          const active = currentIdx === i
                          return (
                            <div key={s.key} className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {done ? '✓' : i + 1}
                              </div>
                              <span className={`text-sm flex items-center gap-2 ${active ? 'text-blue-900 font-semibold' : done ? 'text-green-700' : 'text-gray-400'}`}>
                                {s.label}
                                {active && <span className="inline-block w-3 h-3 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {spbuMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">{spbuMessage}</p>
                    {spbuStats?.idasDate && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>IDAS Date: {spbuStats.idasDate}</p>
                        {spbuStats.stats?.masterTotal != null && (
                          <p>Ditemukan di IDAS: {spbuStats.stats.idasFound} / {spbuStats.stats.masterTotal} debitur</p>
                        )}
                        <p>Total Baki Debet: Rp {new Intl.NumberFormat('id-ID').format(spbuStats.stats?.totalBakiDebet || 0)}</p>
                      </div>
                    )}
                  </div>
                )}

                {spbuError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{spbuError}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bpjs' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File IDAS BPJS (.xlsx) — wajib untuk upload harian</label>
                  <input
                    id="bpjs-idas-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBpjsIdasFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {bpjsIdasFile && <p className="mt-1 text-sm text-green-600">{bpjsIdasFile.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Master Monitoring BPJS (.xlsx)</label>
                  <input
                    id="bpjs-manual-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBpjsManualFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 border-l-2 border-gray-200 pl-3">
                    Upload master file hanya perlu diupload ulang jika ada perubahan data debitur.
                  </p>
                  {bpjsManualFile && <p className="mt-1 text-sm text-green-600">{bpjsManualFile.name}</p>}
                </div>

                <button
                  onClick={handleBPJSUpload}
                  disabled={bpjsUploading || (!bpjsIdasFile && !bpjsManualFile)}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    bpjsUploading || (!bpjsIdasFile && !bpjsManualFile) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {bpjsUploading ? 'Memproses...' : 'Upload BPJS'}
                </button>

                {bpjsUploading && (() => {
                  const steps = [
                    { key: 'parsing', label: 'Membaca dan memproses file', pct: 65 },
                    { key: 'saving', label: 'Menyimpan data', pct: 95 },
                  ]
                  const currentIdx = steps.findIndex(s => s.key === bpjsStep)
                  const barPct = currentIdx === -1 ? 5 : steps[currentIdx].pct
                  return (
                    <div className="space-y-3 pt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${barPct}%` }} />
                      </div>
                      <div className="space-y-2">
                        {steps.map((s, i) => {
                          const done = currentIdx > i
                          const active = currentIdx === i
                          return (
                            <div key={s.key} className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {done ? '✓' : i + 1}
                              </div>
                              <span className={`text-sm flex items-center gap-2 ${active ? 'text-blue-900 font-semibold' : done ? 'text-green-700' : 'text-gray-400'}`}>
                                {s.label}
                                {active && <span className="inline-block w-3 h-3 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {bpjsMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">{bpjsMessage}</p>
                    {bpjsStats?.idasDate && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>IDAS Date: {bpjsStats.idasDate}</p>
                        {bpjsStats.stats?.masterTotal != null && (
                          <p>Ditemukan di IDAS: {bpjsStats.stats.idasFound} / {bpjsStats.stats.masterTotal} debitur</p>
                        )}
                        <p>Total Baki Debet: Rp {new Intl.NumberFormat('id-ID').format(bpjsStats.stats?.totalBakiDebet || 0)}</p>
                      </div>
                    )}
                  </div>
                )}

                {bpjsError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{bpjsError}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'indomaret' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File IDAS Indomaret (.xlsx) — wajib untuk upload harian</label>
                  <input
                    id="indomaret-idas-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setIndomaretIdasFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {indomaretIdasFile && <p className="mt-1 text-sm text-green-600">{indomaretIdasFile.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Master Monitoring Indomaret (.xlsx)</label>
                  <input
                    id="indomaret-manual-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setIndomaretManualFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 border-l-2 border-gray-200 pl-3">
                    Upload master file hanya perlu diupload ulang jika ada perubahan data debitur.
                  </p>
                  {indomaretManualFile && <p className="mt-1 text-sm text-green-600">{indomaretManualFile.name}</p>}
                </div>

                <button
                  onClick={handleIndomaretUpload}
                  disabled={indomaretUploading || (!indomaretIdasFile && !indomaretManualFile)}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    indomaretUploading || (!indomaretIdasFile && !indomaretManualFile) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {indomaretUploading ? 'Memproses...' : 'Upload Indomaret'}
                </button>

                {indomaretUploading && (() => {
                  const steps = [
                    { key: 'parsing', label: 'Membaca dan memproses file', pct: 65 },
                    { key: 'saving', label: 'Menyimpan data', pct: 95 },
                  ]
                  const currentIdx = steps.findIndex(s => s.key === indomaretStep)
                  const barPct = currentIdx === -1 ? 5 : steps[currentIdx].pct
                  return (
                    <div className="space-y-3 pt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${barPct}%` }} />
                      </div>
                      <div className="space-y-2">
                        {steps.map((s, i) => {
                          const done = currentIdx > i
                          const active = currentIdx === i
                          return (
                            <div key={s.key} className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {done ? '✓' : i + 1}
                              </div>
                              <span className={`text-sm flex items-center gap-2 ${active ? 'text-blue-900 font-semibold' : done ? 'text-green-700' : 'text-gray-400'}`}>
                                {s.label}
                                {active && <span className="inline-block w-3 h-3 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {indomaretMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">{indomaretMessage}</p>
                    {indomaretStats?.idasDate && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>IDAS Date: {indomaretStats.idasDate}</p>
                        {indomaretStats.stats?.masterTotal != null && (
                          <p>Ditemukan di IDAS: {indomaretStats.stats.idasFound} / {indomaretStats.stats.masterTotal} debitur</p>
                        )}
                        <p>Total Baki Debet: Rp {new Intl.NumberFormat('id-ID').format(indomaretStats.stats?.totalBakiDebet || 0)}</p>
                      </div>
                    )}
                  </div>
                )}

                {indomaretError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{indomaretError}</p>
                  </div>
                )}
              </div>
            )}

            </div>
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

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">PRK SPBU</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.prk_spbu ? formatDate(currentData.prk_spbu.uploadDate) : 'No data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">BPJS</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.bpjs ? formatDate(currentData.bpjs.uploadDate) : 'No data'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-medium text-gray-900">Indomaret</div>
                <div className="text-xs text-gray-600 mt-1">
                  {currentData.indomaret ? formatDate(currentData.indomaret.uploadDate) : 'No data'}
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
    </div>
  )
}
