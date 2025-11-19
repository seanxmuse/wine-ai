/**
 * Test script for web search functionality using direct HTTP API
 */

require('dotenv').config({ path: '.env' });

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function testWineSearch() {
  console.log('🧪 Testing Wine Web Search (Direct HTTP API)...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: EXPO_PUBLIC_GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found:', GEMINI_API_KEY.substring(0, 10) + '...\n');

  const testWine = 'Château Margaux 2015';

  try {
    console.log(`🔍 Searching for: ${testWine}\n`);

    const prompt = `Search for "${testWine}" wine and extract the following information:

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, no backticks.

Extract:
1. Verified full wine name (official name from producer)
2. Vintage year (if available)
3. Varietal/grape variety (e.g., Cabernet Sauvignon, Pinot Noir, Chardonnay)
4. Region/Appellation (e.g., Napa Valley, Bordeaux, Tuscany)
5. Average retail market price in USD (check Wine-Searcher, Vivino, wine shops)
6. Source of price information
7. Confidence in the match accuracy (0-100, where 100 is certain match)

Return as JSON with this exact structure:
{
  "wineName": "Full official wine name",
  "vintage": "2015",
  "varietal": "Grape variety",
  "region": "Region/Appellation",
  "averagePrice": 450.00,
  "priceSource": "Wine-Searcher average",
  "confidence": 95
}

If any field is not found, use null. If this wine doesn't exist or you can't find reliable information, set confidence to 0.`;

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
          tools: [
            {
              googleSearch: {},
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('   Details:', JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    console.log('📥 Raw API Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      console.error('❌ No text in response');
      process.exit(1);
    }

    console.log('📄 Extracted Text:');
    console.log(text);
    console.log();

    // Try to parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log();

      if (parsed.confidence > 50) {
        console.log('✅ TEST PASSED: High confidence match found!');
        console.log(`   Wine: ${parsed.wineName}`);
        console.log(`   Vintage: ${parsed.vintage}`);
        console.log(`   Varietal: ${parsed.varietal}`);
        console.log(`   Region: ${parsed.region}`);
        console.log(`   Price: $${parsed.averagePrice} (${parsed.priceSource})`);
        console.log(`   Confidence: ${parsed.confidence}%`);
        console.log();
        console.log('🎉 Web search fallback is working correctly!');
      } else {
        console.log('⚠️  LOW CONFIDENCE:', parsed.confidence);
      }
    } else {
      console.log('⚠️  Could not extract JSON from response');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

console.log('='.repeat(60));
console.log('  WINE WEB SEARCH TEST');
console.log('='.repeat(60) + '\n');

testWineSearch();
