'use client'

export default function ModeToggle({ mode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-gray-300 px-3 py-2 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all"
      title={mode === 'tv' ? 'Switch to Browser Mode' : 'Switch to TV Mode'}
    >
      <span className="text-lg">{mode === 'tv' ? '📺' : '💻'}</span>
      <span className="font-medium text-gray-700">
        {mode === 'tv' ? 'TV Mode' : 'Browser'}
      </span>
      <span className="text-gray-400">|</span>
      <span className="text-xs text-blue-600 hover:text-blue-800">
        Switch
      </span>
    </button>
  )
}
