// Test script: Twilio calls your phone, AI speaks to you
require('dotenv').config({ path: '.env.local' })

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-training-center-production.up.railway.app'

const FROM = '+14782888766' // Twilio US number
const TO = '+85294740952'   // verified HK number for trial testing

async function makeCall() {
  console.log(`Calling ${TO} from ${FROM}...`)

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: TO,
        From: FROM, // verified caller ID
        Url: `${appUrl}/api/voice/inbound?businessUnitId=77313e61-2a19-4f3e-823b-80390dde8bd2`,
        Method: 'POST'
      })
    }
  )

  const data = await response.json()
  if (response.ok) {
    console.log('✅ Call initiated!')
    console.log('   SID:', data.sid)
    console.log('   Status:', data.status)
    console.log('   Pick up your phone!')
  } else {
    console.error('❌ Failed:', data.message || JSON.stringify(data))
  }
}

makeCall()
