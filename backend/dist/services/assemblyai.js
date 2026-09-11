import WebSocket from 'ws';
export async function transcribeAudio(audioBuffer, mimeType, languageCode = 'en') {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        throw new Error('AssemblyAI API key not configured');
    }
    const wsUrl = 'wss://dictation.assemblyai.com/v1/listen';
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl, {
            headers: {
                Authorization: apiKey,
            },
        });
        let fullTranscript = '';
        let sessionStarted = false;
        let transcriptsReceived = false;
        let timeoutHandle;
        const TIMEOUT_MS = 60000;
        const cleanup = () => {
            clearTimeout(timeoutHandle);
            try {
                ws.close();
            }
            catch { }
        };
        timeoutHandle = setTimeout(() => {
            cleanup();
            if (!transcriptsReceived) {
                reject(new Error('Transcription timeout'));
            }
        }, TIMEOUT_MS);
        ws.on('open', () => {
            const sampleRate = 16000;
            const channels = 1;
            const encoding = mimeType.includes('webm') ? 'webm' : 'pcm_s16le';
            ws.send(JSON.stringify({
                message_type: 'session_begins',
                audio_format: {
                    sample_rate: sampleRate,
                    channels: channels,
                    encoding: encoding,
                },
                language_code: languageCode,
            }));
            ws.send(audioBuffer);
        });
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.message_type === 'session_begins') {
                    sessionStarted = true;
                }
                else if (message.message_type === 'interim_transcript' && message.text) {
                }
                else if (message.message_type === 'final_transcript' && message.text) {
                    fullTranscript += message.text + ' ';
                    transcriptsReceived = true;
                }
                else if (message.message_type === 'session_ends' && message.transcripts) {
                    for (const t of message.transcripts) {
                        fullTranscript += t.text + ' ';
                    }
                    transcriptsReceived = true;
                    cleanup();
                    resolve(fullTranscript.trim());
                }
                else if (message.message_type === 'error') {
                    cleanup();
                    reject(new Error('AssemblyAI error: ' + JSON.stringify(message)));
                }
            }
            catch {
                // Ignore non-JSON messages
            }
        });
        ws.on('error', (error) => {
            cleanup();
            reject(new Error('WebSocket error: ' + error.message));
        });
        ws.on('close', () => {
            cleanup();
            if (!transcriptsReceived && sessionStarted) {
                resolve(fullTranscript.trim() || '');
            }
            else if (!transcriptsReceived) {
                reject(new Error('Connection closed before transcription completed'));
            }
        });
    });
}
