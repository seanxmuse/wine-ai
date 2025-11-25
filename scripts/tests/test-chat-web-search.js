/**
 * Test script for Chat Web Search functionality
 * Tests if chat can trigger web search via user prompts
 */

require('dotenv').config({ path: '.env' });

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function testChatWebSearch() {
  console.log('🧪 Testing Chat Web Search via User Prompts...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: EXPO_PUBLIC_GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found:', GEMINI_API_KEY.substring(0, 10) + '...\n');

  // Test 1: Direct request to use web search
  console.log('📋 TEST 1: User explicitly asks to use web search');
  console.log('   Prompt: "Please use web search to find information about Château Margaux 2015"\n');

  const testPrompt1 = `You are a helpful wine expert assistant. You help users understand wines, make recommendations, and answer questions about wine pairings, tasting notes, and wine selection.

You have access to web search for current wine information, prices, and reviews. Use this capability when users ask about specific wines, current prices, or recent reviews.

User: Please use web search to find information about Château Margaux 2015
Assistant:`;

  await testChatRequest(testPrompt1, 'googleSearchRetrieval', 'TEST 1');

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Implicit request that should trigger web search
  console.log('📋 TEST 2: User asks for current information (should trigger web search)');
  console.log('   Prompt: "What is the current price of Domaine de la Romanée-Conti La Tâche 2018?"\n');

  const testPrompt2 = `You are a helpful wine expert assistant. You help users understand wines, make recommendations, and answer questions about wine pairings, tasting notes, and wine selection.

You have access to web search for current wine information, prices, and reviews. Use this capability when users ask about specific wines, current prices, or recent reviews.

User: What is the current price of Domaine de la Romanée-Conti La Tâche 2018?
Assistant:`;

  await testChatRequest(testPrompt2, 'googleSearchRetrieval', 'TEST 2');

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Compare googleSearchRetrieval vs googleSearch
  console.log('📋 TEST 3: Comparing googleSearchRetrieval vs googleSearch');
  console.log('   Testing which tool name works better\n');

  const testPrompt3 = `You are a helpful wine expert assistant. You help users understand wines, make recommendations, and answer questions about wine pairings, tasting notes, and wine selection.

You have access to web search for current wine information, prices, and reviews. Use this capability when users ask about specific wines, current prices, or recent reviews.

User: Search the web for information about Opus One 2019
Assistant:`;

  console.log('   Testing with googleSearchRetrieval...');
  await testChatRequest(testPrompt3, 'googleSearchRetrieval', 'TEST 3A');

  console.log('\n   Testing with googleSearch...');
  await testChatRequest(testPrompt3, 'googleSearch', 'TEST 3B');

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('✅ ALL TESTS COMPLETED!\n');
}

async function testChatRequest(prompt, toolName, testName) {
  try {
    const toolConfig = {};
    toolConfig[toolName] = {};

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          tools: [toolConfig],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ ${testName} FAILED: API Error`);
      console.error('   Status:', response.status, response.statusText);
      console.error('   Details:', JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const finishReason = data.candidates?.[0]?.finishReason;
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;

    console.log(`📥 ${testName} Response:`);
    console.log('   Finish Reason:', finishReason);
    
    if (groundingMetadata) {
      console.log('   ✅ Web Search Was Used!');
      if (groundingMetadata.webSearchQueries) {
        console.log('   Search Queries:', groundingMetadata.webSearchQueries);
      }
      if (groundingMetadata.groundingChunks) {
        console.log('   Grounding Chunks:', groundingMetadata.groundingChunks.length);
      }
    } else {
      console.log('   ⚠️  No grounding metadata - web search may not have been triggered');
    }

    console.log('\n   Response Text:');
    console.log('   ' + text.substring(0, 500) + (text.length > 500 ? '...' : ''));

    // Check if response mentions searching or current information
    const mentionsSearch = text.toLowerCase().includes('search') || 
                          text.toLowerCase().includes('found') ||
                          text.toLowerCase().includes('according to') ||
                          text.toLowerCase().includes('recent');
    
    if (mentionsSearch && groundingMetadata) {
      console.log('\n   ✅ SUCCESS: Web search was used and response mentions search results');
    } else if (groundingMetadata) {
      console.log('\n   ⚠️  Web search was triggered but response may not reflect it');
    } else {
      console.log('\n   ❌ Web search was NOT triggered');
    }

  } catch (error) {
    console.error(`❌ ${testName} ERROR:`, error.message);
  }
}

// Run the test
console.log('='.repeat(60));
console.log('  CHAT WEB SEARCH TEST');
console.log('='.repeat(60) + '\n');

testChatWebSearch().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

