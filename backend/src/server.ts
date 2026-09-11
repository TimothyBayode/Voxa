import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { transcribeAudio } from './services/assemblyai.js'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({ origin: corsOrigin }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'voxa-backend' })
})

app.post('/api/dictate', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    const language = typeof req.body.language === 'string' ? req.body.language : 'en'
    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype, language)

    res.json({ text: transcript })
  } catch (error: any) {
    console.error('Dictation error:', error)
    res.status(500).json({ error: 'Transcription failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Voxa backend running on port ${PORT}`)
})
