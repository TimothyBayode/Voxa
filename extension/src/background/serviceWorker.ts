async function isEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get({ voxaEnabled: true })
  return result.voxaEnabled === true
}

const ICONS_ENABLED = { 16: 'icons/icon16.png', 48: 'icons/icon48.png' }
const ICONS_DISABLED = { 16: 'icons/icon16-disabled.png', 48: 'icons/icon48-disabled.png' }

async function applyActionIcon(voxaEnabled: boolean): Promise<void> {
  await chrome.action.setIcon({ path: voxaEnabled ? ICONS_ENABLED : ICONS_DISABLED })
}

const CONTEXT_MENU_ID = 'voxa-dictate'

function createContextMenu(): void {
  chrome.contextMenus.create(
    {
      id: CONTEXT_MENU_ID,
      title: 'Dictate with Voxa',
      contexts: ['editable'],
    },
    () => void chrome.runtime.lastError
  )
}

function removeContextMenu(): void {
  chrome.contextMenus.remove(CONTEXT_MENU_ID, () => void chrome.runtime.lastError)
}

async function syncEnabledState(): Promise<void> {
  const { voxaEnabled } = await chrome.storage.local.get({ voxaEnabled: true })
  await applyActionIcon(voxaEnabled)
  if (voxaEnabled) {
    createContextMenu()
  } else {
    removeContextMenu()
  }
}

syncEnabledState()

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.voxaEnabled) {
    void syncEnabledState()
  }
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'start-dictation') {
    if (!(await isEnabled())) return
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'start-dictation' }).catch(() => {
        // Content script might not be loaded yet
      })
    }
  }
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (tab?.id && await isEnabled()) {
    chrome.tabs.sendMessage(tab.id, { action: 'start-dictation' }, { frameId: info.frameId }).catch(() => {
      // Content script might not be loaded yet
    })
  }
})

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get('voxaEnabled')
  if (result.voxaEnabled === undefined) {
    await chrome.storage.local.set({ voxaEnabled: true, voxaLanguage: 'en' })
  }
})
