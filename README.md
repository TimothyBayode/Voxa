# Voxa

**Turn every text box into a microphone.**

## What is Voxa?

Voxa is a free Chrome extension that lets you type with your voice — on any website.

Click into any text box (email, chat, forms, comments — anywhere you can type), tell Voxa to listen, speak naturally, and your words appear as text. You can even pick an output language: speak English and have Portuguese, French, Japanese (or any of 80+ languages) inserted instead.

No accounts. No sign-ups. No configuration. Download, load into Chrome, and dictate.

---

## Features

- Dictate into any text input, textarea, or rich text editor on the web
- Real-time transcription powered by AssemblyAI
- Translate your speech into 80+ languages
- Minimal, unobtrusive pop-under UI
- Keyboard shortcut: `Alt + Shift + D`
- Works with modern web apps (Gmail, ChatGPT, Notion, and more)

---

## Installation

You only need **Google Chrome** and the **Voxa ZIP file**.

1. **Download** the Voxa extension: click [**Download voxa-extension.zip**](https://github.com/TimothyBayode/Voxa/raw/main/extension/voxa-extension.zip) — the ZIP file downloads to your computer.
2. **Extract** the ZIP file — right-click it and choose *Extract All* (Windows) or double-click it (Mac). Remember where you saved it.
3. **Open Google Chrome**.
4. In the address bar, type `chrome://extensions` and press **Enter**.
5. Turn on **Developer mode** — the toggle in the top-right corner of that page.
6. Click the **Load unpacked** button that appears at the top-left.
7. Select the **extracted Voxa folder** — the one that directly contains the file `manifest.json`.
8. Voxa now appears in your list of extensions. Click the **puzzle-piece icon** in Chrome's toolbar and **pin Voxa** for quick access.
9. **Open any website** you like.
10. **Click inside a text field**.
11. **Use Voxa** — see the next section.

> Chrome may show a "Developer mode extensions" notice — this is normal for extensions installed outside the Chrome Web Store and is safe to dismiss.

---

## Using Voxa

1. Click inside any text box on any website.
2. A small Voxa pop-under appears just below the field — **click it**, or press `Alt + Shift + D`.
3. The first time, Chrome asks for microphone access — click **Allow**.
4. Speak naturally. You'll see a red pulsing dot while Voxa listens.
5. Click the pop-under again (or press `Alt + Shift + D`) to stop.
6. Your words appear in the text field as text. Done!

**Choosing an output language:** click the Voxa icon in the toolbar to open the popup. Turn Voxa on or off, and pick an output language — for example, choose *Portuguese*, speak English, and Portuguese text is inserted.

---

## Troubleshooting

**Chrome says Developer mode is required**
That's expected. Voxa is installed outside the Chrome Web Store, so Chrome asks you to enable Developer mode — the toggle in the top-right of `chrome://extensions`. Leave it on.

**Voxa does not appear after installation**
Make sure you selected the folder that *directly* contains `manifest.json` (open the extracted ZIP folder first — don't select the ZIP itself). Then go to `chrome://extensions`, find Voxa, and click the **reload** (circular arrow) icon. Restarting Chrome also helps.

**Voxa does not appear on a particular page**
Refresh the page after installing Voxa. Voxa appears on pages with standard text boxes; a few sites use highly custom editors where the pop-under may not show — try the keyboard shortcut `Alt + Shift + D` while clicked into the field.

**Microphone permission is denied**
Click the icon on the left of the website's address bar → *Site settings* → set **Microphone** to *Allow* → reload the page. You can also check permissions at `chrome://settings/content/microphone`.

**Voxa stopped working or feels stuck**
Try these in order: wait a few seconds and try again → toggle Voxa off and on in the popup → reload the page → reload the extension at `chrome://extensions` (circular arrow icon).

**"Voxa is temporarily unavailable"**
Check your internet connection and try again in a moment — Voxa needs to reach its transcription service.

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

When you dictate, the captured audio is sent to Voxa's transcription backend, which forwards it to the [AssemblyAI](https://www.assemblyai.com/) Dictation API for speech-to-text processing. If you select an output language other than English, the returned transcript is rewritten into that language as part of the same request. The transcript is then inserted into the text field you dictated into:

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

Because transcription is performed by AssemblyAI, **your spoken content is processed by third-party infrastructure** that Voxa depends on to provide the service. AssemblyAI's handling of that data is governed by AssemblyAI's own terms and privacy policy, not by Voxa. Voxa's backend is hosted on Render and operated by the Voxa developer.

### What Voxa does not do

- Voxa does not run analytics, telemetry, or tracking of any kind.
- Voxa does not sell personal information.
- Voxa does not use dictated content for advertising, profiling, or model training of its own.
- Voxa has no user accounts and does not require sign-in.
- Voxa's backend does not write audio to disk or a database — audio is held in memory only for the duration of the transcription request, and transcripts are not stored or logged by it.

### What is stored locally

Voxa stores two settings in your browser's local extension storage (`chrome.storage.local`): whether Voxa is enabled, and your selected output language. Nothing else is persisted. This data stays on your device until you remove the extension or clear its data.

### API keys and configuration

The AssemblyAI API key used for transcription lives only on the Voxa backend. It is never embedded in the extension, never sent to your browser, and never included in requests from the extension. No other credentials or configuration data are handled.

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

Voxa is provided as-is under the MIT license. Communication with the transcription backend happens over HTTPS, but audio does leave your device during dictation, so avoid dictating highly sensitive information (passwords, financial details, health data) unless you are comfortable with the processing described above.

### Children's privacy

Voxa is not directed at children under 13 (or the equivalent minimum age in your jurisdiction), and Voxa does not knowingly collect personal information from children.

### Changes to this policy

This policy may be updated as Voxa evolves. Changes are published in this file, and the repository's commit history documents what changed and when.

### Contact

Questions or concerns about privacy? Open an issue at [github.com/TimothyBayode/Voxa/issues](https://github.com/TimothyBayode/Voxa/issues).

---

## Sponsor Voxa

Voxa is an open-source project, built and maintained in spare time. Sponsorships directly support continued development, the infrastructure and API costs behind transcription, day-to-day maintenance, and the roadmap of new features and improvements.

If Voxa saves you typing, here are two ways to keep the project going — a one-time coffee, or ongoing sponsorship through GitHub:

<p>
  <a href="https://buymeacoffee.com/timothybayode" target="_blank" rel="noopener"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="32"></a>&nbsp;&nbsp;
  <a href="https://github.com/sponsors/TimothyBayode" target="_blank" rel="noopener"><img src="https://img.shields.io/badge/Sponsor-EA4AAA?style=flat-square&logo=githubsponsors&logoColor=white" alt="Sponsor TimothyBayode" height="32"></a>
</p>

Every contribution, big or small, helps keep Voxa independent and ad-free. Thank you for your support!

---

## License

MIT

---

## For Developers

Want to run Voxa locally, deploy your own backend, or contribute to the codebase? All technical documentation — architecture, setup, development commands, and deployment — lives in [DEVELOPMENT.md](DEVELOPMENT.md).

Users don't need any of this: the extension works out of the box because the backend is already hosted and running.

---

Technical documentation for contributors (architecture, backend setup, deployment, API reference) lives in [DEVELOPMENT.md](DEVELOPMENT.md).
