'use client'

import { useState, useEffect } from 'react'

export function useAutoSlide({ onNext, interval = 30000, disabled = false }) {
  const [isEnabled, setIsEnabled] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [countdown, setCountdown] = useState(Math.floor(interval / 1000))
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('autoSlideEnabled')
    if (saved !== null) {
      setIsEnabled(saved === 'true')
    }
    setIsHydrated(true)
  }, [])

  // Save preference to localStorage
  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem('autoSlideEnabled', isEnabled.toString())
  }, [isEnabled, isHydrated])

  useEffect(() => {
    if (!isHydrated || !isEnabled || isPaused || disabled) return

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
  }, [isEnabled, isPaused, onNext, interval, disabled, isHydrated])

  // Listen for Enter key to pause/resume (only when enabled)
  useEffect(() => {
    if (!isHydrated) return

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && isEnabled) {
        setIsPaused(prev => !prev)
        setCountdown(Math.floor(interval / 1000))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [interval, isEnabled, isHydrated])

  const toggleEnabled = () => {
    setIsEnabled(prev => !prev)
    setIsPaused(false)
    setCountdown(Math.floor(interval / 1000))
  }

  return { isEnabled, isPaused, countdown, toggleEnabled, isHydrated }
}
