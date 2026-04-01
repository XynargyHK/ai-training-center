/**
 * Self-hosted WhatsApp Gateway using Baileys
 * Drop-in replacement for Whapi ($35/mo → $0)
 *
 * Provides REST API compatible with our existing webhook code:
 * - POST /messages/text — send text message
 * - POST /messages/document — send document
 * - POST /messages/image — send image
 * - GET /status — connection status
 * - GET /qr — get QR code for auth
 *
 * Forwards incoming messages to webhook URL.
 */

const express = require('express')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://ai-training-center-production.up.railway.app/api/whatsapp/webhook'
const AUTH_DIR = path.join(__dirname, 'auth_info')

let sock = null
let qrCode = null
let connectionStatus = 'disconnected'

// ============================================================
// BAILEYS CONNECTION
// ============================================================
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['AI Staffs', 'Chrome', '120.0.0'],
  })

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds)

  // Connection events
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      qrCode = qr
      connectionStatus = 'waiting_qr'
      console.log('QR code generated — scan with WhatsApp Business app')
      // Also print to terminal
      try {
        require('qrcode-terminal').generate(qr, { small: true })
      } catch (e) {}
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log(`Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`)
      connectionStatus = 'disconnected'

      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(), 3000)
      } else {
        // Logged out — clear auth and require new QR scan
        console.log('Logged out — clearing auth. Need new QR scan.')
        if (fs.existsSync(AUTH_DIR)) {
          fs.rmSync(AUTH_DIR, { recursive: true })
        }
        setTimeout(() => connectToWhatsApp(), 3000)
      }
    }

    if (connection === 'open') {
      connectionStatus = 'connected'
      qrCode = null
      console.log('WhatsApp connected!')
    }
  })

  // Incoming messages → forward to webhook
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      // Skip own messages
      if (msg.key.fromMe) continue

      const sender = msg.key.remoteJid
      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   msg.message?.imageMessage?.caption ||
                   msg.message?.documentMessage?.caption || ''

      if (!text) continue

      console.log(`📱 Incoming from ${sender}: ${text.substring(0, 50)}...`)

      // Forward to webhook in Whapi-compatible format
      const webhookPayload = {
        messages: [{
          from: sender.replace('@s.whatsapp.net', ''),
          text: { body: text },
          id: msg.key.id,
          timestamp: msg.messageTimestamp,
          from_me: false,
        }]
      }

      try {
        await postJSON(WEBHOOK_URL, webhookPayload)
        console.log('✅ Forwarded to webhook')
      } catch (err) {
        console.error('❌ Webhook forward failed:', err.message)
      }
    }
  })
}

// ============================================================
// REST API — Whapi-compatible endpoints
// ============================================================

// Send text message
app.post('/messages/text', async (req, res) => {
  const { to, body } = req.body
  if (!to || !body) return res.status(400).json({ error: 'Missing to or body' })
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = formatJid(to)
    const result = await sock.sendMessage(jid, { text: body })
    res.json({ sent: true, message: { id: result.key.id, from: to } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send document
app.post('/messages/document', async (req, res) => {
  const { to, media, filename, caption } = req.body
  if (!to || !media) return res.status(400).json({ error: 'Missing to or media' })
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = formatJid(to)
    const buffer = await downloadMedia(media)
    const result = await sock.sendMessage(jid, {
      document: buffer,
      fileName: filename || 'document',
      caption: caption || '',
      mimetype: 'application/pdf',
    })
    res.json({ sent: true, message: { id: result.key.id } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send image
app.post('/messages/image', async (req, res) => {
  const { to, media, caption } = req.body
  if (!to || !media) return res.status(400).json({ error: 'Missing to or media' })
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = formatJid(to)
    const buffer = await downloadMedia(media)
    const result = await sock.sendMessage(jid, {
      image: buffer,
      caption: caption || '',
    })
    res.json({ sent: true, message: { id: result.key.id } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send video
app.post('/messages/video', async (req, res) => {
  const { to, media, caption } = req.body
  if (!to || !media) return res.status(400).json({ error: 'Missing to or media' })
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = formatJid(to)
    const buffer = await downloadMedia(media)
    const result = await sock.sendMessage(jid, {
      video: buffer,
      caption: caption || '',
    })
    res.json({ sent: true, message: { id: result.key.id } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Status endpoint
app.get('/status', (req, res) => {
  res.json({ status: connectionStatus, connected: connectionStatus === 'connected' })
})

// QR code endpoint (JSON)
app.get('/qr', (req, res) => {
  if (connectionStatus === 'connected') {
    return res.json({ status: 'connected', qr: null })
  }
  if (qrCode) {
    return res.json({ status: 'waiting_qr', qr: qrCode })
  }
  res.json({ status: connectionStatus, qr: null })
})

// Visual QR code page — open in browser to scan
app.get('/qr-page', async (req, res) => {
  if (connectionStatus === 'connected') {
    return res.send('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:2em;background:#0a0">✅ WhatsApp Connected!</body></html>')
  }
  if (!qrCode) {
    return res.send('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:1.5em"><p>No QR code yet. Waiting for WhatsApp...<br><a href="/qr-page">Refresh</a></p></body></html>')
  }

  // Generate QR as data URL using qrcode-terminal's underlying lib or inline SVG
  try {
    const QRCode = require('qrcode')
    const dataUrl = await QRCode.toDataURL(qrCode, { width: 400, margin: 2 })
    res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>WhatsApp QR</title></head>
<body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#111;color:#fff">
<h2>Scan with WhatsApp Business</h2>
<img src="${dataUrl}" style="border-radius:12px" />
<p style="color:#888;margin-top:16px">QR refreshes every ~20s. <a href="/qr-page" style="color:#25D366">Reload</a> if expired.</p>
<script>setTimeout(()=>location.reload(),15000)</script>
</body></html>`)
  } catch (e) {
    // Fallback if qrcode package not installed
    res.send(`<html><body style="font-family:monospace;padding:40px"><h2>QR Data (install 'qrcode' pkg for image)</h2><pre>${qrCode}</pre></body></html>`)
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', whatsapp: connectionStatus })
})

// ============================================================
// HELPERS
// ============================================================

function formatJid(phone) {
  // Remove + and spaces, add @s.whatsapp.net
  const clean = phone.replace(/[+\s\-]/g, '')
  if (clean.includes('@')) return clean
  return clean + '@s.whatsapp.net'
}

async function downloadMedia(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const body = JSON.stringify(data)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }
    const client = urlObj.protocol === 'https:' ? https : http
    const req = client.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`WhatsApp Gateway running on port ${PORT}`)
  console.log(`Webhook: ${WEBHOOK_URL}`)
  connectToWhatsApp()
})
