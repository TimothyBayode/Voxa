import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'
import voxaWordmarkUrl from '../assets/logo.svg'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'tr', label: 'Turkish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'da', label: 'Danish' },
  { value: 'fi', label: 'Finnish' },
  { value: 'hi', label: 'Hindi' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'he', label: 'Hebrew' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ur', label: 'Urdu' },
  { value: 'zh', label: 'Mandarin' },
]

function Popup() {
  const [enabled, setEnabled] = useState(true)
  const [language, setLanguage] = useState('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chrome.storage.local.get(['voxaEnabled', 'voxaLanguage'], (result) => {
      if (result.voxaEnabled !== undefined) setEnabled(result.voxaEnabled)
      if (result.voxaLanguage) setLanguage(result.voxaLanguage)
    })
  }, [])

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [])

  const toggleEnabled = () => {
    const newValue = !enabled
    setEnabled(newValue)
    chrome.storage.local.set({ voxaEnabled: newValue })
  }

  const selectLanguage = (value: string) => {
    setLanguage(value)
    setMenuOpen(false)
    chrome.storage.local.set({ voxaLanguage: value })
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!menuOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setMenuOpen(true)
      }
      return
    }
    const currentIndex = LANGUAGES.findIndex((item) => item.value === language)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const nextIndex = (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + LANGUAGES.length) % LANGUAGES.length
      selectLanguage(LANGUAGES[nextIndex].value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setMenuOpen(false)
    }
  }

  const selectedLanguage = LANGUAGES.find((item) => item.value === language) || LANGUAGES[0]

  return (
    <div className="popup">
      <div className="popup-header">
        <img src={voxaWordmarkUrl} alt="VOXA" className="popup-title-logo" draggable={false} />
        <p className="popup-tagline">Turn every text box into a microphone.</p>
      </div>

      <div className="popup-status">
        <div className={`status-dot${enabled ? '' : ' disconnected'}`} />
        <span className="status-text">{enabled ? 'Ready' : 'Disconnected'}</span>
      </div>

      <div className="popup-section">
        <label className="popup-label">Language</label>
        <div className="popup-select-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="popup-select"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            onKeyDown={handleTriggerKeyDown}
          >
            <span>{selectedLanguage.label}</span>
            <svg
              className="popup-select-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {menuOpen && (
            <div className="popup-language-menu" role="listbox" aria-label="Language">
              {LANGUAGES.map((item) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={item.value === language}
                  className={`popup-language-option${item.value === language ? ' selected' : ''}`}
                  key={item.value}
                  onClick={() => selectLanguage(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="popup-section">
        <div className="popup-label">Keyboard shortcut</div>
        <div className="popup-shortcut">Alt + Shift + D</div>
      </div>

      <div className="popup-divider" />

      <div className="popup-section">
        <label className="popup-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggleEnabled}
          />
          <span className="toggle-slider" />
          <span className="toggle-label">Enable Voxa</span>
        </label>
      </div>

      <div className="popup-footer">
        <a
          href="https://github.com/TimothyBayode/Voxa"
          className="popup-link"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault()
            chrome.tabs.create({ url: 'https://github.com/TimothyBayode/Voxa' })
          }}
        >
          Documentation
        </a>
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}
