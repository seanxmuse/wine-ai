/**
 * Basic Gemini API test (without search)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env' });

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function testBasicGemini() {
  console.log('🧪 Testing basic Gemini API (no search)...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: API key not found');
    process.exit(1);
  }

  console.log('✅ API Key found:', GEMINI_API_KEY.substring(0, 10) + '...\n');

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Try the most basic model first
    console.log('🔍 Trying gemini-pro...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Say hello in 3 words');
      const response = result.response;
      const text = response.text();
      console.log('✅ gemini-pro works!');
      console.log('   Response:', text);
      console.log();
    } catch (e) {
      console.log('❌ gemini-pro failed:', e.message);
    }

    // Try Gemini 1.5 Pro
    console.log('🔍 Trying gemini-1.5-pro...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent('Say hello in 3 words');
      const response = result.response;
      const text = response.text();
      console.log('✅ gemini-1.5-pro works!');
      console.log('   Response:', text);
      console.log();
    } catch (e) {
      console.log('❌ gemini-1.5-pro failed:', e.message);
    }

    // Try with search on 1.5 pro
    console.log('🔍 Trying gemini-1.5-pro WITH Google Search...');
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        tools: [{ googleSearch: {} }],
      });
      const result = await model.generateContent('What is the average price of Château Margaux 2015 wine according to recent search results?');
      const response = result.response;
      const text = response.text();
      console.log('✅ gemini-1.5-pro WITH SEARCH works!');
      console.log('   Response:', text.substring(0, 200) + '...');
      console.log('\n🎉 SUCCESS! Your API key supports Google Search grounding!');
    } catch (e) {
      console.log('❌ gemini-1.5-pro with search failed:', e.message);

      if (e.message.includes('not found') || e.message.includes('404')) {
        console.log('\n⚠️  Google Search might not be available with this API version');
        console.log('   Trying without the "tools" parameter...');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

testBasicGemini();
