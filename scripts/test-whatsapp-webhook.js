const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testWebhook() {
  const webhookUrl = 'http://localhost:3000/api/whatsapp/webhook';
  
  // Simulated Whapi/Gateway payload
  const payload = {
    messages: [
      {
        from: '85296099766', // Test sender
        text: {
          body: '#AI Hello Sarah, I am interested in your services.'
        }
      }
    ],
    phone_id: '1234567890' // This matches a whatsapp_phone_number_id in DB
  };

  console.log('🚀 Sending test payload to:', webhookUrl);
  
  try {
    const response = await axios.post(webhookUrl, payload);
    console.log('✅ Webhook Response:', response.data);
  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
  }
}

testWebhook();
