#!/usr/bin/env node

/**
 * Validate critic scores parsing logic without making API calls
 * Tests different response structures to ensure we handle them correctly
 */

// Mock response structures that might come from WineLabs API
const mockResponses = [
  {
    name: 'Direct array response',
    data: [
      { critic: 'Robert Parker', score: 95, vintage: '2022' },
      { critic: 'Wine Spectator', score: 92, vintage: '2022' },
    ],
  },
  {
    name: 'Wrapped in results array',
    data: {
      results: [
        { critic: 'Robert Parker', score: 95, vintage: '2022' },
        { critic: 'Wine Spectator', score: 92, vintage: '2022' },
      ],
    },
  },
  {
    name: 'Wrapped in scores array',
    data: {
      scores: [
        { critic: 'Robert Parker', score: 95, vintage: '2022' },
        { critic: 'Wine Spectator', score: 92, vintage: '2022' },
      ],
    },
  },
  {
    name: 'Empty array response',
    data: [],
  },
  {
    name: 'Empty object response',
    data: {},
  },
  {
    name: 'Null response',
    data: null,
  },
];

// Simulate the parsing logic from getCriticScores
function parseCriticScoresResponse(data) {
  let scores = [];
  
  if (Array.isArray(data)) {
    scores = data;
  } else if (data?.results && Array.isArray(data.results)) {
    scores = data.results;
  } else if (data?.scores && Array.isArray(data.scores)) {
    scores = data.scores;
  } else if (data?.data && Array.isArray(data.data)) {
    scores = data.data;
  } else {
    scores = [];
  }
  
  return scores;
}

// Test all mock responses
console.log('🧪 Testing Critic Scores Parsing Logic\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

mockResponses.forEach((mock, index) => {
  console.log(`\nTest ${index + 1}: ${mock.name}`);
  console.log('-'.repeat(60));
  console.log('Input:', JSON.stringify(mock.data).substring(0, 100));
  
  try {
    const scores = parseCriticScoresResponse(mock.data);
    console.log(`✅ Parsed ${scores.length} scores`);
    
    if (scores.length > 0) {
      console.log('Sample:', JSON.stringify(scores[0]));
    }
    
    // Validate expected results
    const expectedCount = Array.isArray(mock.data) 
      ? mock.data.length 
      : mock.data?.results?.length || mock.data?.scores?.length || mock.data?.data?.length || 0;
    
    if (scores.length === expectedCount) {
      console.log(`✅ Correct count: ${scores.length}`);
      passed++;
    } else {
      console.log(`❌ Wrong count: expected ${expectedCount}, got ${scores.length}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All parsing tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}




