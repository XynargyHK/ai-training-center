'use client'

export default function DemoPage() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>AIStaffs Demo</h1>
        <p style={{ color: '#666', fontSize: 15 }}>
          AI employee for SPA Collection — handles WhatsApp, voice calls,
          bookings, upselling, multilingual support. 24/7, never sleeps.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <a
          href="https://wa.me/85294740952?text=Hi"
          target="_blank"
          style={{
            display: 'block', padding: '20px 24px', background: '#25D366', color: 'white',
            borderRadius: 12, textDecoration: 'none', fontSize: 17, fontWeight: 600,
            textAlign: 'center',
          }}
        >
          WhatsApp AI Chat
          <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>
            Message SPA Collection — AI responds instantly
          </div>
        </a>

        <a
          href="/voiceapr9web"
          target="_blank"
          style={{
            display: 'block', padding: '20px 24px', background: '#007bff', color: 'white',
            borderRadius: 12, textDecoration: 'none', fontSize: 17, fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Voice AI (Multilingual)
          <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>
            Speak English, Cantonese, Mandarin — AI auto-detects and responds
          </div>
        </a>

        <a
          href="/voicecantonese"
          target="_blank"
          style={{
            display: 'block', padding: '20px 24px', background: '#28a745', color: 'white',
            borderRadius: 12, textDecoration: 'none', fontSize: 17, fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Phone Call (Cantonese)
          <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>
            AI calls your phone and speaks Cantonese — select voice and speed
          </div>
        </a>

        <a
          href="/voice5922922"
          target="_blank"
          style={{
            display: 'block', padding: '20px 24px', background: '#6f42c1', color: 'white',
            borderRadius: 12, textDecoration: 'none', fontSize: 17, fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Phone Call (Original Cantonese)
          <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>
            Confirmed working — WanLung male voice, Azure zh-HK STT
          </div>
        </a>

      </div>

      <div style={{ marginTop: 32, padding: 20, background: '#f9f9f9', borderRadius: 12, fontSize: 13, color: '#555' }}>
        <h3 style={{ marginTop: 0, fontSize: 15, color: '#333' }}>What this demo shows</h3>
        <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
          <li><strong>WhatsApp AI:</strong> Welcome menu, booking flow, service info, upselling, multilingual (EN/ZH/YUE)</li>
          <li><strong>Voice AI:</strong> Real-time conversation, auto-detect language, auto-swap voice per language</li>
          <li><strong>Phone:</strong> AI calls your phone, speaks Cantonese, confirms appointments</li>
          <li><strong>Memory:</strong> AI remembers conversation history across sessions</li>
          <li><strong>All channels:</strong> Same AI brain, same customer data, unified in Supabase</li>
        </ul>

        <h3 style={{ fontSize: 15, color: '#333' }}>Tech stack</h3>
        <p style={{ lineHeight: 1.6 }}>
          Pipecat + LiveKit WebRTC + Azure Auto-Detect STT (9 languages) + Gemini 2.0 Flash +
          Azure TTS (auto-swap: Jenny / HiuMaan / Xiaoxiao / HoaiMy / Nanami) +
          WhatsApp via Baileys Gateway + Supabase + Railway Singapore
        </p>
      </div>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#999' }}>
        aistaffs.app — AI employees for every small business
      </div>
    </div>
  )
}
