# Voxa — Development Documentation

Technical documentation for contributors. If you just want to *use* Voxa, see the [README](README.md).

---

## Architecture

```text
User speaks
    ↓
Chrome Extension (content script, raw 16-bit PCM capture via AudioWorklet)
    ↓
Voxa Backend (Express → AssemblyAI Dictation API)
    ↓
Transcript returned (cleaned up / translated via llm_instruction)
    ↓
Inserted into focused text field
```

**The AssemblyAI API key never leaves the backend.**

The extension captures raw 16-bit PCM (16 kHz, mono) through an `AudioWorkletProcessor` (with a `ScriptProcessorNode` fallback for pages whose CSP blocks blob modules), converts Float32 samples to Int16 LE, and uploads them as `audio/pcm` with `language` and `sampleRate` form fields. The backend wraps them in the Dictation API's `config`-first multipart request; for a non-English output language it adds an `llm_instruction` that translates the transcript while keeping the default cleanup behavior.

## Tech Stack

- **Extension**: React 18, TypeScript, Vite, Chrome Manifest V3 (content script + service worker + popup), plain CSS
- **Backend**: Node.js 18+, Express, Multer (in-memory), esbuild bundle
- **Audio**: raw PCM capture via AudioWorklet (ScriptProcessor fallback)
- **Transcription**: AssemblyAI Dictation API (`POST https://dictation.assemblyai.com/v1/transcribe/live`, called server-side over HTTP)

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- Chrome browser
- AssemblyAI API key (backend only)

## Setup

```bash
git clone https://github.com/TimothyBayode/Voxa
cd Voxa
npm install
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
PORT=3000
CORS_ORIGIN=*
```

`CORS_ORIGIN` (or leaving it unset, which defaults to `*`) makes the server reflect the requesting origin — required because content scripts make requests with the host page's origin.

## Development

```bash
npm run dev:backend     # backend on http://localhost:3000 (tsx watch)
npm run dev:extension   # extension watch build
npm run dev             # both
```

To test against a local backend, point the extension at it: `extension/src/content/recorder.ts` holds the backend URL in the `BACKEND_URL` constant (currently the production Render URL). Change it to `http://localhost:3000` for local development, rebuild, and reload the extension.

## Production build

```bash
npm run build --workspace=extension
```

Output lands in `extension/dist/` — this folder (its *contents*) is what gets zipped and distributed. The backend URL used by the built extension is the `BACKEND_URL` constant in `extension/src/content/recorder.ts`.

### Zipping for distribution

Zip the **contents** of `extension/dist` so that `manifest.json` sits at the root of the archive:

```bash
cd extension/dist
zip -r ../voxa-extension.zip . -x ".*"
```

## Backend deployment (Render)

The backend is deployed on Render's free tier:

- **Root Directory**: `backend`
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`
- **Environment variables**: `ASSEMBLYAI_API_KEY` (secret), `CORS_ORIGIN=*` (optional), `PORT` is injected by Render

Notes:

- `--include=dev` is required because Render sets `NODE_ENV=production`, which would otherwise skip the devDependencies (`tsc`, `esbuild`) needed to build.
- The esbuild bundle uses `--packages=external` so that all dependencies are imported from `node_modules` at runtime — bundling CJS dependencies into ESM output produces a `Dynamic require of ... is not supported` crash at startup.
- The free tier sleeps after ~15 minutes without inbound traffic; an external monitor pinging `/health` every 5 minutes keeps it awake (see below).

### Keeping the free-tier instance awake

Render sleeps instances with no inbound traffic for ~15 minutes; the next request then waits ~50 seconds for a spin-up. A free external monitor pinging the health endpoint every 5 minutes prevents this:

**Option A — cron-job.org**

1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. **Cronjobs → Create cronjob**
3. Title: `Voxa keep-alive`
4. URL: `https://voxa-vzrg.onrender.com/health` (your Render service URL + `/health`)
5. Schedule: **Every 5 minutes**
6. Save, then enable the job with the toggle

**Option B — UptimeRobot**

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free, 50 monitors)
2. **Add New Monitor** → type **HTTP(s)**
3. Friendly name: `Voxa keep-alive`
4. URL: `https://voxa-vzrg.onrender.com/health`
5. Interval: **5 minutes** → Create Monitor

Both services log response codes, so you also get a crude uptime history for the backend. Render's free tier includes ~750 instance-hours/month — a 24/7 instance needs ~744, so it fits within one month's allowance.

## API Endpoints

### `GET /health`

```json
{ "ok": true, "service": "voxa-backend" }
```

### `POST /api/dictate`

**Request**: `multipart/form-data` with fields:

| Field | Type | Description |
|---|---|---|
| `audio` | file (`audio/pcm`) | raw 16-bit PCM, mono |
| `language` | string | output language code (ISO 639-1 style, e.g. `en`, `pt`, `zh`) |
| `sampleRate` | number | PCM sample rate reported by the recorder (e.g. `16000`) |

**Response**:

```json
{ "text": "This is the transcribed text." }
```

The backend sends `language_codes` (steering) and — for non-English targets — an `llm_instruction` translating the transcript; it returns the rewritten `llm_response` when available, falling back to the verbatim `text`.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Persist user settings (language, enabled/disabled) |
| `activeTab` | Communicate with the current tab's content script |
| `contextMenus` | Right-click "Dictate with Voxa" action |
| `host_permissions: <all_urls>` | Detect editable elements and reach the backend from any page |

## Project Structure

```
voxa/
├── backend/
│   ├── src/
│   │   ├── server.ts               # Express app, /health, /api/dictate
│   │   └── services/
│   │       └── assemblyai.ts       # Dictation API client (config-first multipart)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── extension/
│   ├── src/
│   │   ├── background/
│   │   │   └── serviceWorker.ts    # hotkey + context menu, enable-state sync, icon/menu switching
│   │   ├── components/
│   │   │   └── types.ts
│   │   ├── content/
│   │   │   ├── content.tsx         # state machine, pop-under orchestration
│   │   │   ├── focusDetection.ts   # editable-field focus tracking
│   │   │   ├── popUnder.tsx        # pop-under UI (React, shadow DOM)
│   │   │   ├── recorder.ts         # PCM capture + upload
│   │   │   ├── textInsertion.ts    # transcript insertion
│   │   │   └── utils.ts
│   │   └── popup/
│   │       ├── popup.tsx           # enable toggle, output language, footer links
│   │       └── popup.css
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   ├── dist/                       # built extension (zipped for distribution)
│   ├── scripts/build.ts            # build orchestration
│   ├── vite.config.ts
│   └── vite.content.config.ts
├── package.json                    # npm workspaces root
└── README.md
```

## Developer Troubleshooting

**Build fails with `tsc: not found`** — run `npm install --include=dev` (NODE_ENV=production skips devDependencies).

**`Dynamic require of ... is not supported` at backend startup** — the esbuild bundle must keep `--packages=external`; never remove it.

**Dictation doesn't work locally** — ensure the backend is running and `BACKEND_URL` in `extension/src/content/recorder.ts` matches it; check microphone permissions.

**Extension won't load** — verify `extension/dist/manifest.json` exists and check for errors at `chrome://extensions`.

**Stale files in `extension/dist`** — the build does not empty the output dir; delete `extension/dist` and rebuild for a pristine artifact.
