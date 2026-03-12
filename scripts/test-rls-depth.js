const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. Test as Anonymous (Public)
const anonClient = createClient(supabaseUrl, anonKey);

// 2. Test as Authenticated (Simulated)
// Note: We'll use the service key to get a real user ID first, 
// then try to act as that user if possible, or just test the logic.
const adminClient = createClient(supabaseUrl, serviceKey);

async function testRLS() {
    console.log('--- RLS STRESS TEST ---');

    // TEST 1: Anonymous Read of Knowledge Base
    console.log('\n1. Testing Anonymous Knowledge Base Read...');
    const { data: kbAnon, error: kbAnonErr } = await anonClient.from('knowledge_base').select('id, topic').limit(1);
    if (kbAnonErr) {
        console.error('❌ Anon KB Error:', kbAnonErr.message);
    } else {
        console.log('✅ Anon KB Success:', kbAnon ? 'Data returned' : 'No data (correct if empty)');
    }

    // TEST 2: Anonymous Read of FAQs
    console.log('\n2. Testing Anonymous FAQ Read...');
    const { data: faqAnon, error: faqAnonErr } = await anonClient.from('faq_library').select('id, question').limit(1);
    if (faqAnonErr) {
        console.error('❌ Anon FAQ Error:', faqAnonErr.message);
    } else {
        console.log('✅ Anon FAQ Success');
    }

    // TEST 3: Authenticated User Simulation
    console.log('\n3. Fetching a real user to test Authenticated RLS...');
    const { data: users, error: userErr } = await adminClient.from('users').select('id, email, business_unit_id').limit(1);
    
    if (userErr || !users || users.length === 0) {
        console.error('❌ Could not find a user to test with.');
        return;
    }

    const testUser = users[0];
    console.log(`Using Test User: ${testUser.email} (${testUser.id})`);

    // We can't easily "log in" as them without a password, but we can test if the 
    // "users_read_self" policy works by trying to read that specific user 
    // using the anon client (which should fail) vs what we expect.
    
    console.log('\n4. Testing Direct User Access (Should be blocked for Anon)...');
    const { data: userData, error: userDataErr } = await anonClient.from('users').select('*').eq('id', testUser.id);
    if (userDataErr) {
        console.log('✅ Anon User Access Blocked (Correct):', userDataErr.message);
    } else if (userData && userData.length > 0) {
        console.error('⚠️ SECURITY RISK: Anon can read users table!');
    } else {
        console.log('✅ Anon User Access returned empty (Correct)');
    }

    console.log('\n--- TEST COMPLETE ---');
}

testRLS();
