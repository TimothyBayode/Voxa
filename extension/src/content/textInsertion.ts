export function insertTextAtCursor(text: string): boolean {
  const active = document.activeElement

  if (active instanceof HTMLInputElement) {
    return insertIntoInput(active, text)
  }

  if (active instanceof HTMLTextAreaElement) {
    return insertIntoTextarea(active, text)
  }

  if (active instanceof HTMLElement && active.isContentEditable) {
    return insertIntoContentEditable(active, text)
  }

  return false
}

function insertIntoInput(input: HTMLInputElement, text: string): boolean {
  const { selectionStart, selectionEnd, value } = input

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

function insertIntoTextarea(textarea: HTMLTextAreaElement, text: string): boolean {
  const { selectionStart, selectionEnd, value } = textarea

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

function insertIntoContentEditable(el: HTMLElement, text: string): boolean {
  const selection = window.getSelection()
  if (!selection) return false

  const range = selection.getRangeAt(0)
  range.deleteContents()

  const textNode = document.createTextNode(text)
  range.insertNode(textNode)

  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)

  dispatchInputEvent(el)
  return true
}

function dispatchInputEvent(el: HTMLElement): void {
  const inputEvent = new Event('input', { bubbles: true })
  el.dispatchEvent(inputEvent)

  const changeEvent = new Event('change', { bubbles: true })
  el.dispatchEvent(changeEvent)
}
