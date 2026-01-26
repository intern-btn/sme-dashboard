'use client'

import { useState, useEffect } from 'react'

export function useAutoSlide({ onNext, interval = 30000, disabled = false }) {
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autoSlideEnabled')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })
  const [isPaused, setIsPaused] = useState(false)
  const [countdown, setCountdown] = useState(Math.floor(interval / 1000))

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('autoSlideEnabled', isEnabled.toString())
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled || isPaused || disabled) return

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onNext()
          return Math.floor(interval / 1000)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [isEnabled, isPaused, onNext, interval, disabled])

  // Listen for Enter key to pause/resume (only when enabled)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && isEnabled) {
        setIsPaused(prev => !prev)
        setCountdown(Math.floor(interval / 1000))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [interval, isEnabled])

  const toggleEnabled = () => {
    setIsEnabled(prev => !prev)
    setIsPaused(false)
    setCountdown(Math.floor(interval / 1000))
  }

  return { isEnabled, isPaused, countdown, toggleEnabled }
}
