import { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

function Popup() {
  const [enabled, setEnabled] = useState(true)
  const [language, setLanguage] = useState('en')
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'nl', label: 'Dutch' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
  ]

  useEffect(() => {
    chrome.storage.local.get(['voxaEnabled', 'voxaLanguage'], (result) => {
      if (result.voxaEnabled !== undefined) setEnabled(result.voxaEnabled)
      if (result.voxaLanguage) setLanguage(result.voxaLanguage)
    })
  }, [])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  const toggleEnabled = () => {
    const newValue = !enabled
    setEnabled(newValue)
    chrome.storage.local.set({ voxaEnabled: newValue })
  }

  const selectedLanguage = languages.find(item => item.value === language) || languages[0]

  const selectLanguage = (value: string) => {
    setLanguage(value)
    setLanguageMenuOpen(false)
    chrome.storage.local.set({ voxaLanguage: value })
  }

  const handleLanguageKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!languageMenuOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      setLanguageMenuOpen(true)
      return
    }
    if (!languageMenuOpen) return
    const currentIndex = languages.findIndex(item => item.value === language)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const nextIndex = (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + languages.length) % languages.length
      selectLanguage(languages[nextIndex].value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setLanguageMenuOpen(false)
    }
  }

  return (
    <div className="popup">
      <div className="popup-header">
        <h1 className="popup-title">VOXA</h1>
        <p className="popup-tagline">Turn every text box<br />into a microphone.</p>
      </div>

      <div className="popup-status">
        <div className={`status-dot${enabled ? '' : ' disconnected'}`} />
        <span className="status-text">{enabled ? 'Ready' : 'Disconnected'}</span>
      </div>

      <div className="popup-section">
        <label className="popup-label">Language</label>
        <div className="popup-select-wrapper" ref={languageMenuRef}>
          <button
            type="button"
            className="popup-select"
            aria-haspopup="listbox"
            aria-expanded={languageMenuOpen}
            onClick={() => setLanguageMenuOpen(open => !open)}
            onKeyDown={handleLanguageKeyDown}
          >
            <span>{selectedLanguage.label}</span>
            <span className="popup-select-arrow" aria-hidden="true">⌄</span>
          </button>
          {languageMenuOpen && (
            <div className="popup-language-menu" role="listbox" aria-label="Language">
              {languages.map(item => (
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
        <a href="#" className="popup-link" onClick={(e) => e.preventDefault()}>
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
