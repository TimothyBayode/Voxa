# Voxa

**Turn every text box into a microphone.**

Voxa is a Chrome extension that brings voice dictation to every text input on the web. Focus any text field and press `Alt + Shift + D` to start dictating with AssemblyAI's real-time transcription API.

---

## Features

- Dictate into any text input, textarea, or contenteditable element
- Real-time transcription via AssemblyAI Dictation API
- Minimal, unobtrusive pop-under UI
- Keyboard shortcut: `Alt + Shift + D`
- Works with modern JavaScript applications (React, Vue, etc.)
- Lightweight and privacy-focused

---

## Architecture

```text
User speaks
    ↓
Chrome Extension (content script)
    ↓
Voxa Backend (Express + AssemblyAI)
    ↓
AssemblyAI Dictation API
    ↓
Transcript returned
    ↓
Inserted into focused text field
```

**The AssemblyAI API key never leaves the backend.**

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Extension**: Chrome Manifest V3, Service Worker
- **Backend**: Node.js, Express, AssemblyAI SDK, WebSocket
- **Audio**: MediaRecorder API (browser)

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- Chrome browser
- AssemblyAI API key

---

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd voxa
npm install
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
PORT=3000
CORS_ORIGIN=chrome-extension://*
```

### 3. Build Extension

```bash
npm run build
```

This produces `extension/dist/` which can be loaded as an unpacked extension.

---

## Development

### Run Backend

```bash
npm run dev:backend
```

### Run Extension (watch mode)

```bash
npm run dev:extension
```

### Run Both

```bash
npm run dev
```

---

## Chrome Installation

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder
5. Pin Voxa to your toolbar

---

## Usage

1. Focus any text input, textarea, or contenteditable element on a webpage
2. A small "Dictate with Voxa" pop-under appears below the field
3. Press `Alt + Shift + D` (or click the pop-under)
4. Allow microphone access when prompted (first time only)
5. Speak naturally
6. Press `Alt + Shift + D` again to stop
7. Your transcript appears in the text field

---

<a id="privacy"></a>

## Privacy Policy

Last updated: September 12, 2026

Voxa is a free, open-source browser extension that adds voice dictation to text fields on the web. This policy explains, in plain language, what data Voxa processes and what it does not. Everything described here can be verified against the public source code.

### What data Voxa processes

Voxa processes only two kinds of information:

1. **Voice audio** — captured from your microphone **only while dictation is explicitly active**. Voxa never listens in the background. Recording starts when you trigger it (pop-under click, the keyboard shortcut, or the right-click menu) and stops when you stop it (or automatically after ~115 seconds).
2. **Settings** — your enabled/disabled state and selected output language, stored locally in your browser. No other configuration or personal information is collected.

Voxa does not read your browsing history, does not analyze page content, and does not collect identifiers of any kind.

### How transcription works

When you dictate, the captured audio is sent to the Voxa backend associated with your installation, which forwards it to the [AssemblyAI](https://www.assemblyai.com/) Dictation API for speech-to-text processing. If you select an output language other than English, the returned transcript is rewritten into that language as part of the same request. The transcript is then inserted into the text field you dictated into:

```text
User speaks
    ↓
Audio sent to Voxa backend
    ↓
Backend sends audio to AssemblyAI
    ↓
Transcript returned
    ↓
Transcript inserted into focused field
```

Because transcription is performed by AssemblyAI, **your spoken content is processed by third-party infrastructure** that Voxa depends on to provide the service. AssemblyAI's handling of that data is governed by AssemblyAI's own terms and privacy policy, not by Voxa.

Voxa is self-hosted by design: the backend is your own instance, running on your own machine or server, with your own AssemblyAI API key. If you point Voxa at a backend operated by someone else, that operator's practices apply to the audio sent to it.

### What Voxa does not do

- Voxa does not run analytics, telemetry, or tracking of any kind.
- Voxa does not sell personal information.
- Voxa does not use dictated content for advertising, profiling, or model training of its own.
- Voxa has no user accounts and does not require sign-in.
- Voxa's backend does not write audio to disk or a database — audio is held in memory only for the duration of the transcription request, and transcripts are not stored or logged by it.

### What is stored locally

Voxa stores two settings in your browser's local extension storage (`chrome.storage.local`): whether Voxa is enabled, and your selected output language. Nothing else is persisted. This data stays on your device until you remove the extension or clear its data.

### API keys and configuration

The AssemblyAI API key used for transcription is configured server-side in the backend's environment (`.env`). It is never embedded in the extension, never sent to your browser, and never included in requests from the extension. No other credentials or configuration data are handled.

### Data retention and deletion

- **Audio** is processed in memory by the backend for the duration of each request and is not retained by Voxa's code afterward. How long AssemblyAI may retain submitted audio is governed by AssemblyAI's policies.
- **Transcripts** are returned to the page you dictated into and are not stored by Voxa. A transcript becomes part of that web page's content, exactly like typed text.
- **Settings** remain in your browser until you remove the extension or clear its storage.

### Your controls

- Dictation only ever runs because you started it, and only for as long as you keep it running.
- You can disable Voxa at any time with the toggle in the popup; when disabled, the extension does not capture audio or offer dictation.
- Microphone access is granted at the browser level and can be revoked there at any time.
- Uninstalling the extension removes its local settings.

### Security limitations

Voxa is provided as-is under the MIT license. The default backend setup listens on `http://localhost:3000`, which keeps traffic on your machine; if you expose a backend on a network, secure it appropriately (HTTPS, access controls) — the security of that deployment is the operator's responsibility. Note that audio does leave your device during dictation, so avoid dictating highly sensitive information (passwords, financial details, health data) unless you are comfortable with the processing described above.

