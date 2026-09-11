export type PopUnderState = 'hidden' | 'idle' | 'listening' | 'processing' | 'success' | 'error'

export interface PopUnderPosition {
  top: number
  left: number
}

export interface DictationResult {
  text: string
  error?: string
}
