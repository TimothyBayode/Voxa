import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'
import voxaWordmarkUrl from '../assets/logo.svg'

const LANGUAGES = [
  { value: 'af', label: 'Afrikaans' },
  { value: 'sq', label: 'Albanian' },
  { value: 'am', label: 'Amharic' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hy', label: 'Armenian' },
  { value: 'as', label: 'Assamese' },
  { value: 'az', label: 'Azerbaijani' },
  { value: 'eu', label: 'Basque' },
  { value: 'be', label: 'Belarusian' },
  { value: 'bn', label: 'Bengali' },
  { value: 'bs', label: 'Bosnian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'ca', label: 'Catalan' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hr', label: 'Croatian' },
  { value: 'cs', label: 'Czech' },
  { value: 'da', label: 'Danish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'en', label: 'English' },
  { value: 'et', label: 'Estonian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'fr', label: 'French' },
  { value: 'gl', label: 'Galician' },
  { value: 'ka', label: 'Georgian' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ht', label: 'Haitian' },
  { value: 'ha', label: 'Hausa' },
  { value: 'haw', label: 'Hawaiian' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'is', label: 'Icelandic' },
  { value: 'id', label: 'Indonesian' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'jw', label: 'Javanese' },
  { value: 'kn', label: 'Kannada' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'ko', label: 'Korean' },
  { value: 'lo', label: 'Lao' },
  { value: 'la', label: 'Latin' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'lb', label: 'Luxembourgish' },
  { value: 'mk', label: 'Macedonian' },
  { value: 'mg', label: 'Malagasy' },
  { value: 'ms', label: 'Malay' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mt', label: 'Maltese' },
  { value: 'mi', label: 'Maori' },
  { value: 'mr', label: 'Marathi' },
  { value: 'mn', label: 'Mongolian' },
  { value: 'ne', label: 'Nepali' },
  { value: 'no', label: 'Norwegian' },
  { value: 'pa', label: 'Panjabi' },
  { value: 'ps', label: 'Pashto' },
  { value: 'fa', label: 'Persian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ro', label: 'Romanian' },
  { value: 'ru', label: 'Russian' },
  { value: 'sr', label: 'Serbian' },
  { value: 'sn', label: 'Shona' },
  { value: 'sd', label: 'Sindhi' },
  { value: 'si', label: 'Sinhala' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'so', label: 'Somali' },
  { value: 'es', label: 'Spanish' },
  { value: 'su', label: 'Sundanese' },
  { value: 'sw', label: 'Swahili' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'tg', label: 'Tajik' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'tr', label: 'Turkish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ur', label: 'Urdu' },
  { value: 'uz', label: 'Uzbek' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'cy', label: 'Welsh' },
  { value: 'yi', label: 'Yiddish' },
  { value: 'yo', label: 'Yoruba' },
]

const FOOTER_LINKS = [
  { label: 'Documentation', url: 'https://github.com/TimothyBayode/Voxa' },
  { label: 'Privacy Policy', url: 'https://github.com/TimothyBayode/Voxa#privacy' },
  { label: 'Terms of Use', url: 'https://github.com/TimothyBayode/Voxa#license' },
  { label: 'Help', url: 'https://github.com/TimothyBayode/Voxa/issues' },
  { label: 'Support Voxa', url: 'https://buymeacoffee.com/timothybayode' },
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
        <label className="popup-label">Output language</label>
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

      <div className="popup-divider" />

      <div className="popup-footer">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.url}
            className="popup-link"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.preventDefault()
              chrome.tabs.create({ url: link.url })
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}
