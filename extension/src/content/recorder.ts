const BACKEND_URL = 'https://voxa-vzrg.onrender.com'
const TARGET_SAMPLE_RATE = 16000
const MAX_RECORDING_MS = 115_000
const MIN_SAMPLES = 4000

// AudioWorklet module source — loaded via blob URL (content scripts can't ship separate module files)
const CAPTURE_WORKLET_CODE = `
class VoxaCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (channel && channel.length > 0) {
      const copy = new Float32Array(channel)
      this.port.postMessage(copy, [copy.buffer])
    }
    return true
  }
}
registerProcessor('voxa-capture-processor', VoxaCaptureProcessor)
`

let currentContext: AudioContext | null = null
let currentStream: MediaStream | null = null
let currentSource: MediaStreamAudioSourceNode | null = null
let currentProcessor: AudioWorkletNode | ScriptProcessorNode | null = null
let currentSilence: GainNode | null = null
let currentTimer: number | null = null

let chunks: Float32Array[] = []
let totalSamples = 0
let sessionToken = 0

export async function startRecording(onAutoStop?: () => void): Promise<void> {
  if (currentContext) {
    cancelCapture()
  }
  const token = ++sessionToken

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('Microphone access is required to dictate.')
    }
    throw error
  }

  // Stop was requested while the mic prompt was still open
  if (token !== sessionToken) {
    stream.getTracks().forEach(track => track.stop())
    return
  }

  currentStream = stream

  let context: AudioContext
  try {
    context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })
  } catch {
    context = new AudioContext()
  }
  void context.resume()
  currentContext = context

  const source = context.createMediaStreamSource(stream)
  currentSource = source

  const processor = await createCaptureNode(context)
  currentProcessor = processor

  // Keep the node pulled by the graph without playing captured audio aloud
  const silence = context.createGain()
  silence.gain.value = 0
  currentSilence = silence

  chunks = []
  totalSamples = 0

  source.connect(processor)
  processor.connect(silence)
  silence.connect(context.destination)

  currentTimer = window.setTimeout(() => {
    currentTimer = null
    onAutoStop?.()
  }, MAX_RECORDING_MS)
}

export async function stopRecording(): Promise<string> {
  sessionToken++ // invalidate any in-flight start
  const captured = teardown()

  if (!captured || captured.totalSamples < MIN_SAMPLES) {
    return ''
  }

  const pcm = floatTo16BitPCM(captured.chunks, captured.totalSamples)
  const language = await getSelectedLanguage()

  const formData = new FormData()
  formData.append('audio', new Blob([pcm], { type: 'audio/pcm' }), 'dictation.pcm')
  formData.append('language', language)
  formData.append('sampleRate', String(captured.sampleRate))

  const response = await fetch(`${BACKEND_URL}/api/dictate`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  const result = await response.json()
  return result.text || ''
}

async function createCaptureNode(context: AudioContext): Promise<AudioWorkletNode | ScriptProcessorNode> {
  try {
    const blobUrl = URL.createObjectURL(new Blob([CAPTURE_WORKLET_CODE], { type: 'application/javascript' }))
    try {
      await context.audioWorklet.addModule(blobUrl)
    } finally {
      URL.revokeObjectURL(blobUrl)
    }

    const node = new AudioWorkletNode(context, 'voxa-capture-processor', {
      numberOfOutputs: 1,
      outputChannelCount: [1],
    })
    node.port.onmessage = (event) => {
      const data = event.data as Float32Array
      if (data && data.length > 0) {
        chunks.push(data)
        totalSamples += data.length
      }
    }
    return node
  } catch {
    // Blob module blocked (e.g. strict page CSP) — fall back to ScriptProcessor
    const processor = context.createScriptProcessor(4096, 1, 1)
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0)
      chunks.push(new Float32Array(input))
      totalSamples += input.length
    }
    return processor
  }
}

function teardown(): { sampleRate: number; chunks: Float32Array[]; totalSamples: number } | null {
  if (currentTimer) {
    clearTimeout(currentTimer)
    currentTimer = null
  }

  if (!currentContext) return null

  const sampleRate = currentContext.sampleRate
  const capturedChunks = chunks
  const capturedTotal = totalSamples

  if (currentProcessor) {
    if (currentProcessor instanceof AudioWorkletNode) {
      currentProcessor.port.onmessage = null
    } else {
      currentProcessor.onaudioprocess = null
    }
    try { currentProcessor.disconnect() } catch { /* already disconnected */ }
  }
  if (currentSource) {
    try { currentSource.disconnect() } catch { /* already disconnected */ }
  }
  if (currentSilence) {
    try { currentSilence.disconnect() } catch { /* already disconnected */ }
  }
  void currentContext.close().catch(() => { /* already closed */ })
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
  }

  currentProcessor = null
  currentSource = null
  currentSilence = null
  currentContext = null
  currentStream = null
  chunks = []
  totalSamples = 0

  return { sampleRate, chunks: capturedChunks, totalSamples: capturedTotal }
}

function cancelCapture(): void {
  teardown()
}

async function getSelectedLanguage(): Promise<string> {
  const result = await chrome.storage.local.get({ voxaLanguage: 'en' })
  return typeof result.voxaLanguage === 'string' ? result.voxaLanguage : 'en'
}

function floatTo16BitPCM(chunks: Float32Array[], totalSamples: number): ArrayBuffer {
  const buffer = new ArrayBuffer(totalSamples * 2)
  const view = new DataView(buffer)
  let offset = 0

  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++, offset += 2) {
      const sample = Math.max(-1, Math.min(1, chunk[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    }
  }

  return buffer
}
