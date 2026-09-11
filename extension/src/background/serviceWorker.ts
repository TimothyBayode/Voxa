chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ ok: true })
  }
  return true
})

async function isEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get({ voxaEnabled: true })
  return result.voxaEnabled === true
}

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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'voxa-dictate',
    title: 'Dictate with Voxa',
    contexts: ['editable'],
  })
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
