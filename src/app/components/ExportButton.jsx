'use client'

import { useState } from 'react'

export default function ExportButton({
  onClick,
  variant = 'primary',
  label = 'Export PDF',
  className = ''
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onClick()
    } catch (err) {
      setError(err.message || 'Export gagal')
      // Auto-dismiss error after 3 seconds
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const baseStyles = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-[#003d7a] hover:bg-[#002d5a] text-white',
    secondary: 'border-2 border-[#003d7a] text-[#003d7a] hover:bg-[#003d7a] hover:text-white'
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      >
        {isLoading ? (
          // Spinner
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          // PDF Icon
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6M9 17h4" />
          </svg>
        )}
        {isLoading ? 'Mengekspor...' : label}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-red-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
          {error}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-red-500 rotate-45" />
        </div>
      )}
    </div>
  )
}
