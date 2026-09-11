import { useState, useEffect, useRef } from 'react'
import type { PopUnderState } from '../components/types'

interface PopUnderProps {
  state: PopUnderState
  errorMessage?: string
  targetRect: DOMRect | null
  onStopDictation: () => void
}

export function PopUnder({ state, errorMessage, targetRect, onStopDictation }: PopUnderProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!targetRect) return

    const popWidth = 240
    const popHeight = state === 'idle' ? 44 : 52
    const gap = 4

    let top = targetRect.bottom + gap
    let left = targetRect.left + (targetRect.width / 2) - (popWidth / 2)

    // Keep within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < 8) left = 8
    if (left + popWidth > viewportWidth - 8) left = viewportWidth - popWidth - 8
    if (top + popHeight > viewportHeight - 8) top = targetRect.top - popHeight - gap
    if (top < 8) top = 8

    setPosition({ top, left })
  }, [targetRect, state])

  useEffect(() => {
    if (state === 'listening') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey && e.shiftKey && e.key === 'd') {
          e.preventDefault()
          e.stopPropagation()
          onStopDictation()
        }
      }
      document.addEventListener('keydown', handleKeyDown, true)
      return () => document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [state, onStopDictation])

  if (!position) return null

  const getStateContent = () => {
    switch (state) {
      case 'idle':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon">🎙</span>
            <div className="pop-under-text">
              <span className="pop-under-label">Dictate with Voxa</span>
              <span className="pop-under-shortcut">Alt + Shift + D</span>
            </div>
          </div>
        )
      case 'listening':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon listening-dot">
              <span className="pulse-ring"></span>
              <span className="pulse-ring"></span>
              <span className="mic-icon">🔴</span>
            </span>
            <div className="pop-under-text">
              <span className="pop-under-label">Listening...</span>
              <span className="pop-under-shortcut">Alt + Shift + D to stop</span>
            </div>
          </div>
        )
      case 'processing':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon processing-icon">✨</span>
            <div className="pop-under-text">
              <span className="pop-under-label">Transcribing...</span>
            </div>
          </div>
        )
      case 'success':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon success-icon">✓</span>
            <div className="pop-under-text">
              <span className="pop-under-label">Added to field</span>
            </div>
          </div>
        )
      case 'error':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon error-icon">!</span>
            <div className="pop-under-text">
              <span className="pop-under-label">{errorMessage || 'Couldn\'t transcribe. Try again.'}</span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={popRef}
      className="pop-under"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {getStateContent()}
    </div>
  )
}
