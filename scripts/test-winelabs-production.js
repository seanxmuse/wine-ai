#!/usr/bin/env node

/**
 * Test Wine Labs proxy endpoints on production
 * Run with: node scripts/test-winelabs-production.js
 */

const API_BASE = 'https://wine-scanner-flax.vercel.app/api/winelabs-proxy';

async function testMatchToLwin() {
  console.log('\n🧪 Testing match_to_lwin_batch...');

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'match_to_lwin_batch',
        body: {
          queries: ['Château Margaux 2015', 'Domaine de la Romanée-Conti'],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed:', response.status, error);
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Sample response:', JSON.stringify(data.slice(0, 1), null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPriceStats() {
  console.log('\n🧪 Testing price_stats...');

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'price_stats',
        body: {
          query: 'Château Margaux 2015',
          region: 'world',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed:', response.status, error);
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Price stats:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Wine Labs Production Proxy Test');
  console.log('===================================');
  console.log('Testing: https://wine-scanner-flax.vercel.app');

  const results = {
    matchToLwin: await testMatchToLwin(),
    priceStats: await testPriceStats(),
  };

  console.log('\n📊 Test Results:');
  console.log('===================================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });

  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);
  process.exit(allPassed ? 0 : 1);
}

runTests();
