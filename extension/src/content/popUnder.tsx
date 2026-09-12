import { useState, useEffect, useRef } from 'react'
import type { PopUnderState } from '../components/types'
import voxaLogoUrl from '../assets/logo.png'

interface PopUnderProps {
  state: PopUnderState
  errorMessage?: string
  targetRect: DOMRect | null
  targetElement: Element | null
  onDictationAction: () => void
}

export function PopUnder({ state, errorMessage, targetRect, targetElement, onDictationAction }: PopUnderProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!targetRect || !targetElement) return

    const popWidth = 240
    const popHeight = state === 'idle' ? 44 : 52
    const gap = 4

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      let top = rect.bottom + gap
      let left = rect.left + (rect.width / 2) - (popWidth / 2)

    // Keep within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

      if (left < 8) left = 8
      if (left + popWidth > viewportWidth - 8) left = viewportWidth - popWidth - 8
      if (top + popHeight > viewportHeight - 8) top = rect.top - popHeight - gap
      if (top < 8) top = 8

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [targetRect, targetElement, state])

  if (!position) return null

  const getStateContent = () => {
    switch (state) {
      case 'idle':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon">
              <img src={voxaLogoUrl} alt="Voxa" className="pop-under-logo" draggable={false} />
            </span>
            <div className="pop-under-text">
              <span className="pop-under-label">Click to dictate with Voxa</span>
              <span className="pop-under-shortcut">or use Alt + Shift + D</span>
            </div>
          </div>
        )
      case 'listening':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon listening-dot">
              <span className="pulse-ring"></span>
              <span className="pulse-ring"></span>
              <span className="state-dot recording"></span>
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
            <span className="pop-under-icon">
              <span className="state-dot transcribing"></span>
            </span>
            <div className="pop-under-text">
              <span className="pop-under-label">Transcribing...</span>
            </div>
          </div>
        )
      case 'success':
        return (
          <div className="pop-under-content">
            <span className="pop-under-icon">
              <span className="state-dot success"></span>
            </span>
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
      role="button"
      tabIndex={0}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onDictationAction}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onDictationAction()
        }
      }}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {getStateContent()}
    </div>
  )
}
