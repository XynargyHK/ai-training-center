require('dotenv').config({ path: '.env.local' });

async function testAIChatAPI() {
    console.log('🧪 TESTING AI CHAT API FOR BREAST GUARDIAN...');
    
    const payload = {
        businessUnitId: 'breast-guardian', // The slug we expect to be resolved
        message: 'What is the BioRhythm system?',
        conversationHistory: [],
        language: 'en',
        country: 'HK'
    };

    try {
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ API ERROR:', result.error);
            return;
        }

        console.log('\n--- AI RESPONSE ---');
        console.log(result.response);
        
        console.log('\n--- DEBUG INFO ---');
        console.log(result.debug);

        if (result.debug && result.debug.knowledgeCount > 0) {
            console.log('\n✅ SUCCESS: AI found knowledge in the Breast Guardian drawer!');
        } else {
            console.warn('\n⚠️  WARNING: AI returned a response but knowledgeCount is 0.');
            console.log('This means the AI is answering from its general knowledge, not your documents.');
        }

    } catch (err) {
        console.error('\n💥 TEST FAILED: Ensure the server is running (npm run dev)');
        console.error(err.message);
    }
}

testAIChatAPI();
