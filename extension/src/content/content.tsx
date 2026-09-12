import React from 'react'
import { createRoot } from 'react-dom/client'
import { PopUnder } from './popUnder'
import { setupFocusDetection } from './focusDetection'
import { getActiveEditableElement, isVoxaEnabled } from './utils'
import { captureSelection, insertTextAtCursor, type TextSelection } from './textInsertion'
import { startDictation, stopDictation as stopRecording } from './recorder'
import type { PopUnderState } from '../components/types'

const POP_UNDER_CSS = `
.pop-under {
  position: absolute;
  z-index: 2147483647;
  width: 240px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #1f2937;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  overflow: hidden;
}

.pop-under-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.pop-under-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.pop-under-logo {
  display: block;
  width: 22px;
  height: 22px;
  margin: 0 auto;
  border-radius: 6px;
  object-fit: cover;
}

.pop-under-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.pop-under-label {
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pop-under-shortcut {
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
}

.listening-dot {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ef4444;
  opacity: 0.6;
  animation: pulse 1.5s ease-out infinite;
}

.pulse-ring:nth-child(2) {
  animation-delay: 0.5s;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.mic-icon {
  position: relative;
  z-index: 1;
  font-size: 14px;
  line-height: 1;
}

.processing-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.success-icon {
  color: #10b981;
  font-weight: bold;
  font-size: 14px;
}

.error-icon {
  color: #ef4444;
  font-weight: bold;
  font-size: 14px;
}

@media (prefers-color-scheme: dark) {
  .pop-under {
    background: #1f2937;
    border-color: #374151;
    color: #f9fafb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .pop-under-label {
    color: #f9fafb;
  }

  .pop-under-shortcut {
    color: #9ca3af;
  }
}
`

type DictationState = {
  state: PopUnderState
  targetElement: Element | null
  selection: TextSelection
  errorMessage: string
}

const dictationState: DictationState = {
  state: 'hidden',
  targetElement: null,
  selection: null,
  errorMessage: '',
}

let popUnderRoot: ReturnType<typeof createRoot> | null = null

function ensureShadowHost() {
  let host = document.getElementById('voxa-pop-under-host')
  if (!host) {
    host = document.createElement('div')
    host.id = 'voxa-pop-under-host'
    host.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;top:0;left:0;width:100vw;height:100vh;'
    document.body.appendChild(host)
  }

  let shadow = host.shadowRoot
  if (!shadow) {
    shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = POP_UNDER_CSS
    shadow.appendChild(style)

    const container = document.createElement('div')
    container.id = 'voxa-pop-under-root'
    container.style.cssText = 'position:absolute;top:0;left:0;pointer-events:auto;'
    shadow.appendChild(container)
  }

  const container = shadow.getElementById('voxa-pop-under-root')!
  return { container, shadow }
}

function showPopUnder() {
  if (!popUnderRoot) {
    const { container } = ensureShadowHost()
    popUnderRoot = createRoot(container)
  }
}

function hidePopUnder() {
  dictationState.state = 'hidden'
  dictationState.targetElement = null
  dictationState.selection = null
  dictationState.errorMessage = ''
  renderPopUnder()
}

function renderPopUnder() {
  if (!popUnderRoot) return

  if (dictationState.state === 'hidden') {
    const host = document.getElementById('voxa-pop-under-host')
    if (host) {
      host.remove()
    }
    popUnderRoot = null
    return
  }

  popUnderRoot.render(
    React.createElement(PopUnder, {
      state: dictationState.state,
      errorMessage: dictationState.errorMessage,
      targetRect: dictationState.targetElement?.getBoundingClientRect() || null,
      targetElement: dictationState.targetElement,
      onDictationAction: async () => {
        if (dictationState.state === 'listening') {
          await stopDictation()
        } else if (dictationState.state === 'idle') {
          await startDictationFlow()
        }
      },
    })
  )
}

