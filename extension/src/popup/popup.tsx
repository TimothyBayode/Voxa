import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

function Popup() {
  const [enabled, setEnabled] = useState(true)
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    chrome.storage.sync.get(['voxaEnabled', 'voxaLanguage'], (result) => {
      if (result.voxaEnabled !== undefined) setEnabled(result.voxaEnabled)
      if (result.voxaLanguage) setLanguage(result.voxaLanguage)
    })
  }, [])

  const toggleEnabled = () => {
    const newValue = !enabled
    setEnabled(newValue)
    chrome.storage.sync.set({ voxaEnabled: newValue })
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
    chrome.storage.sync.set({ voxaLanguage: e.target.value })
  }

  return (
    <div className="popup">
      <div className="popup-header">
        <h1 className="popup-title">VOXA</h1>
        <p className="popup-tagline">Turn every text box<br />into a microphone.</p>
      </div>

      <div className="popup-status">
        <div className="status-dot" />
        <span className="status-text">{enabled ? 'Ready' : 'Disabled'}</span>
      </div>

      <div className="popup-section">
        <label className="popup-label">Language</label>
        <select value={language} onChange={handleLanguageChange} className="popup-select">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="nl">Dutch</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
        </select>
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
