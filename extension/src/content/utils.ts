export function isEditableElement(el: Element | null): boolean {
  if (!el) return false

  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase()
    if (['password', 'file', 'checkbox', 'radio', 'hidden', 'submit', 'reset', 'button', 'image'].includes(type)) {
      return false
    }
    return !el.disabled && !el.readOnly
  }

  if (el instanceof HTMLTextAreaElement) {
    return !el.disabled && !el.readOnly
  }

  if (el instanceof HTMLElement) {
    const contentEditable = el.getAttribute('contenteditable')
    if (contentEditable === 'true' || contentEditable === '') {
      return true
    }
    if (el.isContentEditable) {
      return true
    }
  }

  return false
}

export function getActiveEditableElement(): Element | null {
  const active = document.activeElement
  if (isEditableElement(active)) {
    return active
  }

  // Check for contenteditable inside the active element
  if (active instanceof HTMLElement && active.isContentEditable) {
    return active
  }

  return null
}

export async function isVoxaEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get({ voxaEnabled: true })
  return result.voxaEnabled === true
}
