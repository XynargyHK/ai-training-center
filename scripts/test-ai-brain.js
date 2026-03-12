const { generateSiloedResponse } = require('../src/lib/ai-engine');
require('dotenv').config({ path: '.env.local' });

async function testBreastGuardian() {
    console.log('🧪 TESTING AI ENGINE FOR BREAST GUARDIAN...');
    
    try {
        const result = await generateSiloedResponse({
            businessUnitId: 'breast-guardian', // Using the slug
            message: 'What is the BioRhythm system?',
            conversationHistory: [],
            language: 'en'
        });

        console.log('\n--- AI RESPONSE ---');
        console.log(result.response);
        console.log('\n--- CONTEXT USED ---');
        console.log(result.contextUsed);

        if (result.contextUsed.knowledgeCount > 0) {
            console.log('\n✅ SUCCESS: AI found knowledge in the Breast Guardian drawer!');
        } else {
            console.error('\n❌ FAILURE: AI still found 0 knowledge entries.');
        }

    } catch (err) {
        console.error('\n💥 TEST CRASHED:', err.message);
    }
}

testBreastGuardian();
