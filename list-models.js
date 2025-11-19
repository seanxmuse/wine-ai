/**
 * List available Gemini models
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env' });

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function listModels() {
  if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: EXPO_PUBLIC_GEMINI_API_KEY not found');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  console.log('📋 Listing available Gemini models...\n');

  try {
    const models = await genAI.listModels();

    console.log('Available models:');
    console.log('='.repeat(60));

    for (const model of models) {
      console.log(`\n🤖 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\nTotal models: ${models.length}`);

  } catch (error) {
    console.error('❌ Error listing models:', error.message);
  }
}

listModels();
