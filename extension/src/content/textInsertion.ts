export type TextSelection =
  | { kind: 'value'; start: number; end: number }
  | { kind: 'range'; range: Range }
  | null

export function captureSelection(element: Element): TextSelection {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return {
      kind: 'value',
      start: element.selectionStart ?? element.value.length,
      end: element.selectionEnd ?? element.value.length,
    }
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    const currentSelection = window.getSelection()
    if (currentSelection && currentSelection.rangeCount > 0 && element.contains(currentSelection.anchorNode)) {
      return { kind: 'range', range: currentSelection.getRangeAt(0).cloneRange() }
    }
  }

  return null
}

export function insertTextAtCursor(text: string, target: Element, selection: TextSelection): boolean {
  if (!target.isConnected) return false

  if (target instanceof HTMLInputElement) {
    return insertIntoInput(target, text, selection)
  }

  if (target instanceof HTMLTextAreaElement) {
    return insertIntoTextarea(target, text, selection)
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return insertIntoContentEditable(target, text, selection)
  }

  return false
}

function insertIntoInput(input: HTMLInputElement, text: string, selection: TextSelection): boolean {
  const { value } = input
  const selectionStart = selection?.kind === 'value' ? selection.start : input.selectionStart
  const selectionEnd = selection?.kind === 'value' ? selection.end : input.selectionEnd

  if (selectionStart === null || selectionEnd === null) {
    input.value = value + text
    dispatchInputEvent(input)
    return true
  }

  const before = value.substring(0, selectionStart)
  const after = value.substring(selectionEnd)
  const newValue = before + text + after

  input.value = newValue

  const newPos = selectionStart + text.length
  input.selectionStart = newPos
  input.selectionEnd = newPos

  dispatchInputEvent(input)
  return true
}

function insertIntoTextarea(textarea: HTMLTextAreaElement, text: string, selection: TextSelection): boolean {
  const { value } = textarea
  const selectionStart = selection?.kind === 'value' ? selection.start : textarea.selectionStart
  const selectionEnd = selection?.kind === 'value' ? selection.end : textarea.selectionEnd

  if (selectionStart === null || selectionEnd === null) {
    textarea.value = value + text
    dispatchInputEvent(textarea)
    return true
  }

  const before = value.substring(0, selectionStart)
  const after = value.substring(selectionEnd)
  const newValue = before + text + after

  textarea.value = newValue

  const newPos = selectionStart + text.length
  textarea.selectionStart = newPos
  textarea.selectionEnd = newPos

  dispatchInputEvent(textarea)
  return true
}

function insertIntoContentEditable(el: HTMLElement, text: string, savedSelection: TextSelection): boolean {
  const activeSelection = window.getSelection()
  if (!activeSelection) return false

  const range = savedSelection?.kind === 'range' ? savedSelection.range.cloneRange() : document.createRange()
  if (savedSelection?.kind !== 'range') {
    range.selectNodeContents(el)
    range.collapse(false)
  }
  range.deleteContents()

  const textNode = document.createTextNode(text)
  range.insertNode(textNode)

  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  activeSelection.removeAllRanges()
  activeSelection.addRange(range)

  dispatchInputEvent(el)
  return true
}

function dispatchInputEvent(el: HTMLElement): void {
  const inputEvent = new InputEvent('input', { bubbles: true, inputType: 'insertText', data: null })
  el.dispatchEvent(inputEvent)

  const changeEvent = new Event('change', { bubbles: true })
  el.dispatchEvent(changeEvent)
}
