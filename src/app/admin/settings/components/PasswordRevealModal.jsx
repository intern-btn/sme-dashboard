'use client'

import { useState } from 'react'

export default function PasswordRevealModal({ username, password, context, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(password)
      } else {
        // Fallback for HTTP (non-secure) contexts where Clipboard API is unavailable
        const el = document.createElement('textarea')
        el.value = password
        el.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // copy still failed; user can select the field manually
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-900">
            {context === 'created' ? 'Pengguna Berhasil Dibuat' : 'Password Berhasil Direset'}
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            ⚠️ Password ini hanya ditampilkan <strong>SATU KALI</strong>. Salin dan berikan kepada <strong>{username}</strong> sekarang — setelah modal ini ditutup, password tidak dapat ditampilkan lagi.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Sementara</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={password}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 select-all"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                {copied ? '✓ Disalin' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Pengguna akan diminta mengganti password ini saat pertama kali login.
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#003d7a' }}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
