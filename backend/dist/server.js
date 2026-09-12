// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

// src/services/assemblyai.ts
var DICTATION_ENDPOINT = "https://dictation.assemblyai.com/v1/transcribe/live";
var REQUEST_TIMEOUT_MS = 9e4;
var STEERING_CODES = /* @__PURE__ */ new Set([
  "en",
  "es",
  "de",
  "fr",
  "it",
  "pt",
  "tr",
  "nl",
  "sv",
  "no",
  "da",
  "fi",
  "hi",
  "vi",
  "ar",
  "he",
  "ja",
  "ur",
  "zh"
]);
var TRANSLATION_LANGUAGES = {
  en: "English",
  sq: "Albanian",
  am: "Amharic",
  ar: "Arabic",
  hy: "Armenian",
  as: "Assamese",
  az: "Azerbaijani",
  eu: "Basque",
  be: "Belarusian",
  bn: "Bengali",
  bs: "Bosnian",
  bg: "Bulgarian",
  ca: "Catalan",
  zh: "Chinese",
  hr: "Croatian",
  cs: "Czech",
  da: "Danish",
  nl: "Dutch",
  en_au: "Australian English",
  en_uk: "British English",
  en_us: "US English",
  et: "Estonian",
  fi: "Finnish",
  fr: "French",
  gl: "Galician",
  ka: "Georgian",
  de: "German",
  el: "Greek",
  gu: "Gujarati",
  ht: "Haitian",
  ha: "Hausa",
  haw: "Hawaiian",
  he: "Hebrew",
  hi: "Hindi",
  hu: "Hungarian",
  is: "Icelandic",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  jw: "Javanese",
  kn: "Kannada",
  kk: "Kazakh",
  ko: "Korean",
  lo: "Lao",
  la: "Latin",
  lv: "Latvian",
  lt: "Lithuanian",
  lb: "Luxembourgish",
  mk: "Macedonian",
  mg: "Malagasy",
  ms: "Malay",
  ml: "Malayalam",
  mt: "Maltese",
  mi: "Maori",
  mr: "Marathi",
  mn: "Mongolian",
  ne: "Nepali",
  no: "Norwegian",
  pa: "Panjabi",
  ps: "Pashto",
  fa: "Persian",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sr: "Serbian",
  sn: "Shona",
  sd: "Sindhi",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  so: "Somali",
  es: "Spanish",
  su: "Sundanese",
  sw: "Swahili",
  sv: "Swedish",
  tl: "Tagalog",
  tg: "Tajik",
  ta: "Tamil",
  te: "Telugu",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  cy: "Welsh",
  yi: "Yiddish",
  yo: "Yoruba"
};
function buildTranslationInstruction(languageName) {
  return `Translate the transcript to ${languageName}. Remove filler words, resolve self-corrections to what the speaker landed on, and apply proper punctuation and capitalization. Keep names and technical terms verbatim.`;
}
async function transcribeAudio(audioBuffer, targetLanguage = "en", sampleRate = 16e3) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error("AssemblyAI API key not configured");
  }
  const target = TRANSLATION_LANGUAGES[targetLanguage] ? targetLanguage : "en";
  const rate = Number.isFinite(sampleRate) && sampleRate >= 8e3 && sampleRate <= 48e3 ? Math.round(sampleRate) : 16e3;
  const steering = target !== "en" && STEERING_CODES.has(target) ? [target, "en"] : ["en"];
  const config = {
    language_codes: steering,
    sample_rate: rate,
    channels: 1
  };
  if (target !== "en") {
    config.llm_instruction = buildTranslationInstruction(TRANSLATION_LANGUAGES[target]);
  }
  const form = new FormData();
  form.append("config", new Blob([JSON.stringify(config)], { type: "application/json" }));
  form.append("audio", new Blob([new Uint8Array(audioBuffer)], { type: "audio/pcm" }), "audio");
  let response;
  try {
    response = await fetch(DICTATION_ENDPOINT, {
      method: "POST",
      headers: { Authorization: apiKey },
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error("Transcription timeout");
    }
    throw new Error("Could not reach AssemblyAI: " + (error?.message || "network error"));
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(describeApiError(response.status, body));
  }
  const text = typeof body?.text === "string" ? body.text : "";
  const llmResponse = typeof body?.llm_response === "string" ? body.llm_response : null;
  return { text, llmResponse };
}
function describeApiError(status, body) {
  const detail = typeof body?.error === "string" && body.error || typeof body?.detail === "string" && body.detail || typeof body?.title === "string" && body.title || "Unknown error";
  if (status === 404) return `AssemblyAI rejected the API key (404): ${detail}`;
  if (status === 415) return `AssemblyAI rejected the audio format (415): ${detail}`;
  return `AssemblyAI error (HTTP ${status}): ${detail}`;
}

// src/server.ts
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
var corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin === "*" || corsOrigin === "chrome-extension://*" ? true : corsOrigin.split(",").map((o) => o.trim())
  })
);
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "voxa-backend" });
});
app.post("/api/dictate", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }
    const language = typeof req.body.language === "string" ? req.body.language : "en";
    const sampleRate = Number.parseInt(req.body.sampleRate, 10) || 16e3;
    const result = await transcribeAudio(req.file.buffer, language, sampleRate);
    res.json({ text: result.llmResponse ?? result.text });
  } catch (error) {
    console.error("Dictation error:", error);
    res.status(500).json({ error: error?.message || "Transcription failed" });
  }
});
app.listen(PORT, () => {
  console.log(`Voxa backend running on port ${PORT}`);
});
