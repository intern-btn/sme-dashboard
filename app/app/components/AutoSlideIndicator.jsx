'use client'

export default function AutoSlideIndicator({ isEnabled, isPaused, countdown, onToggle }) {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={onToggle}
        className={`
          px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm
          transition-all duration-300 text-xs cursor-pointer
          hover:scale-105 active:scale-95
          ${!isEnabled
            ? 'bg-gray-500/95 text-white border border-gray-600'
            : isPaused
              ? 'bg-yellow-500/95 text-yellow-900 border border-yellow-600'
              : 'bg-primary/95 text-white border border-primary'
          }
        `}
        title={isEnabled ? 'Click to disable auto-slide' : 'Click to enable auto-slide'}
      >
        <div className="flex items-center gap-2">
          {!isEnabled ? (
            <>
              <span className="text-lg">⏹️</span>
              <div>
                <div className="font-semibold">Auto-slide Off</div>
                <div className="text-[10px] opacity-80">
                  Click to enable
                </div>
              </div>
            </>
          ) : isPaused ? (
            <>
              <span className="text-lg">⏸️</span>
              <div>
                <div className="font-semibold">Paused</div>
                <div className="text-[10px] opacity-80">
                  Enter to resume
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-lg">▶️</span>
              <div>
                <div className="font-semibold">Auto-slide</div>
                <div className="text-[10px] opacity-80">
                  Next in {countdown}s
                </div>
              </div>
            </>
          )}
        </div>
      </button>
    </div>
  )
}