async function startDictationFlow(forceTarget?: Element) {
  if (!(await isVoxaEnabled())) return

  if (dictationState.state === 'listening') {
    await stopDictation()
    return
  }

  const target = forceTarget || getActiveEditableElement() || dictationState.targetElement
  if (!target) return

  dictationState.targetElement = target
  dictationState.selection = captureSelection(target)
  dictationState.errorMessage = ''
  dictationState.state = 'listening'
  showPopUnder()
  renderPopUnder()

  try {
    const transcript = await startDictation()

    dictationState.state = 'processing'
    renderPopUnder()

    if (transcript) {
      if (dictationState.targetElement) {
        (dictationState.targetElement as HTMLElement).focus()
      }

      await new Promise(resolve => setTimeout(resolve, 50))

      const inserted = insertTextAtCursor(transcript, dictationState.targetElement, dictationState.selection)

      if (inserted) {
        dictationState.state = 'success'
        renderPopUnder()

        setTimeout(() => {
          dictationState.state = 'hidden'
          dictationState.targetElement = null
          renderPopUnder()
        }, 1200)
      } else {
        throw new Error('Could not insert text')
      }
    } else {
      throw new Error('No speech detected')
    }
  } catch (error: any) {
    console.error('Dictation error:', error)
    dictationState.state = 'error'
    dictationState.errorMessage = getErrorMessage(error)
    renderPopUnder()

    setTimeout(() => {
      dictationState.state = 'hidden'
      dictationState.targetElement = null
      dictationState.selection = null
      dictationState.errorMessage = ''
      renderPopUnder()
    }, 2500)
  }
}

async function stopDictation() {
  stopRecording()
}

function getErrorMessage(error: any): string {
  if (error.message?.includes('permission') || error.message?.includes('Permission')) {
    return 'Microphone access is required to dictate.'
  }
  if (error.message?.includes('timeout') || error.message?.includes('network')) {
    return 'Voxa is temporarily unavailable.'
  }
  if (error.message?.includes('No audio') || error.message?.includes('No speech')) {
    return 'No speech detected. Try again.'
  }
  return "Couldn't transcribe. Try again."
}

async function init() {
  let enabled = true
  try {
    enabled = await isVoxaEnabled()
  } catch {
    // Storage unavailable (e.g. stale context) — default to enabled
  }

  console.info(`[Voxa] Content script ready (enabled: ${enabled})`)

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.voxaEnabled) return
    enabled = changes.voxaEnabled.newValue !== false
    if (!enabled && dictationState.state === 'idle') hidePopUnder()
  })

  const handleShortcut = (event: KeyboardEvent) => {
    if (!enabled) return
    if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== 'd') return

    const active = getActiveEditableElement()
    if (!active && dictationState.state === 'hidden') return

    event.preventDefault()
    event.stopPropagation()

    if (dictationState.state === 'listening') {
      void stopDictation()
    } else {
      void startDictationFlow(active || undefined)
    }
  }

  document.addEventListener('keydown', handleShortcut, true)

  setupFocusDetection(
    (element) => {
      if (!enabled) return
      if (dictationState.state === 'hidden') {
        dictationState.targetElement = element
        dictationState.state = 'idle'
        showPopUnder()
        renderPopUnder()
      } else if (dictationState.state === 'idle' && dictationState.targetElement !== element) {
        // Moving directly between fields — re-anchor the pop-under to the new field
        dictationState.targetElement = element
        renderPopUnder()
      }
    },
    () => {
      if (dictationState.state === 'idle') {
        hidePopUnder()
      }
    }
  )

  // Listen for messages from service worker (commands + context menu)
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'start-dictation') {
      if (!enabled) {
        sendResponse({ ok: false, error: 'Voxa is disabled' })
        return true
      }
      // For context menu: use stored target element if no active editable
      const active = getActiveEditableElement()
      const target = active || dictationState.targetElement
      if (target) {
        void startDictationFlow(target)
      } else if (dictationState.state !== 'hidden') {
        void startDictationFlow()
      }
      sendResponse({ ok: true })
    }
    return true
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
