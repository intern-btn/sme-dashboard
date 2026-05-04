'use client'

const SORT_ICON = '↕'

export function Th({ label, onSort = null, right = false }) {
  return (
    <th
      className={`px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
        right ? 'text-right' : 'text-left'
      }`}
    >
      <div className={`flex items-center gap-1 ${right ? 'justify-end' : ''}`}>
        <span>{label}</span>
        {onSort && (
          <button type="button" onClick={onSort} className="text-gray-400 hover:text-gray-600">
            {SORT_ICON}
          </button>
        )}
      </div>
    </th>
  )
}

export function setSortBy(setSort, sort, key) {
  setSort((prev) => {
    if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    return { key, dir: 'desc' }
  })
}
