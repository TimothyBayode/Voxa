const BACKEND_URL = 'http://localhost:3000'

let currentRecorder: MediaRecorder | null = null
let currentStream: MediaStream | null = null

export async function startDictation(): Promise<string> {
  if (currentRecorder && currentRecorder.state !== 'inactive') {
    stopDictation()
  }

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
      },
    })
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('Microphone access is required to dictate.')
    }
    throw error
  }

  currentStream = stream

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm'

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
  })

  currentRecorder = mediaRecorder

  const chunks: Blob[] = []

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
        currentStream = null
      }
      currentRecorder = null

      const audioBlob = new Blob(chunks, { type: 'audio/webm' })

      if (audioBlob.size < 1000) {
        resolve('')
        return
      }

      try {
        const formData = new FormData()
        formData.append('audio', audioBlob, 'dictation.webm')
        const language = await getSelectedLanguage()
        formData.append('language', language)

        const response = await fetch(`${BACKEND_URL}/api/dictate`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(error.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        resolve(result.text || '')
      } catch (error: any) {
        reject(error)
      }
    }

    mediaRecorder.onerror = (event: any) => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
        currentStream = null
      }
      currentRecorder = null
      reject(new Error(event.error?.message || 'Recording error'))
    }

    mediaRecorder.start(100)
  })
}

async function getSelectedLanguage(): Promise<string> {
  const result = await chrome.storage.local.get({ voxaLanguage: 'en' })
  return typeof result.voxaLanguage === 'string' ? result.voxaLanguage : 'en'
}

export function stopDictation(): void {
  if (currentRecorder && currentRecorder.state !== 'inactive') {
    currentRecorder.stop()
  }
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
    currentStream = null
  }
}

export function isCurrentlyDictating(): boolean {
  return currentRecorder !== null && currentRecorder.state !== 'inactive'
}