### Children's privacy

Voxa is not directed at children under 13 (or the equivalent minimum age in your jurisdiction), and Voxa does not knowingly collect personal information from children.

### Changes to this policy

This policy may be updated as Voxa evolves. Changes are published in this file, and the repository's commit history documents what changed and when.

### Contact

Questions or concerns about privacy? Open an issue at [github.com/TimothyBayode/Voxa/issues](https://github.com/TimothyBayode/Voxa/issues).

---

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Persist user settings (language, enabled/disabled) |
| `activeTab` | Communicate with the current tab's content script |
| `host_permissions: <all_urls>` | Detect editable elements on any webpage |

---

## API Endpoints

### `GET /health`

Returns backend health status.

```json
{
  "ok": true,
  "service": "voxa-backend"
}
```

### `POST /api/dictate`

Receives audio file and returns transcription.

**Request**: `multipart/form-data` with `audio` field (webm/opus)

**Response**:

```json
{
  "text": "This is the transcribed text."
}
```

---

## Supported Websites

Voxa works on:

- Basic HTML pages with `<input>` and `<textarea>`
- ChatGPT and other AI chat interfaces
- Gmail and other email composers
- GitHub and developer tools
- Any website with standard editable elements

Third-party websites with custom editor implementations are supported on a best-effort basis.

---

## Error Handling

| Error | User Message |
|-------|--------------|
| Microphone denied | "Microphone access is required to dictate." |
| No speech detected | "No speech detected. Try again." |
| AssemblyAI error | "Voxa couldn't transcribe that. Try again." |
| Backend unavailable | "Voxa is temporarily unavailable." |

---

## Project Structure

```
voxa/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   └── services/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── extension/
│   ├── src/
│   │   ├── content/
│   │   │   ├── content.tsx
│   │   │   ├── popUnder.tsx
│   │   │   ├── recorder.ts
│   │   │   ├── textInsertion.ts
│   │   │   ├── focusDetection.ts
│   │   │   └── utils.ts
│   │   ├── popup/
│   │   │   ├── popup.tsx
│   │   │   └── popup.css
│   │   └── background/
│   │       └── serviceWorker.ts
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   ├── dist/                    # Built extension (load this)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vite.content.config.ts
├── package.json
└── README.md
```

---

## Troubleshooting

### Backend won't start

- Ensure `ASSEMBLYAI_API_KEY` is set in `backend/.env`
- Check that port 3000 is not in use

### Extension won't load

- Ensure `npm run build` has been run in the `extension/` directory
- Verify `manifest.json` exists in `extension/dist/`
- Check Chrome console for errors at `chrome://extensions`

### Dictation doesn't work

- Ensure the backend is running on port 3000
- Check that microphone permissions are granted
- Verify the AssemblyAI API key is valid

---

## Sponsor Voxa

Voxa is an open-source project, built and maintained in spare time. Sponsorships directly support continued development, the infrastructure and API costs behind transcription, day-to-day maintenance, and the roadmap of new features and improvements.

If Voxa saves you typing, here are two ways to keep the project going:

### Buy Me a Coffee

If Voxa has been useful to you, a one-time contribution is a simple way to say thanks and help cover running costs:

<script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="timothybayode" data-color="#FFDD00" data-emoji=""  data-font="Cookie" data-text="Buy me a coffee" data-outline-color="#000000" data-font-color="#000000" data-coffee-color="#ffffff" ></script>

<iframe src="https://github.com/sponsors/TimothyBayode/button" title="Sponsor TimothyBayode" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

Every contribution, big or small, helps keep Voxa independent and ad-free. Thank you for your support!

---

## License

MIT
