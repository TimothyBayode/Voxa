const DICTATION_ENDPOINT = 'https://dictation.assemblyai.com/v1/transcribe/live';
const REQUEST_TIMEOUT_MS = 90000;
const SUPPORTED_LANGUAGES = new Set([
    'en', 'es', 'de', 'fr', 'it', 'pt', 'tr', 'nl', 'sv', 'no',
    'da', 'fi', 'hi', 'vi', 'ar', 'he', 'ja', 'ur', 'zh',
]);
export async function transcribeAudio(audioBuffer, languageCode = 'en', sampleRate = 16000) {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        throw new Error('AssemblyAI API key not configured');
    }
    const language = SUPPORTED_LANGUAGES.has(languageCode) ? languageCode : 'en';
    const rate = Number.isFinite(sampleRate) && sampleRate >= 8000 && sampleRate <= 48000 ? Math.round(sampleRate) : 16000;
    const config = {
        language_codes: [language],
        sample_rate: rate,
        channels: 1,
    };
    const form = new FormData();
    // `config` must arrive before `audio` — the endpoint starts reading immediately
    form.append('config', new Blob([JSON.stringify(config)], { type: 'application/json' }));
    form.append('audio', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/pcm' }), 'audio');
    let response;
    try {
        response = await fetch(DICTATION_ENDPOINT, {
            method: 'POST',
            headers: { Authorization: apiKey },
            body: form,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
    }
    catch (error) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
            throw new Error('Transcription timeout');
        }
        throw new Error('Could not reach AssemblyAI: ' + (error?.message || 'network error'));
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(describeApiError(response.status, body));
    }
    const text = typeof body?.text === 'string' ? body.text : '';
    const llmResponse = typeof body?.llm_response === 'string' ? body.llm_response : null;
    return { text, llmResponse };
}
function describeApiError(status, body) {
    // Per docs: invalid API key returns 404 (not 401), unsupported audio returns 415.
    // Error bodies are either { error, error_code } or { status, title, detail }.
    const detail = (typeof body?.error === 'string' && body.error) ||
        (typeof body?.detail === 'string' && body.detail) ||
        (typeof body?.title === 'string' && body.title) ||
        'Unknown error';
    if (status === 404)
        return `AssemblyAI rejected the API key (404): ${detail}`;
    if (status === 415)
        return `AssemblyAI rejected the audio format (415): ${detail}`;
    return `AssemblyAI error (HTTP ${status}): ${detail}`;
}
