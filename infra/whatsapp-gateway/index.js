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
const ALERT_NUMBER = '85294740952'

let sock = null
let qrCode = null
let connectionStatus = 'disconnected'
let lastAlertTime = 0

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

      // Alert: WhatsApp disconnected (max once per 5 min)
      const now = Date.now()
      if (now - lastAlertTime > 5 * 60 * 1000) {
        lastAlertTime = now
        console.log('⚠️ Sending disconnect alert...')
        // Can't send WhatsApp since we're disconnected — will alert on reconnect
      }

      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(), 3000)
      } else {
        // Logged out — clear auth and require new QR scan
        console.log('🚨 LOGGED OUT — clearing auth. Need new QR scan.')
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

      // Alert: Send reconnection notice if we were disconnected
      if (lastAlertTime > 0) {
        const downtime = Math.round((Date.now() - lastAlertTime) / 1000)
        setTimeout(async () => {
          try {
            const jid = ALERT_NUMBER + '@s.whatsapp.net'
            await sock.sendMessage(jid, {
              text: `⚠️ WhatsApp Gateway Alert\n\nGateway was disconnected and has reconnected.\nDowntime: ~${downtime}s\nStatus: Back online ✅\nTime: ${new Date().toISOString()}`
            })
            console.log('✅ Reconnect alert sent to ' + ALERT_NUMBER)
          } catch (e) {
            console.error('Failed to send alert:', e.message)
          }
          lastAlertTime = 0
        }, 3000) // Wait 3s after connect before sending
      }
    }
  })

  // Incoming messages → forward to webhook
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      // Skip own messages
      if (msg.key.fromMe) continue

      const remoteJid = msg.key.remoteJid
      const isGroup = remoteJid.endsWith('@g.us')
      const participant = msg.key.participant || null // Who sent in group

      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   msg.message?.imageMessage?.caption ||
                   msg.message?.documentMessage?.caption || ''

      if (!text) continue

      // For DMs: sender = remoteJid (the person)
      // For groups: sender = remoteJid (the group), participant = who sent it
      const sender = remoteJid

      if (isGroup) {
        console.log(`👥 Group ${sender} | ${participant}: ${text.substring(0, 50)}...`)
      } else {
        console.log(`📱 DM from ${sender}: ${text.substring(0, 50)}...`)
      }

      // Forward to webhook with group context
      const webhookPayload = {
        messages: [{
          from: sender,
          text: { body: text },
          id: msg.key.id,
          timestamp: msg.messageTimestamp,
          from_me: false,
          // Group-specific fields
          is_group: isGroup,
          group_id: isGroup ? remoteJid : null,
          participant: participant, // Individual sender in group
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

// ============================================================
// GROUP ENDPOINTS
// ============================================================

// Send text to group
app.post('/groups/text', async (req, res) => {
  const { group_id, body } = req.body
  if (!group_id || !body) return res.status(400).json({ error: 'Missing group_id or body' })
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = group_id.includes('@') ? group_id : group_id + '@g.us'
    const result = await sock.sendMessage(jid, { text: body })
    res.json({ sent: true, message: { id: result.key.id, group: jid } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send image to group
app.post('/groups/image', async (req, res) => {
  const { group_id, media, caption } = req.body
  if (!group_id || !media) return res.status(400).json({ error: 'Missing group_id or media' })
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = group_id.includes('@') ? group_id : group_id + '@g.us'
    const buffer = await downloadMedia(media)
    const result = await sock.sendMessage(jid, { image: buffer, caption: caption || '' })
    res.json({ sent: true, message: { id: result.key.id, group: jid } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send video to group
app.post('/groups/video', async (req, res) => {
  const { group_id, media, caption } = req.body
  if (!group_id || !media) return res.status(400).json({ error: 'Missing group_id or media' })
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = group_id.includes('@') ? group_id : group_id + '@g.us'
    const buffer = await downloadMedia(media)
    const result = await sock.sendMessage(jid, { video: buffer, caption: caption || '' })
    res.json({ sent: true, message: { id: result.key.id, group: jid } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create a new group
app.post('/groups/create', async (req, res) => {
  const { name, participants } = req.body
  if (!name || !participants || !participants.length) {
    return res.status(400).json({ error: 'Missing name or participants array' })
  }
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jids = participants.map(p => formatJid(p))
    const group = await sock.groupCreate(name, jids)
    res.json({ created: true, group_id: group.id, name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get group info (members, name, etc.)
app.get('/groups/:groupId/info', async (req, res) => {
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const jid = req.params.groupId.includes('@') ? req.params.groupId : req.params.groupId + '@g.us'
    const metadata = await sock.groupMetadata(jid)
    res.json({
      id: metadata.id,
      name: metadata.subject,
      description: metadata.desc,
      owner: metadata.owner,
      participants: metadata.participants.map(p => ({
        id: p.id,
        admin: p.admin || null,
      })),
      size: metadata.size || metadata.participants.length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// List all groups
app.get('/groups', async (req, res) => {
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected' })
  }

  try {
    const groups = await sock.groupFetchAllParticipating()
    const list = Object.values(groups).map(g => ({
      id: g.id,
      name: g.subject,
      size: g.participants?.length || 0,
    }))
    res.json({ groups: list, count: list.length })
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
// PERIODIC HEALTH CHECK (every 10 min)
// ============================================================
setInterval(async () => {
  if (connectionStatus !== 'connected' || !sock) {
    console.log('⚠️ Health check: WhatsApp not connected')
    return
  }

  // Check if webhook is reachable
  try {
    const res = await new Promise((resolve, reject) => {
      const urlObj = new URL(WEBHOOK_URL)
      const client = urlObj.protocol === 'https:' ? https : http
      const req = client.get(WEBHOOK_URL, { timeout: 10000 }, (res) => resolve(res))
      req.on('error', reject)
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    })
    console.log(`✅ Health check: WA=${connectionStatus}, Webhook=${res.statusCode}`)
  } catch (err) {
    console.error(`🚨 Health check FAILED: Webhook unreachable — ${err.message}`)
    // Alert via WhatsApp
    try {
      const jid = ALERT_NUMBER + '@s.whatsapp.net'
      await sock.sendMessage(jid, {
        text: `🚨 Gateway Health Alert\n\nWebhook unreachable: ${WEBHOOK_URL}\nError: ${err.message}\nTime: ${new Date().toISOString()}\n\nIncoming WhatsApp messages will NOT get AI responses until this is fixed.`
      })
    } catch (e) {}
  }
}, 10 * 60 * 1000) // Every 10 minutes

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`WhatsApp Gateway running on port ${PORT}`)
  console.log(`Webhook: ${WEBHOOK_URL}`)
  console.log(`Alerts: ${ALERT_NUMBER}`)
  connectToWhatsApp()
})
