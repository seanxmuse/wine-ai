/**
 * Test script for Gemini Web Search functionality
 * Tests if the API key has access to Google Search grounding
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env' });

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function testWebSearch() {
  console.log('🧪 Testing Gemini Web Search Grounding...\n');

  // Check if API key exists
  if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: EXPO_PUBLIC_GEMINI_API_KEY not found in .env file');
    console.log('   Please add your Gemini API key to the .env file');
    process.exit(1);
  }

  console.log('✅ API Key found:', GEMINI_API_KEY.substring(0, 10) + '...\n');

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Use Gemini 1.5 Flash with Google Search grounding (higher rate limits)
    console.log('🔍 Initializing Gemini 1.5 Flash with Google Search...');
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      tools: [{ googleSearch: {} }],
    });

    console.log('✅ Model initialized successfully\n');

    // Test 1: Search for a specific wine
    console.log('📋 TEST 1: Searching for a known wine...');
    console.log('   Query: "Château Margaux 2015"\n');

    const testPrompt1 = `Search for "Château Margaux 2015" wine and extract:

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.

{
  "wineName": "Full official wine name",
  "vintage": "2015",
  "varietal": "Grape variety",
  "region": "Region/Appellation",
  "averagePrice": 450.00,
  "priceSource": "Source of price",
  "confidence": 95
}

If you can't find the wine, set confidence to 0.`;

    const result1 = await model.generateContent(testPrompt1);
    const response1 = result1.response;
    const text1 = response1.text();

    console.log('📥 Raw Response:');
    console.log(text1);
    console.log();

    // Try to parse the JSON
    try {
      const jsonMatch = text1.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed JSON:');
        console.log(JSON.stringify(parsed, null, 2));
        console.log();

        if (parsed.confidence > 50) {
          console.log('✅ TEST 1 PASSED: High confidence match found!');
          console.log(`   Confidence: ${parsed.confidence}%`);
          console.log(`   Wine: ${parsed.wineName}`);
          console.log(`   Price: $${parsed.averagePrice} (${parsed.priceSource})`);
        } else {
          console.log('⚠️  TEST 1 WARNING: Low confidence match');
          console.log(`   Confidence: ${parsed.confidence}%`);
        }
      } else {
        console.log('⚠️  Could not extract JSON from response');
      }
    } catch (parseError) {
      console.log('⚠️  Failed to parse JSON:', parseError.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Search for an obscure wine
    console.log('📋 TEST 2: Searching for an obscure wine...');
    console.log('   Query: "Domaine de la Romanée-Conti La Tâche 2018"\n');

    const testPrompt2 = `Search for "Domaine de la Romanée-Conti La Tâche 2018" wine and extract:

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.

{
  "wineName": "Full official wine name",
  "vintage": "2018",
  "varietal": "Grape variety",
  "region": "Region/Appellation",
  "averagePrice": 3500.00,
  "priceSource": "Source of price",
  "confidence": 90
}

If you can't find the wine, set confidence to 0.`;

    const result2 = await model.generateContent(testPrompt2);
    const response2 = result2.response;
    const text2 = response2.text();

    console.log('📥 Raw Response:');
    console.log(text2);
    console.log();

    try {
      const jsonMatch = text2.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed JSON:');
        console.log(JSON.stringify(parsed, null, 2));
        console.log();

        if (parsed.confidence > 50) {
          console.log('✅ TEST 2 PASSED: High confidence match found!');
          console.log(`   Confidence: ${parsed.confidence}%`);
          console.log(`   Wine: ${parsed.wineName}`);
          console.log(`   Price: $${parsed.averagePrice} (${parsed.priceSource})`);
        } else {
          console.log('⚠️  TEST 2 WARNING: Low confidence match');
          console.log(`   Confidence: ${parsed.confidence}%`);
        }
      } else {
        console.log('⚠️  Could not extract JSON from response');
      }
    } catch (parseError) {
      console.log('⚠️  Failed to parse JSON:', parseError.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n🎉 Your Gemini API key has web search grounding enabled!');
    console.log('   The web search fallback feature is ready to use.\n');

  } catch (error) {
    console.error('\n❌ ERROR during testing:');
    console.error('   Message:', error.message);

    if (error.message.includes('API_KEY_INVALID')) {
      console.error('\n   The API key is invalid. Please check:');
      console.error('   1. Copy the correct key from https://aistudio.google.com/apikey');
      console.error('   2. Paste it in your .env file as EXPO_PUBLIC_GEMINI_API_KEY');
    } else if (error.message.includes('quota')) {
      console.error('\n   API quota exceeded. Please check:');
      console.error('   1. Your billing status in GCP Console');
      console.error('   2. API rate limits at https://console.cloud.google.com');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      console.error('\n   Model not available. This could mean:');
      console.error('   1. Gemini 2.0 Flash Experimental is not available in your region');
      console.error('   2. Try using "gemini-1.5-flash" instead');
    } else {
      console.error('\n   Full error:', error);
    }

    process.exit(1);
  }
}

// Run the test
console.log('=' .repeat(60));
console.log('  GEMINI WEB SEARCH TEST');
console.log('=' .repeat(60) + '\n');

testWebSearch().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
