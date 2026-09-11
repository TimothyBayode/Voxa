import { isEditableElement } from './utils'

export function setupFocusDetection(
  onElementFocused: (element: Element) => void,
  onElementBlurred: () => void
): () => void {
  let currentElement: Element | null = null

  const handleFocusIn = (event: Event) => {
    const target = event.target as Element
    if (isEditableElement(target)) {
      currentElement = target
      onElementFocused(target)
    }
  }

  const handleFocusOut = (event: Event) => {
    const relatedTarget = (event as FocusEvent).relatedTarget as Node | null
    requestAnimationFrame(() => {
      const active = document.activeElement
      if (active && isEditableElement(active)) {
        return
      }

      // Don't hide when focus moved into the Voxa pop-under (clicking it starts dictation)
      const host = document.getElementById('voxa-pop-under-host')
      if (host && (active === host || (relatedTarget && (relatedTarget === host || host.contains(relatedTarget))))) {
        return
      }

      currentElement = null
      onElementBlurred()
    })
  }

  const handleClick = (event: Event) => {
    const target = event.target as Element
    if (isEditableElement(target)) {
      currentElement = target
      onElementFocused(target)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as Element
    if (isEditableElement(target)) {
      currentElement = target
      onElementFocused(target)
    }
  }

  document.addEventListener('focusin', handleFocusIn)
  document.addEventListener('focusout', handleFocusOut)
  document.addEventListener('click', handleClick, true)
  document.addEventListener('keydown', handleKeyDown, true)

  const observer = new MutationObserver(() => {
    if (currentElement && !document.contains(currentElement)) {
      currentElement = null
      onElementBlurred()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return () => {
    document.removeEventListener('focusin', handleFocusIn)
    document.removeEventListener('focusout', handleFocusOut)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('keydown', handleKeyDown, true)
    observer.disconnect()
  }
}
