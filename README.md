# Voxa

**Turn every text box into a microphone.**

Voxa is a Chrome extension that brings voice dictation to every text input on the web. Focus any text field and press `Ctrl + Shift + D` to start dictating with AssemblyAI's real-time transcription API.

---

## Features

- Dictate into any text input, textarea, or contenteditable element
- Real-time transcription via AssemblyAI Dictation API
- Minimal, unobtrusive pop-under UI
- Keyboard shortcut: `Ctrl + Shift + D`
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
3. Press `Ctrl + Shift + D` (or click the pop-under)
4. Allow microphone access when prompted (first time only)
5. Speak naturally
6. Press `Ctrl + Shift + D` again to stop
7. Your transcript appears in the text field

---

## Privacy

Voxa only sends audio to the backend when the user explicitly starts dictation. Audio is not stored or logged. The data flow is:

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

## License

MIT
