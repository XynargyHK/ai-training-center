'use client'

import { useState, useEffect, useCallback } from 'react'

const GATEWAY_URL = 'https://vigilant-magic-production.up.railway.app'

const STEPS = [
  { id: 1, label: 'Business Info' },
  { id: 2, label: 'Connect WhatsApp' },
  { id: 3, label: 'Upload Knowledge' },
  { id: 4, label: 'Go Live' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    businessName: '',
    industry: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    language: 'en',
    skills: [] as string[],
  })
  const [files, setFiles] = useState<File[]>([])
  const [waScanComplete, setWaScanComplete] = useState(false)
  const [qrCountdown, setQrCountdown] = useState(20)
  const [qrKey, setQrKey] = useState(0) // force img reload
  const [waStatus, setWaStatus] = useState<'loading' | 'waiting_qr' | 'connected' | 'error'>('loading')

  // Poll gateway status when on step 2
  useEffect(() => {
    if (step !== 2 || waScanComplete) return
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/qr`)
        const data = await res.json()
        if (data.status === 'connected') {
          setWaScanComplete(true)
          setWaStatus('connected')
        } else if (data.qr) {
          setWaStatus('waiting_qr')
        } else {
          setWaStatus('loading')
        }
      } catch { setWaStatus('error') }
    }, 3000)
    return () => clearInterval(poll)
  }, [step, waScanComplete])

  // QR countdown timer — refresh image every 15s
  useEffect(() => {
    if (step !== 2 || waScanComplete) return
    const timer = setInterval(() => {
      setQrCountdown(c => {
        if (c <= 1) {
          setQrKey(k => k + 1) // force reload QR image
          return 15
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, waScanComplete])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [wantPhone, setWantPhone] = useState(false)

  const AVAILABLE_SKILLS = [
    { id: 'receptionist', label: 'Receptionist / Front Desk', desc: 'Greet customers, answer general questions' },
    { id: 'booking', label: 'Appointment Booking', desc: 'Schedule, confirm, reschedule appointments' },
    { id: 'sales', label: 'Sales & Upselling', desc: 'Recommend products, upsell, cross-sell' },
    { id: 'support', label: 'Customer Support', desc: 'Handle complaints, troubleshooting, FAQs' },
    { id: 'followup', label: 'Follow-up & Retention', desc: 'Post-visit check-ins, reminders, win-back' },
    { id: 'multilingual', label: 'Multilingual', desc: 'Auto-detect and respond in customer language' },
    { id: 'vision', label: 'Photo Analysis', desc: 'Analyze customer photos (skin, products, etc.)' },
    { id: 'content', label: 'Content Creation', desc: 'Generate social posts, captions, promotions' },
  ]

  const toggleSkill = (id: string) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(id) ? f.skills.filter(s => s !== id) : [...f.skills, id]
    }))
  }

  const canProceed = () => {
    if (step === 1) return form.businessName.trim() && form.industry.trim() && form.skills.length > 0
    if (step === 2) return waScanComplete
    if (step === 3) return true
    return true
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {STEPS.map(s => (
          <div key={s.id} style={{
            flex: 1, textAlign: 'center', padding: '12px 4px',
            background: step === s.id ? '#007bff' : step > s.id ? '#28a745' : '#e9ecef',
            color: step >= s.id ? 'white' : '#666',
            borderRadius: s.id === 1 ? '8px 0 0 8px' : s.id === STEPS.length ? '0 8px 8px 0' : 0,
            fontSize: 13, fontWeight: step === s.id ? 700 : 400,
            cursor: step > s.id ? 'pointer' : 'default',
          }}
            onClick={() => { if (step > s.id) setStep(s.id) }}
          >
            {step > s.id ? '\u2713 ' : ''}{s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: Business Info */}
      {step === 1 && (
        <div>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Set up your AI employee</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Tell us about your business. Your AI will use this to greet customers and understand your services.
          </p>

          <label style={labelStyle}>Business Name *</label>
          <input value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})}
            placeholder="e.g. SPA Collection" style={inputStyle} />

          <label style={labelStyle}>Industry *</label>
          <select value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} style={inputStyle}>
            <option value="">Select your industry</option>
            <option value="beauty">Beauty & Wellness</option>
            <option value="health">Healthcare & Medical</option>
            <option value="food">Food & Beverage</option>
            <option value="retail">Retail & E-commerce</option>
            <option value="education">Education & Training</option>
            <option value="fitness">Fitness & Sports</option>
            <option value="realestate">Real Estate</option>
            <option value="professional">Professional Services</option>
            <option value="other">Other</option>
          </select>

          <label style={labelStyle}>Brief Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            placeholder="What does your business do? What services/products do you offer?"
            rows={3} style={{...inputStyle, resize: 'vertical'}} />

          <label style={labelStyle}>Your Name</label>
          <input value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})}
            placeholder="Your name" style={inputStyle} />

          <label style={labelStyle}>Primary Language</label>
          <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} style={inputStyle}>
            <option value="en">English</option>
            <option value="yue">Cantonese</option>
            <option value="zh">Mandarin</option>
            <option value="auto">Auto-detect (multilingual)</option>
          </select>

          <label style={{...labelStyle, marginTop: 24}}>AI Skills * (select what your AI should do)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {AVAILABLE_SKILLS.map(skill => (
              <div key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                style={{
                  padding: '12px', borderRadius: 8, cursor: 'pointer',
                  border: form.skills.includes(skill.id) ? '2px solid #007bff' : '2px solid #e0e0e0',
                  background: form.skills.includes(skill.id) ? '#f0f7ff' : 'white',
                }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {form.skills.includes(skill.id) ? '\u2713 ' : ''}{skill.label}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{skill.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Connect WhatsApp */}
      {step === 2 && (
        <div>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Connect your WhatsApp</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Link your WhatsApp Business number so your AI can respond to customer messages automatically.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 24 }}>
            {waScanComplete ? (
              <>
                <div style={{ fontSize: 64, lineHeight: 1 }}>✅</div>
                <h3 style={{ color: '#28a745' }}>WhatsApp Connected!</h3>
                <p style={{ color: '#666', fontSize: 14 }}>
                  Your AI is now linked to your WhatsApp Business number. Customers who message you will get instant AI responses.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ marginTop: 0 }}>Scan QR Code with WhatsApp</h3>
                <p style={{ color: '#666', fontSize: 13, maxWidth: 320, margin: '0 auto 16px' }}>
                  On your business phone: <strong>WhatsApp → Settings → Linked Devices → Link a Device</strong> → point camera at this QR
                </p>
                {waStatus === 'waiting_qr' ? (
                  <>
                    <img
                      key={qrKey}
                      src={`${GATEWAY_URL}/qr-image?t=${qrKey}`}
                      alt="WhatsApp QR Code"
                      style={{ width: 220, height: 220, margin: '0 auto 12px', borderRadius: 8, display: 'block' }}
                    />
                    <div style={{ fontSize: 13, color: '#888' }}>
                      Refreshing in <strong>{qrCountdown}s</strong> — QR expires every ~20 seconds
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      key={qrKey}
                      src={`${GATEWAY_URL}/qr-image?t=${qrKey}`}
                      alt="WhatsApp QR Code"
                      style={{ width: 220, height: 220, margin: '0 auto 12px', borderRadius: 8, display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).alt = 'QR loading...' }}
                    />
                    <div style={{ fontSize: 13, color: '#888' }}>
                      {waStatus === 'loading' ? 'Connecting...' : 'Refreshing...'} ({qrCountdown}s)
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div style={{ padding: 16, background: '#fff3cd', borderRadius: 8, fontSize: 13 }}>
            <strong>Tip:</strong> Use your WhatsApp Business number (not personal). This way your AI handles business messages while your personal WhatsApp stays private.
          </div>
        </div>
      )}

      {/* STEP 3: Upload Knowledge */}
      {step === 3 && (
        <div>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Teach your AI about your business</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Upload any documents about your business — service menus, product catalogs, price lists, FAQs, training manuals. Your AI will learn from them instantly.
          </p>

          <div style={{
            border: '2px dashed #ccc', borderRadius: 12, padding: 40, textAlign: 'center',
            cursor: 'pointer', marginBottom: 16, background: files.length > 0 ? '#f0fff0' : '#fafafa'
          }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input id="file-upload" type="file" multiple accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.jpg,.png"
              style={{ display: 'none' }}
              onChange={e => setFiles(Array.from(e.target.files || []))} />
            {files.length === 0 ? (
              <>
                <div style={{ fontSize: 48 }}>📄</div>
                <p style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>
                  Drop files here or tap to upload
                </p>
                <p style={{ fontSize: 13, color: '#888' }}>
                  PDF, Word, Excel, images, text files — any format
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48 }}>✅</div>
                <p style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
                {files.map((f, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#666' }}>{f.name} ({(f.size / 1024).toFixed(0)} KB)</div>
                ))}
                <p style={{ fontSize: 13, color: '#007bff', marginTop: 8 }}>Tap to add more</p>
              </>
            )}
          </div>

          <div style={{ padding: 16, background: '#e8f4ff', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            <strong>What to upload:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Service menu with prices</li>
              <li>Product catalog</li>
              <li>Business hours, location, contact info</li>
              <li>FAQ or common customer questions</li>
              <li>Staff training manual</li>
              <li>Aftercare guides, product instructions</li>
            </ul>
          </div>

          <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8, fontSize: 13 }}>
            <strong>No documents ready?</strong> No problem — you can skip this and add them later from the dashboard. Your AI will still work using your business description from Step 1.
          </div>
        </div>
      )}

      {/* STEP 4: Go Live */}
      {step === 4 && (
        <div>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>You're all set!</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Your AI employee is ready to work. Here's what's live:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <div style={summaryCard}>
              <span style={{ fontSize: 24 }}>💬</span>
              <div>
                <div style={{ fontWeight: 600 }}>WhatsApp AI — Live</div>
                <div style={{ fontSize: 13, color: '#666' }}>Customers who message you get instant AI responses</div>
              </div>
            </div>
            <div style={summaryCard}>
              <span style={{ fontSize: 24 }}>🧠</span>
              <div>
                <div style={{ fontWeight: 600 }}>{form.skills.length} Skills Active</div>
                <div style={{ fontSize: 13, color: '#666' }}>{form.skills.join(', ')}</div>
              </div>
            </div>
            {files.length > 0 && (
              <div style={summaryCard}>
                <span style={{ fontSize: 24 }}>📚</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{files.length} Knowledge Files Uploaded</div>
                  <div style={{ fontSize: 13, color: '#666' }}>AI has learned from your business documents</div>
                </div>
              </div>
            )}
          </div>

          {/* Optional: Phone Voice AI */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>📞</span>
              <div>
                <div style={{ fontWeight: 600 }}>Add Voice AI (Optional)</div>
                <div style={{ fontSize: 13, color: '#666' }}>Let customers talk to your AI by voice — through browser or phone call</div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
              <input type="checkbox" checked={wantPhone} onChange={e => setWantPhone(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Enable Voice AI for my business</span>
            </label>

            {wantPhone && (
              <div>
                <label style={labelStyle}>Phone number for outbound AI calls (optional)</label>
                <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+852 XXXX XXXX" style={inputStyle} />
                <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  If provided, your AI can make outbound calls to confirm bookings, follow up with customers, etc.
                  Web-based voice AI works without a phone number.
                </p>
              </div>
            )}
          </div>

          {/* Share links */}
          <div style={{ background: '#f0f7ff', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Share with your customers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: 8 }}>
                <span style={{ fontSize: 13 }}>WhatsApp link</span>
                <code style={{ fontSize: 12, color: '#007bff' }}>wa.me/852{form.contactPhone || 'XXXXXXXX'}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: 8 }}>
                <span style={{ fontSize: 13 }}>Voice AI link</span>
                <code style={{ fontSize: 12, color: '#007bff' }}>aistaffs.app/chat/{form.businessName.toLowerCase().replace(/\s+/g, '-') || 'your-business'}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: 8 }}>
                <span style={{ fontSize: 13 }}>QR Code</span>
                <span style={{ fontSize: 12, color: '#007bff', cursor: 'pointer' }}>Download QR</span>
              </div>
            </div>
          </div>

          <button style={{...btnStyle, background: '#007bff', width: '100%', padding: '16px 24px', fontSize: 18}}>
            Open Dashboard
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      {step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{...btnStyle, background: '#6c757d'}}>
              Back
            </button>
          ) : <div />}
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
            style={{...btnStyle, background: canProceed() ? '#007bff' : '#ccc', cursor: canProceed() ? 'pointer' : 'not-allowed'}}>
            {step === 3 ? (files.length > 0 ? 'Upload & Continue' : 'Skip for now') : 'Continue'}
          </button>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, color: '#555', marginBottom: 4, marginTop: 16, fontWeight: 600,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 12, fontSize: 15, border: '1px solid #ccc', borderRadius: 8, boxSizing: 'border-box',
}
const btnStyle: React.CSSProperties = {
  padding: '12px 24px', fontSize: 15, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
}
const summaryCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f9f9f9', borderRadius: 12,
}
